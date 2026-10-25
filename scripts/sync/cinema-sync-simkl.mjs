import { resolve } from "node:path";

import {
	ROOT_DIR,
	SNAPSHOT_DIR,
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
import { SimklAuthManager } from "./simkl-auth-helper.mjs";

const SNAPSHOT_FILE = resolve(SNAPSHOT_DIR, "simkl.json");
const COVERS_DIR = resolve(ROOT_DIR, "public/assets/media/cinema");

const auth = new SimklAuthManager();
auth.validate();
const FORCE_REFRESH = isForceRefreshRequested();

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
			console.warn(`[Simkl] Unknown status "${status}"; defaulting to completed.`);
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
		return await fetchJson(endpoint, {
			headers: { "simkl-api-key": auth.clientId },
		}, { label: "Simkl details" });
	} catch (error) {
		console.warn(`[Simkl] Could not fetch ${type} details for ${simklId}: ${error.message}`);
		return null;
	}
}

async function syncCinema() {
	console.log(`[Simkl] Fetching cinema library (movies and shows)...${FORCE_REFRESH ? " [FORCE REFRESH ENABLED]" : ""}`);

	const data = await auth.fetchWithAuth("https://api.simkl.com/sync/all-items?extended=full", {}, "Simkl Library");
	const rawMovies = data.movies || [];
	const rawShows = data.shows || [];

	console.log(`[Simkl] Received ${rawMovies.length} movies and ${rawShows.length} shows.`);

	const cache = loadSnapshotCache(SNAPSHOT_FILE, "id");

	// 1. Обработка фильмов параллельным пулом (concurrency = 3)
	console.log("[Simkl] Enriching movie details with controlled concurrency (limit=3)...");
	const movieItems = await mapConcurrent(rawMovies, 3, async (entry) => {
		const m = entry.movie;
		if (!m) return null;

		const id = `movie-${m.ids?.simkl ?? m.title}`;
		const cached = cache.get(id);
		let genres = cached?.genres || [];
		let description = cached?.description;
		let directorOrStudio = cached?.directorOrStudio;
		let fetchedAt = cached?._fetchedAt;

		if (shouldRefresh(cached, { requiredFields: ["description", "genres"], maxAgeDays: 60, force: FORCE_REFRESH })) {
			if (m.ids?.simkl) {
				const details = await fetchDetails("movie", m.ids.simkl);
				if (details) {
					genres = details.genres || [];
					description = details.overview;
					directorOrStudio = details.director;
					fetchedAt = new Date().toISOString();
				}
				await delay(100);
			}
		}

		const link = m.ids?.slug
			? `https://simkl.com/movies/${m.ids.simkl}/${m.ids.slug}`
			: m.ids?.imdb
				? `https://www.imdb.com/title/${m.ids.imdb}/`
				: undefined;

		return {
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
			_fetchedAt: fetchedAt,
		};
	});

	// 2. Обработка сериалов параллельным пулом (concurrency = 3)
	console.log("[Simkl] Enriching show details with controlled concurrency (limit=3)...");
	const showItems = await mapConcurrent(rawShows, 3, async (entry) => {
		const s = entry.show;
		if (!s) return null;

		const id = `show-${s.ids?.simkl ?? s.title}`;
		const cached = cache.get(id);
		let genres = cached?.genres || [];
		let description = cached?.description;
		let directorOrStudio = cached?.directorOrStudio;
		let fetchedAt = cached?._fetchedAt;

		if (shouldRefresh(cached, { requiredFields: ["description", "genres"], maxAgeDays: 60, force: FORCE_REFRESH })) {
			if (s.ids?.simkl) {
				const details = await fetchDetails("show", s.ids.simkl);
				if (details) {
					genres = details.genres || [];
					description = details.overview;
					directorOrStudio = details.network;
					fetchedAt = new Date().toISOString();
				}
				await delay(100);
			}
		}

		const link = s.ids?.slug
			? `https://simkl.com/tv/${s.ids.simkl}/${s.ids.slug}`
			: s.ids?.imdb
				? `https://www.imdb.com/title/${s.ids.imdb}/`
				: undefined;

		const watched = entry.watched_episodes_count || 0;
		const total = entry.total_episodes_count || 0;

		return {
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
			_fetchedAt: fetchedAt,
		};
	});

	const items = [...movieItems.filter(Boolean), ...showItems.filter(Boolean)];

	// Сортировка: Смотрю → Просмотрено → В планах
	items.sort((a, b) => {
		const statusWeight = { watching: 0, completed: 1, planned: 2, onHold: 3, dropped: 4 };
		const diff = (statusWeight[a.status] ?? 9) - (statusWeight[b.status] ?? 9);
		if (diff !== 0) return diff;
		if (b.rating && a.rating && b.rating !== a.rating) return b.rating - a.rating;
		return Number(b.year || 0) - Number(a.year || 0);
	});

	await syncLocalCovers(items, {
		coversDir: COVERS_DIR,
		publicPrefix: "/assets/media/cinema",
		getFilename: (item) => `${item.id}.webp`,
		providerName: "Simkl",
	});

	const snapshotPayload = createSnapshotEnvelope({
		provider: "simkl",
		items,
	});

	writeJsonAtomic(SNAPSHOT_FILE, snapshotPayload);
	console.log(`[Simkl] Successfully saved ${items.length} cinema entries with descriptions & genres to: ${SNAPSHOT_FILE}`);
}

syncCinema().catch((err) => {
	console.error("[Simkl] Sync failed:", err);
	process.exit(1);
});
