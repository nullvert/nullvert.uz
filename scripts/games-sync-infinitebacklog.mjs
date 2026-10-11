import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { downloadCoverIfMissing, cleanupOrphanedCovers } from "./media-cover-helper.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const SNAPSHOT_DIR = resolve(ROOT_DIR, "shirones/config/data/games-snapshots");
const SNAPSHOT_FILE = resolve(SNAPSHOT_DIR, "infinitebacklog.json");
const COVERS_DIR = resolve(ROOT_DIR, "public/assets/media/games");

function loadEnv() {
	const envPath = resolve(ROOT_DIR, ".env");
	if (!existsSync(envPath)) return {};
	const content = readFileSync(envPath, "utf8");
	const env = {};
	for (const line of content.split("\n")) {
		const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
		if (match) {
			let val = (match[2] || "").trim();
			if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
			if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
			env[match[1]] = val;
		}
	}
	return env;
}

const env = loadEnv();
const USERNAME = process.argv[2] || process.env.INFINITEBACKLOG_USERNAME || env.INFINITEBACKLOG_USERNAME;
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

if (!USERNAME) {
	console.error("[InfiniteBacklog] Error: INFINITEBACKLOG_USERNAME not specified in arguments or .env!");
	process.exit(1);
}

console.log(`[InfiniteBacklog] Starting sync for user: "${USERNAME}"...`);

// Кэш уже сохраненных расширенных данных, чтобы не опрашивать повторно детали
function loadExistingCache() {
	if (!existsSync(SNAPSHOT_FILE)) return new Map();
	try {
		const raw = readFileSync(SNAPSHOT_FILE, "utf8");
		const data = JSON.parse(raw);
		const cache = new Map();
		for (const item of data) {
			if (item.id && (item.description || item.genres?.length || item.banner)) {
				cache.set(item.id, {
					description: item.description,
					genres: item.genres,
					developer: item.developer,
					banner: item.banner,
				});
			}
		}
		return cache;
	} catch {
		return new Map();
	}
}

async function fetchJson(url) {
	const res = await fetch(url, {
		headers: {
			Accept: "application/json",
			"User-Agent": "ShironeBlogSync/1.0",
		},
	});
	if (!res.ok) {
		throw new Error(`HTTP ${res.status}: ${res.statusText} (${url})`);
	}
	return await res.json();
}

async function main() {
	// 1. Поиск пользователя по username
	console.log(`[InfiniteBacklog] Searching user profile...`);
	const users = await fetchJson(`https://infinitebacklog.net/api/users?search=${encodeURIComponent(USERNAME)}`);
	const user = users.find((u) => u.username.toLowerCase() === USERNAME.toLowerCase()) || users[0];

	if (!user) {
		console.error(`[InfiniteBacklog] User "${USERNAME}" not found!`);
		process.exit(1);
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

	const cache = loadExistingCache();
	const normalizedItems = [];

	// 4. Нормализация данных и обогащение метаданными
	for (let i = 0; i < allCollectionItems.length; i++) {
		const entry = allCollectionItems[i];
		const game = entry.game || {};
		const gameId = game.id || entry.game_id;
		if (!gameId) continue;

		// Статусы InfiniteBacklog:
		// status: playing | played | unplayed | noStatus | dropped | on_hold | paused
		// completion: continuous | campaignCompleted | completed | mastered | dropped | unfinished | notStarted | noStatus
		let status = null;
		if (entry.completion === "dropped" || entry.status === "dropped") {
			status = "dropped";
		} else if (entry.status === "playing") {
			status = "playing";
		} else if (entry.status === "played") {
			// Если кампания пройдена или игра полностью завершена
			if (entry.completion === "campaignCompleted" || entry.completion === "completed" || entry.completion === "mastered") {
				status = "completed";
			} else if (entry.completion === "unfinished") {
				// Играл, но не закончил: если брошена не помечено, либо onHold, либо playing
				status = "onHold";
			} else {
				status = "completed";
			}
		} else if (entry.status === "unplayed") {
			status = "planned";
		} else if (entry.status === "on_hold" || entry.status === "paused") {
			status = "onHold";
		}

		// Игры из общей библиотеки без назначенного статуса (noStatus) не включаем в бэклог «В планах»
		if (!status) continue;

		// Обложка IGDB
		const coverHash = game.cover?.image_id || (game.cover?.url ? game.cover.url.replace(/\.[^.]+$/, "") : null);
		const cover = coverHash ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${coverHash}.jpg` : "";

		// Время в часах
		const playtimeMinutes = entry.playtime || 0;
		const hours = Math.round(playtimeMinutes / 60);

		// Оценка: entry.rating.score (1-10) или aggregated_rating (0-100 переводим в 1-10)
		let rating = undefined;
		if (entry.rating?.score !== undefined && entry.rating?.score !== null) {
			rating = Number(entry.rating.score);
		}

		// Платформа
		const platform = entry.platform_id ? (platformsMap[entry.platform_id] || "PC") : "PC";

		// Год релиза
		let year = "";
		if (game.first_release_date) {
			year = String(new Date(game.first_release_date * 1000).getFullYear());
		}

		// Проверяем кэш для расширенных данных (синопсис, жанры, баннер)
		let description = "";
		let genres = [];
		let developer = "";
		let banner = "";

		const cached = cache.get(String(gameId));
		if (cached) {
			description = cached.description || "";
			genres = cached.genres || [];
			developer = cached.developer || "";
			banner = cached.banner || "";
		} else {
			// Запрашиваем детали игры через /api/games/{id}
			try {
				process.stdout.write(`\r[InfiniteBacklog] Fetching details ${i + 1}/${allCollectionItems.length}: ${game.name || gameId}...`);
				const detailsArr = await fetchJson(`https://infinitebacklog.net/api/games/${gameId}`);
				const details = Array.isArray(detailsArr) ? detailsArr[0] : detailsArr;

				if (details) {
					description = details.summary || details.storyline || "";
					if (Array.isArray(details.genres)) {
						genres = details.genres.map((gid) => genresMap[gid] || gid).filter(Boolean);
					}
					if (details.banner) {
						banner = `https://images.igdb.com/igdb/image/upload/t_screenshot_big/${details.banner}.jpg`;
					}
				}
				await delay(120);
			} catch (e) {
				// Ошибка детального запроса — не прерываем работу
			}
		}

		normalizedItems.push({
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
		});
	}

	console.log(`\n[InfiniteBacklog] Done processing ${normalizedItems.length} games.`);

	// Локальное скачивание обложек и Garbage Collection
	console.log(`[InfiniteBacklog] Downloading covers locally to ${COVERS_DIR}...`);
	const activeCoverFilenames = new Set();

	for (let i = 0; i < normalizedItems.length; i++) {
		const item = normalizedItems[i];
		if (!item.cover) continue;

		const filename = `${item.id}.jpg`;
		activeCoverFilenames.add(filename);

		const localFilePath = resolve(COVERS_DIR, filename);
		const publicPath = `/assets/media/games/${filename}`;

		item.cover = await downloadCoverIfMissing(item.cover, localFilePath, publicPath);
		// Баннер оставляем либо локальным, либо оригинальным
		if (item.banner && item.banner.includes(item.id)) {
			item.banner = item.cover;
		}
	}

	cleanupOrphanedCovers(COVERS_DIR, activeCoverFilenames, "InfiniteBacklog");

	// 5. Запись в JSON
	if (!existsSync(SNAPSHOT_DIR)) {
		mkdirSync(SNAPSHOT_DIR, { recursive: true });
	}

	writeFileSync(SNAPSHOT_FILE, JSON.stringify(normalizedItems, null, 2), "utf8");
	console.log(`[InfiniteBacklog] Successfully saved snapshot to: ${SNAPSHOT_FILE}`);
}

main().catch((err) => {
	console.error("[InfiniteBacklog] Fatal error:", err);
	process.exit(1);
});
