import { resolve } from "node:path";

import {
	ROOT_DIR,
	SNAPSHOT_DIR,
	loadEnvFile,
	getSetting,
	delay,
	fetchJson,
	writeJsonAtomic,
	mapConcurrent,
	shouldRefresh,
	loadSnapshotCache,
	isForceRefreshRequested,
	createSnapshotEnvelope,
} from "./sync-common.mjs";
import { syncLocalCovers } from "./media-cover-helper.mjs";
import { fetchSteamWishlist } from "./steam-wishlist-helper.mjs";

const SNAPSHOT_FILE = resolve(SNAPSHOT_DIR, "infinitebacklog.json");
const COVERS_DIR = resolve(ROOT_DIR, "public/assets/media/games");

const env = loadEnvFile();
const cliUsername = process.argv.slice(2).find((arg) => !arg.startsWith("-"));
const USERNAME = getSetting("INFINITEBACKLOG_USERNAME", { cliValue: cliUsername, env });
const STEAM_API_KEY = getSetting("STEAM_API_KEY", { env });
const STEAM_ID64 = getSetting("STEAM_ID64", { env });
const STEAM_WISHLIST_LINK = getSetting("STEAM_WISHLIST_LINK", { env });
const FORCE_REFRESH = isForceRefreshRequested();

if (!USERNAME) {
	console.error("[InfiniteBacklog] Error: INFINITEBACKLOG_USERNAME not specified in arguments or .env!");
	process.exit(1);
}

console.log(`[InfiniteBacklog] Starting sync for user: "${USERNAME}"...${FORCE_REFRESH ? " [FORCE REFRESH ENABLED]" : ""}`);
if (STEAM_API_KEY && STEAM_ID64) {
	console.log(`[Steam] Wishlist sync enabled for SteamID64: ${STEAM_ID64}`);
}
// Нормализация жанров (приведение длинных локализованных названий к стандартизированным лаконичным тегам)
const GENRE_MAP = {
	"Экшены": "Action",
	"Приключенческие игры": "Adventure",
	"Ролевые игры": "RPG",
	"Инди": "Indie",
	"Симуляторы": "Simulator",
	"Стратегии": "Strategy",
	"Гонки": "Racing",
	"Спортивные игры": "Sport",
	"Казуальные игры": "Casual",
	"Массовые многопользовательские": "MMO",
	"Бесплатно": "Free to Play",
	"Brawler": "Beat 'em up",
	"Turn-Based Strategy": "TBS",
};

function normalizeGenre(g) {
	if (!g) return "";
	return GENRE_MAP[g] || g;
}


async function main() {
	// 1. Поиск пользователя по username
	console.log(`[InfiniteBacklog] Searching user profile...`);
	const users = await fetchJson(`https://infinitebacklog.net/api/users?search=${encodeURIComponent(USERNAME)}`);
	const user = Array.isArray(users)
		? users.find((candidate) => candidate?.username?.toLowerCase() === USERNAME.toLowerCase())
		: undefined;

	if (!user) {
		throw new Error(`No exact InfiniteBacklog profile match for "${USERNAME}"; refusing to sync a possibly unrelated user.`);
	}

	const userId = user.id;
	console.log(`[InfiniteBacklog] Found user: ${user.username} (ID: ${userId})`);

	// 2. Получение словарей платформ и жанров
	console.log(`[InfiniteBacklog] Fetching dictionaries (platforms, genres)...`);
	let platformsMap = {};
	let genresMap = {};
	try {
		const platforms = await fetchJson("https://infinitebacklog.net/api/platforms");
		platforms.forEach((p) => {
			platformsMap[p.id] = p.name || p.abbreviation;
		});
	} catch (e) {
		console.warn(`[InfiniteBacklog] Warning loading platforms: ${e.message}`);
	}

	try {
		const genres = await fetchJson("https://infinitebacklog.net/api/genres");
		genres.forEach((g) => {
			genresMap[g.id] = g.name;
		});
	} catch (e) {
		console.warn(`[InfiniteBacklog] Warning loading genres: ${e.message}`);
	}

	// 3. Выгрузка коллекции пользователя (с пагинацией)
	console.log(`[InfiniteBacklog] Fetching user game collection...`);
	let allCollectionItems = [];
	let page = 1;
	const limit = 100;

	while (true) {
		const items = await fetchJson(`https://infinitebacklog.net/api/user_collections?user_id=${userId}&limit=${limit}&page=${page}`);
		if (!Array.isArray(items) || items.length === 0) break;
		allCollectionItems.push(...items);
		if (items.length < limit) break;
		page++;
		await delay(100);
	}

	console.log(`[InfiniteBacklog] Total collection entries found: ${allCollectionItems.length}`);

	const cache = loadSnapshotCache(SNAPSHOT_FILE, "id");
	// 4. Нормализация данных и параллельное обогащение метаданными (concurrency = 3)
	console.log(`[InfiniteBacklog] Enriching game details with controlled concurrency (limit=3)...`);
	const normalizedItems = (await mapConcurrent(allCollectionItems, 3, async (entry) => {
		const game = entry.game || {};
		const gameId = game.id || entry.game_id;
		if (!gameId) return null;

		let status = null;
		if (entry.completion === "dropped" || entry.status === "dropped") {
			status = "dropped";
		} else if (entry.status === "playing") {
			status = "playing";
		} else if (entry.status === "played") {
			if (entry.completion === "campaignCompleted" || entry.completion === "completed" || entry.completion === "mastered") {
				status = "completed";
			} else if (entry.completion === "unfinished") {
				status = "onHold";
			} else {
				status = "completed";
			}
		} else if (entry.status === "unplayed") {
			status = "planned";
		} else if (entry.status === "on_hold" || entry.status === "paused") {
			status = "onHold";
		}

		if (!status) return null;

		// Обложка IGDB (t_1080p для максимальной четкости и качества)
		const coverHash = game.cover?.image_id || (game.cover?.url ? game.cover.url.replace(/\.[^.]+$/, "") : null);
		const cover = coverHash ? `https://images.igdb.com/igdb/image/upload/t_1080p/${coverHash}.jpg` : "";

		// Время в часах
		const playtimeMinutes = entry.playtime || 0;
		const hours = Math.round(playtimeMinutes / 60);

		// Оценка: entry.rating.score (1-10)
		let rating = undefined;
		if (entry.rating?.score !== undefined && entry.rating?.score !== null) {
			rating = Number(entry.rating.score);
		}

		// Платформа (все вариации Windows PC / PC сводим к "PC")
		let platform = entry.platform_id ? (platformsMap[entry.platform_id] || "PC") : "PC";
		if (platform === "Windows PC") platform = "PC";

		// Год релиза
		let year = "";
		if (game.first_release_date) {
			year = String(new Date(game.first_release_date * 1000).getFullYear());
		}

		// Проверяем кэш для расширенных данных (синопсис, жанры, баннер)
		const cached = cache.get(String(gameId));
		let description = cached?.description || "";
		let genres = cached?.genres || [];
		let developer = cached?.developer || "";
		let banner = cached?.banner || "";
		let fetchedAt = cached?._fetchedAt;

		if (shouldRefresh(cached, { requiredFields: ["description", "genres"], maxAgeDays: 60, force: FORCE_REFRESH })) {
			try {
				const detailsArr = await fetchJson(`https://infinitebacklog.net/api/games/${gameId}`);
				const details = Array.isArray(detailsArr) ? detailsArr[0] : detailsArr;

				if (details) {
					description = details.summary || details.storyline || "";
					if (Array.isArray(details.genres)) {
						genres = details.genres.map((gid) => normalizeGenre(genresMap[gid] || gid)).filter(Boolean);
					}
					if (details.banner) {
						banner = `https://images.igdb.com/igdb/image/upload/t_screenshot_big/${details.banner}.jpg`;
					}
					fetchedAt = new Date().toISOString();
				}
				await delay(100);
			} catch (e) {
				console.warn(`[InfiniteBacklog] Could not load details for ${game.name || gameId}: ${e.message}`);
			}
		}

		return {
			id: String(gameId),
			title: game.name || "Unknown Game",
			slug: game.slug || "",
			cover,
			banner: banner || cover,
			link: `https://infinitebacklog.net/games/${game.slug || gameId}`,
			status,
			rating,
			hours,
			platform,
			year,
			genres,
			developer,
			description,
			_fetchedAt: fetchedAt,
		};
	})).filter(Boolean);

	console.log(`[InfiniteBacklog] Done processing ${normalizedItems.length} games.`);

	// 5. Синхронизация Steam Wishlist (если настроен STEAM_API_KEY и STEAM_ID64)
	if (STEAM_API_KEY && STEAM_ID64) {
		const existingTitles = new Set(normalizedItems.map((i) => i.title.toLowerCase().trim()));
		const steamNormalized = await fetchSteamWishlist({
			steamApiKey: STEAM_API_KEY,
			steamId64: STEAM_ID64,
			steamWishlistLink: STEAM_WISHLIST_LINK,
			cache,
			existingTitles,
			normalizeGenre,
			forceRefresh: FORCE_REFRESH,
		});
		normalizedItems.push(...steamNormalized);
	}

	await syncLocalCovers(normalizedItems, {
		coversDir: COVERS_DIR,
		publicPrefix: "/assets/media/games",
		getFilename: (item) => `${item.id}.jpg`,
		providerName: "Games",
		forceRefresh: FORCE_REFRESH,
	});

	// Если баннер указывает на id игры, синхронизируем с локальной обложкой
	for (const item of normalizedItems) {
		if (item.banner && item.banner.includes(item.id)) {
			item.banner = item.cover;
		}
	}

	const snapshotPayload = createSnapshotEnvelope({
		provider: "infinitebacklog",
		accountRef: USERNAME,
		items: normalizedItems,
	});

	// 6. Запись в JSON
	writeJsonAtomic(SNAPSHOT_FILE, snapshotPayload);
	console.log(`[InfiniteBacklog + Steam] Successfully saved snapshot to: ${SNAPSHOT_FILE}`);
}

main().catch((err) => {
	console.error("[InfiniteBacklog] Fatal error:", err);
	process.exit(1);
});
