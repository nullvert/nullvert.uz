import { resolve } from "node:path";

import {
	ROOT_DIR,
	SNAPSHOT_DIR,
	loadEnvFile,
	getSetting,
	delay,
	fetchJson,
	readJsonFile,
	getSnapshotItems,
	writeJsonAtomic,
	mapConcurrent,
	shouldRefresh,
} from "./sync-common.mjs";
import { syncLocalCovers } from "./media-cover-helper.mjs";

const SNAPSHOT_FILE = resolve(SNAPSHOT_DIR, "infinitebacklog.json");
const COVERS_DIR = resolve(ROOT_DIR, "public/assets/media/games");

const env = loadEnvFile();
const cliUsername = process.argv[2] && !process.argv[2].startsWith("-") ? process.argv[2] : undefined;
const USERNAME = getSetting("INFINITEBACKLOG_USERNAME", { cliValue: cliUsername, env });
const STEAM_API_KEY = getSetting("STEAM_API_KEY", { env });
const STEAM_ID64 = getSetting("STEAM_ID64", { env });
const STEAM_WISHLIST_LINK = getSetting("STEAM_WISHLIST_LINK", { env });
const FORCE_REFRESH = process.argv.includes("--refresh") || process.argv.includes("--force-refresh") || process.env.REFRESH_METADATA === "true";

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

// Кэш уже сохраненных расширенных данных, чтобы не опрашивать повторно детали
function loadExistingCache() {
	const snapshot = readJsonFile(SNAPSHOT_FILE, { fallback: null, warn: true });
	const cache = new Map();
	for (const item of getSnapshotItems(snapshot)) {
		if (item?.id) {
			cache.set(String(item.id), {
				title: item.title,
				description: item.description,
				genres: Array.isArray(item.genres) ? item.genres.map(normalizeGenre) : [],
				developer: item.developer,
				banner: item.banner,
				cover: item.cover,
				headerImage: item.headerImage,
				year: item.year,
				rank: item.rank,
				price: item.price,
				discount: item.discount,
				isFree: item.isFree,
				_fetchedAt: item._fetchedAt,
			});
		}
	}
	return cache;
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

	const cache = loadExistingCache();
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
		console.log(`[Steam] Fetching wishlist for ${STEAM_ID64}...`);
		try {
			const wishlistRes = await fetchJson(`https://api.steampowered.com/IWishlistService/GetWishlist/v1/?key=${encodeURIComponent(STEAM_API_KEY)}&steamid=${encodeURIComponent(STEAM_ID64)}`);
			const wishlistItems = wishlistRes?.response?.items || [];
			console.log(`[Steam] Found ${wishlistItems.length} wishlist entries.`);

			// Создаем множество названий из InfiniteBacklog (в нижнем регистре), чтобы не дублировать
			const existingTitles = new Set(normalizedItems.map((i) => i.title.toLowerCase().trim()));

			const steamNormalized = (await mapConcurrent(wishlistItems, 2, async (wItem, idx) => {
				const appid = wItem.appid;
				if (!appid) return null;

				const steamId = `steam_${appid}`;
				const cached = cache.get(steamId);
				let title = cached?.title || "";
				let description = cached?.description || "";
				let genres = cached?.genres || [];
				let developer = cached?.developer || "";
				let year = cached?.year || "";
				let headerImage = cached?.headerImage || "";
				let price = cached?.price || null;
				let discount = cached?.discount || 0;
				let isFree = cached?.isFree || false;
				let fetchedAt = cached?._fetchedAt;

				if (shouldRefresh(cached, { requiredFields: ["description", "headerImage"], maxAgeDays: 14, force: FORCE_REFRESH }) || !title) {
					try {
						const storeData = await fetchJson(`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=us&l=russian`);
						const data = storeData?.[String(appid)]?.data;
						if (data) {
							title = data.name || title;
							description = data.short_description || "";
							headerImage = data.header_image || headerImage;
							if (Array.isArray(data.genres)) {
								genres = data.genres.map((g) => normalizeGenre(g.description)).filter(Boolean);
							}
							if (Array.isArray(data.developers) && data.developers.length > 0) {
								developer = data.developers.join(", ");
							}
							if (data.release_date?.date) {
								const match = data.release_date.date.match(/\b(19\d\d|20\d\d)\b/);
								if (match) year = match[1];
							}
							isFree = Boolean(data.is_free);
							if (data.price_overview) {
								let p = data.price_overview.final_formatted || "";
								p = p.replace(/\s*(USD|EUR|RUB|UAH)\b/gi, "").trim();
								price = p || null;
								discount = Number(data.price_overview.discount_percent || 0);
							} else if (Array.isArray(data.package_groups) && data.package_groups.length > 0) {
								// Фолбэк на package_groups (например, для игр со сложной структурой пакетов)
								const defaultGroup = data.package_groups.find((g) => g.name === "default") || data.package_groups[0];
								const sub = defaultGroup?.subs?.[0];
								if (sub && sub.price_in_cents_with_discount !== undefined) {
									const rawPrice = (sub.price_in_cents_with_discount / 100).toFixed(2);
									price = `$${rawPrice}`;
									const savings = String(sub.percent_savings_text || "").match(/(\d+)/);
									discount = savings ? Number(savings[1]) : (sub.percent_savings || 0);
								}
							} else if (isFree) {
								price = "Бесплатно";
								discount = 0;
							}
							fetchedAt = new Date().toISOString();
						}
						await delay(200);
					} catch (e) {
						console.warn(`[Steam] Warning fetching details for appid ${appid}: ${e.message}`);
					}
				}

				if (!title) return null;
				// Если такая игра уже есть в библиотеке/коллекции — пропускаем вишлист
				if (existingTitles.has(title.toLowerCase().trim())) {
					return null;
				}

				let cover = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/library_600x900.jpg`;
				const banner = headerImage || `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;

				// Проверяем доступность вертикальной обложки Steam library_600x900
				let hasVerticalCover = false;
				try {
					const headRes = await fetch(cover, { method: "HEAD" });
					if (headRes.ok) {
						hasVerticalCover = true;
					}
				} catch {}

				// Если у Steam нет вертикальной обложки, ищем её в InfiniteBacklog (IGDB)
				if (!hasVerticalCover) {
					try {
						const cleanTitle = title.replace(/[™®:]/g, " ").replace(/\s+/g, " ").trim();
						const titleWords = cleanTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
						const searchQueries = [
							cleanTitle,
							cleanTitle.split(/[:\s-]+/)[0].trim(),
						].filter(Boolean);

						for (const q of searchQueries) {
							if (hasVerticalCover) break;
							const ibResults = await fetchJson(`https://infinitebacklog.net/api/games?query=${encodeURIComponent(q)}`);
							if (!Array.isArray(ibResults) || ibResults.length === 0) continue;

							const targetLower = cleanTitle.toLowerCase();
							// Строгий поиск совпадения: полное совпадение либо сильное совпадение слов
							const match = ibResults.find((g) => {
								if (!g?.cover?.image_id && !g?.cover?.url) return false;
								const gName = (g.name || "").replace(/[™®:]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
								if (gName === targetLower) return true;
								if (gName.includes(targetLower) || targetLower.includes(gName)) return true;
								// Проверка пересечения ключевых слов (не менее 60% общих слов)
								const gWords = gName.split(/\s+/).filter((w) => w.length > 2);
								if (titleWords.length > 0 && gWords.length > 0) {
									const intersection = titleWords.filter((w) => gWords.includes(w));
									if (intersection.length >= Math.ceil(titleWords.length * 0.6)) {
										return true;
									}
								}
								return false;
							});

							if (match) {
								const imgId = match.cover?.image_id || (match.cover?.url ? match.cover.url.replace(/\.[^.]+$/, "") : null);
								if (imgId) {
									cover = `https://images.igdb.com/igdb/image/upload/t_1080p/${imgId}.jpg`;
									hasVerticalCover = true;
									console.log(`[Steam -> InfiniteBacklog] Found cover for "${title}": ${match.name} (${imgId})`);
									break;
								}
							}
						}
					} catch (e) {
						console.warn(`[Steam] InfiniteBacklog cover lookup failed for "${title}": ${e.message}`);
					}
				}

				if (!hasVerticalCover) {
					cover = banner;
				}

				// Порядковый номер в вишлисте (#1, #2, ...)
				const rank = wItem.priority && wItem.priority > 0 ? `#${wItem.priority}` : `#${idx + 1}`;

				return {
					id: steamId,
					title,
					cover,
					banner,
					link: STEAM_WISHLIST_LINK || `https://store.steampowered.com/app/${appid}/`,
					status: "wishlist",
					rating: undefined,
					hours: 0,
					platform: "PC",
					year: year || "",
					genres,
					developer,
					description,
					rank,
					price,
					discount,
					isFree,
					_fetchedAt: fetchedAt,
				};
			})).filter(Boolean);

			console.log(`[Steam] Added ${steamNormalized.length} new wishlist games from Steam.`);
			normalizedItems.push(...steamNormalized);
		} catch (err) {
			console.warn(`[Steam] Failed to sync Steam wishlist: ${err.message}`);
		}
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

	const snapshotPayload = {
		updatedAt: new Date().toISOString(),
		total: normalizedItems.length,
		items: normalizedItems,
	};

	// 6. Запись в JSON
	writeJsonAtomic(SNAPSHOT_FILE, snapshotPayload);
	console.log(`[InfiniteBacklog + Steam] Successfully saved snapshot to: ${SNAPSHOT_FILE}`);
}

main().catch((err) => {
	console.error("[InfiniteBacklog] Fatal error:", err);
	process.exit(1);
});
