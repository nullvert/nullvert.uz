import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const SNAPSHOT_DIR = resolve(ROOT_DIR, "shirones/config/data/anime-snapshots");
const SNAPSHOT_FILE = resolve(SNAPSHOT_DIR, "anilist.json");

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
const ANILIST_GRAPHQL_ENDPOINT = "https://graphql.anilist.co";
const USERNAME = process.argv[2] || process.env.ANILIST_USERNAME || env.ANILIST_USERNAME;

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
              seasonYear
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

	const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({
			query,
			variables: { userName },
		}),
	});

	if (!res.ok) {
		throw new Error(
			`AniList API returned HTTP ${res.status}: ${res.statusText}`,
		);
	}

	const data = await res.json();
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

				items.push({
					title,
					status,
					rating,
					progress: {
						watched,
						total: episodes,
					},
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

		if (!existsSync(SNAPSHOT_DIR)) {
			mkdirSync(SNAPSHOT_DIR, { recursive: true });
		}

		const envelope = {
			schemaVersion: 1,
			provider: "anilist",
			fetchedAt: new Date().toISOString(),
			accountRef: USERNAME,
			items,
		};

		writeFileSync(SNAPSHOT_FILE, JSON.stringify(envelope, null, 2), "utf-8");
		console.log(`[AniList] Snapshot saved to: ${SNAPSHOT_FILE}`);
	} catch (err) {
		console.error("[AniList] Sync failed:", err);
		process.exit(1);
	}
}

sync();
