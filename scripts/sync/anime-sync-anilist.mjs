import { resolve } from "node:path";

import {
	ROOT_DIR,
	SNAPSHOT_DIR,
	loadEnvFile,
	getSetting,
	fetchJson,
	writeJsonAtomic,
	inferImageExtension,
	createSnapshotEnvelope,
} from "./sync-common.mjs";
import { syncLocalCovers } from "./media-cover-helper.mjs";

const SNAPSHOT_FILE = resolve(SNAPSHOT_DIR, "anilist.json");
const COVERS_DIR = resolve(ROOT_DIR, "public/assets/media/anime");

const env = loadEnvFile();
const ANILIST_GRAPHQL_ENDPOINT = "https://graphql.anilist.co";
const USERNAME = getSetting("ANILIST_USERNAME", { cliValue: process.argv[2], env });

if (!USERNAME) {
	console.error("[AniList] Error: ANILIST_USERNAME not specified in arguments or .env!");
	process.exit(1);
}

/**
 * Преобразование статуса AniList в стандартный статус темы (AnimeStatus)
 */
function mapAniListStatus(status) {
	switch (status) {
		case "CURRENT":
			return "watching";
		case "COMPLETED":
			return "completed";
		case "PLANNING":
			return "planned";
		case "PAUSED":
			return "onHold";
		case "DROPPED":
			return "dropped";
		default:
			console.warn(`[AniList] Unknown list status "${status}"; defaulting to completed.`);
			return "completed";
	}
}

/**
 * Запрос GraphQL к AniList
 */
async function fetchAniListUserAnime(userName) {
	const query = `
    query ($userName: String) {
      MediaListCollection(userName: $userName, type: ANIME) {
        lists {
          name
          status
          isCustomList
          entries {
            status
            score(format: POINT_10_DECIMAL)
            progress
            repeat
            media {
              id
              title {
                romaji
                english
                native
              }
              coverImage {
                extraLarge
                large
              }
              episodes
              season
              seasonYear
              format
              averageScore
              startDate { year month day }
              genres
              studios(isMain: true) {
                nodes { name }
              }
              description(asHtml: false)
              siteUrl
            }
          }
        }
      }
    }
  `;

	console.log(`[AniList] Fetching anime list for user "${userName}"...`);

	const data = await fetchJson(ANILIST_GRAPHQL_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({
			query,
			variables: { userName },
		}),
	}, { label: "AniList" });
	if (data.errors && data.errors.length > 0) {
		throw new Error(
			`AniList GraphQL Error: ${data.errors.map((e) => e.message).join("; ")}`,
		);
	}

	return data.data?.MediaListCollection?.lists || [];
}

/**
 * Очистка описания от HTML/тегов и спойлеров
 */
function cleanDescription(desc) {
	if (!desc) return undefined;
	return desc
		.replace(/<[^>]+>/g, " ")
		.replace(/~![^~]*!~/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * Главная функция синхронизации
 */
async function sync() {
	try {
		const lists = await fetchAniListUserAnime(USERNAME);
		const seenIds = new Set();
		const items = [];

		for (const list of lists) {
			const entries = list.entries || [];
			for (const entry of entries) {
				const media = entry.media;
				if (!media || !media.id) continue;
				if (seenIds.has(media.id)) continue;
				seenIds.add(media.id);

				const title =
					media.title?.english ||
					media.title?.romaji ||
					media.title?.native ||
					"Untitled";

				const status = mapAniListStatus(entry.status);
				const rating =
					typeof entry.score === "number" && entry.score > 0
						? Number(entry.score.toFixed(1))
						: 0;

				const episodes = media.episodes || 0;
				const watched = entry.progress || 0;

				const cover =
					media.coverImage?.extraLarge ||
					media.coverImage?.large ||
					undefined;

				const year = media.seasonYear
					? String(media.seasonYear)
					: media.startDate?.year
						? String(media.startDate.year)
						: "";

				const studio = media.studios?.nodes?.[0]?.name;
				const genres = Array.isArray(media.genres) ? media.genres : [];
				const description = cleanDescription(media.description);
				const link = media.siteUrl || `https://anilist.co/anime/${media.id}`;
				const format = media.format || undefined;
				const season = media.season || undefined;
				const repeat = typeof entry.repeat === "number" && entry.repeat > 0 ? entry.repeat : undefined;
				const communityRating = typeof media.averageScore === "number" && media.averageScore > 0 ? media.averageScore : undefined;

				items.push({
					id: `anime-${media.id}`,
					title,
					status,
					rating,
					communityRating,
					progress: {
						watched,
						total: episodes,
					},
					repeat,
					format,
					season,
					cover,
					link,
					description,
					year,
					studio,
					genres,
					identity: {
						provider: "anilist",
						subjectId: String(media.id),
					},
				});
			}
		}

		console.log(`[AniList] Successfully parsed ${items.length} anime entries.`);

		await syncLocalCovers(items, {
			coversDir: COVERS_DIR,
			publicPrefix: "/assets/media/anime",
			getFilename: (item, i) => {
				const id = item.identity?.subjectId || String(i);
				const ext = inferImageExtension(item.cover, "jpg");
				return `${id}.${ext}`;
			},
			providerName: "AniList",
		});

		const envelope = createSnapshotEnvelope({
			provider: "anilist",
			accountRef: USERNAME,
			items,
		});

		writeJsonAtomic(SNAPSHOT_FILE, envelope);
		console.log(`[AniList] Snapshot saved to: ${SNAPSHOT_FILE}`);
	} catch (err) {
		console.error("[AniList] Sync failed:", err);
		process.exit(1);
	}
}

sync();
