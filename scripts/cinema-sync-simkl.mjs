import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { downloadCoverIfMissing, cleanupOrphanedCovers } from "./media-cover-helper.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const SNAPSHOT_DIR = resolve(ROOT_DIR, "shirones/config/data/cinema-snapshots");
const SNAPSHOT_FILE = resolve(SNAPSHOT_DIR, "simkl.json");
const COVERS_DIR = resolve(ROOT_DIR, "public/assets/media/cinema");

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Читаем .env файл
 */
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
const CLIENT_ID = process.env.SIMKL_CLIENT_ID || env.SIMKL_CLIENT_ID;
const ACCESS_TOKEN = process.env.SIMKL_ACCESS_TOKEN || env.SIMKL_ACCESS_TOKEN;

if (!CLIENT_ID || !ACCESS_TOKEN) {
	console.error("[Simkl] Error: SIMKL_CLIENT_ID or SIMKL_ACCESS_TOKEN not found in .env!");
	process.exit(1);
}

/**
 * Загрузка предыдущего снепшота (для кэша метаданных, чтобы не опрашивать повторно)
 */
function loadExistingCache() {
	if (!existsSync(SNAPSHOT_FILE)) return new Map();
	try {
		const data = JSON.parse(readFileSync(SNAPSHOT_FILE, "utf8"));
		const map = new Map();
		for (const item of data) {
			if (item.id && (item.description || (item.genres && item.genres.length > 0))) {
				map.set(item.id, {
					description: item.description,
					genres: item.genres,
					directorOrStudio: item.directorOrStudio,
				});
			}
		}
		return map;
	} catch {
		return new Map();
	}
}

/**
 * Маппинг статусов Simkl в стандартные статусы
 */
function mapStatus(status) {
	switch (status) {
		case "watching":
			return "watching";
		case "completed":
			return "completed";
		case "plantowatch":
			return "planned";
		case "hold":
			return "onHold";
		case "dropped":
			return "dropped";
		default:
			return "completed";
	}
}

function getPosterUrl(posterPath) {
	if (!posterPath) return undefined;
	return `https://simkl.in/posters/${posterPath}_m.webp`;
}

async function fetchDetails(type, simklId) {
	const endpoint = type === "movie" ? `https://api.simkl.com/movies/${simklId}?extended=full` : `https://api.simkl.com/tv/${simklId}?extended=full`;
	try {
		const res = await fetch(endpoint, {
			headers: { "simkl-api-key": CLIENT_ID },
		});
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	}
}

async function syncCinema() {
	console.log("[Simkl] Fetching cinema library (movies and shows)...");

	const res = await fetch("https://api.simkl.com/sync/all-items?extended=full", {
		headers: {
			Authorization: `Bearer ${ACCESS_TOKEN}`,
			"simkl-api-key": CLIENT_ID,
		},
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`[Simkl] API request failed (${res.status}): ${text}`);
	}

	const data = await res.json();
	const rawMovies = data.movies || [];
	const rawShows = data.shows || [];

	console.log(`[Simkl] Received ${rawMovies.length} movies and ${rawShows.length} shows.`);

	const cache = loadExistingCache();
	const items = [];

	// Обработка фильмов
	console.log("[Simkl] Enriched movie details (genres & overviews)...");
	for (let i = 0; i < rawMovies.length; i++) {
		const entry = rawMovies[i];
		const m = entry.movie;
		if (!m) continue;

		const id = `movie-${m.ids?.simkl ?? m.title}`;
		let genres = [];
		let description;
		let directorOrStudio;

		if (cache.has(id)) {
			const cached = cache.get(id);
			genres = cached.genres || [];
			description = cached.description;
			directorOrStudio = cached.directorOrStudio;
		} else if (m.ids?.simkl) {
			const details = await fetchDetails("movie", m.ids.simkl);
			if (details) {
				genres = details.genres || [];
				description = details.overview;
				directorOrStudio = details.director;
			}
			await delay(120);
		}

		const link = m.ids?.slug
			? `https://simkl.com/movies/${m.ids.simkl}/${m.ids.slug}`
			: m.ids?.imdb
				? `https://www.imdb.com/title/${m.ids.imdb}/`
				: undefined;

		items.push({
			id,
			type: "movie",
			title: m.title,
			cover: getPosterUrl(m.poster),
			link,
			status: mapStatus(entry.status),
			rating: entry.user_rating ? Number(entry.user_rating) : undefined,
			year: m.year ? String(m.year) : undefined,
			runtime: m.runtime,
			genres,
			description,
			directorOrStudio,
			ids: m.ids || {},
			lastWatchedAt: entry.last_watched_at,
		});
	}

	// Обработка сериалов
	console.log("[Simkl] Enriched show details (genres & overviews)...");
	for (let i = 0; i < rawShows.length; i++) {
		const entry = rawShows[i];
		const s = entry.show;
		if (!s) continue;

		const id = `show-${s.ids?.simkl ?? s.title}`;
		let genres = [];
		let description;
		let directorOrStudio;

		if (cache.has(id)) {
			const cached = cache.get(id);
			genres = cached.genres || [];
			description = cached.description;
			directorOrStudio = cached.directorOrStudio;
		} else if (s.ids?.simkl) {
			const details = await fetchDetails("show", s.ids.simkl);
			if (details) {
				genres = details.genres || [];
				description = details.overview;
				directorOrStudio = details.network;
			}
			await delay(120);
		}

		const link = s.ids?.slug
			? `https://simkl.com/tv/${s.ids.simkl}/${s.ids.slug}`
			: s.ids?.imdb
				? `https://www.imdb.com/title/${s.ids.imdb}/`
				: undefined;

		const watched = entry.watched_episodes_count || 0;
		const total = entry.total_episodes_count || 0;

		items.push({
			id,
			type: "show",
			title: s.title,
			cover: getPosterUrl(s.poster),
			link,
			status: mapStatus(entry.status),
			rating: entry.user_rating ? Number(entry.user_rating) : undefined,
			progress: total > 0 ? { watched, total, unit: "эп." } : undefined,
			year: s.year ? String(s.year) : undefined,
			runtime: s.runtime,
			genres,
			description,
			directorOrStudio,
			ids: s.ids || {},
			lastWatchedAt: entry.last_watched_at,
		});
	}

	// Сортировка: Смотрю → Просмотрено → В планах
	items.sort((a, b) => {
		const statusWeight = { watching: 0, completed: 1, planned: 2, onHold: 3, dropped: 4 };
		const diff = (statusWeight[a.status] ?? 9) - (statusWeight[b.status] ?? 9);
		if (diff !== 0) return diff;
		if (b.rating && a.rating && b.rating !== a.rating) return b.rating - a.rating;
		return Number(b.year || 0) - Number(a.year || 0);
	});

	// Локальное скачивание постеров и Garbage Collection
	console.log(`[Simkl] Downloading posters locally to ${COVERS_DIR}...`);
	const activeCoverFilenames = new Set();

	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		if (!item.cover) continue;

		const filename = `${item.id}.webp`;
		activeCoverFilenames.add(filename);

		const localFilePath = resolve(COVERS_DIR, filename);
		const publicPath = `/assets/media/cinema/${filename}`;

		// Скачиваем или берём готовый из кэша
		item.cover = await downloadCoverIfMissing(item.cover, localFilePath, publicPath);
	}

	// Очищаем старые постеры, которых больше нет в коллекции
	cleanupOrphanedCovers(COVERS_DIR, activeCoverFilenames, "Simkl");

	if (!existsSync(SNAPSHOT_DIR)) {
		mkdirSync(SNAPSHOT_DIR, { recursive: true });
	}

	writeFileSync(SNAPSHOT_FILE, JSON.stringify(items, null, 2), "utf8");
	console.log(`[Simkl] Successfully saved ${items.length} cinema entries with descriptions & genres to: ${SNAPSHOT_FILE}`);
}

syncCinema().catch((err) => {
	console.error("[Simkl] Sync failed:", err);
	process.exit(1);
});
