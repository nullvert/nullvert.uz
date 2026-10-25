import { resolve } from "node:path";

import {
	ROOT_DIR,
	loadEnvFile,
	getSetting,
	fetchJson,
	writeTextAtomic,
	writeJsonAtomic,
	createSnapshotEnvelope,
} from "./sync-common.mjs";
const COMPASS_DATA_FILE = resolve(ROOT_DIR, "shirones/config/data/compass.ts");

const env = loadEnvFile();
const TOKEN = getSetting("RAINDROP_TOKEN", { env });
const PARENT_COLLECTION_ID = getSetting("RAINDROP_COLLECTION_ID", { env, fallback: "76086398" });

if (!TOKEN) {
	console.error("[Raindrop] Error: RAINDROP_TOKEN is missing in .env!");
	process.exit(1);
}

const HEADERS = {
	Authorization: `Bearer ${TOKEN}`,
	"Content-Type": "application/json",
};

/**
 * Преобразует название папки в безопасный латинский id/key (slug)
 */
function slugify(text) {
	const ruMap = {
		а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
		з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
		п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
		ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
		і: "i", ї: "yi", є: "ye", ґ: "g",
	};

	const transliterated = String(text ?? "")
		.toLowerCase()
		.split("")
		.map((char) => ruMap[char] ?? char)
		.join("");

	return transliterated
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "") // удаление диакритических знаков
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "") || "shelf";
}

/**
 * Получение всех подколлекций Raindrop
 */
async function fetchCollections() {
	const data = await fetchJson("https://api.raindrop.io/rest/v1/collections/childrens", {
		headers: HEADERS,
	}, { label: "Raindrop collections" });
	return data.items || [];
}

/**
 * Получение закладок для конкретной коллекции с постраничной загрузкой
 */
async function fetchRaindropsInCollection(collectionId) {
	const items = [];
	let page = 0;
	const perpage = 50;

	while (true) {
		const data = await fetchJson(
			`https://api.raindrop.io/rest/v1/raindrops/${collectionId}?perpage=${perpage}&page=${page}`,
			{ headers: HEADERS },
			{ label: `Raindrop collection ${collectionId}` },
		);
		const drops = data.items || [];
		items.push(...drops);

		if (drops.length < perpage) {
			break;
		}
		page++;
	}

	return items;
}

/**
 * Извлекает чистое доменное имя для иконки / отображения
 */
function extractDomain(urlStr) {
	try {
		return new URL(urlStr).hostname.replace(/^www\./, "");
	} catch {
		return "";
	}
}

async function main() {
	console.log(`[Raindrop] Fetching collections for parent collection ID: ${PARENT_COLLECTION_ID}...`);
	const allCollections = await fetchCollections();

	// Находим подпапки, у которых родитель — PARENT_COLLECTION_ID
	const childCollections = allCollections.filter(
		(col) => String(col.parent?.$id) === String(PARENT_COLLECTION_ID),
	);

	if (childCollections.length === 0) {
		console.warn(`[Raindrop] Warning: No child collections found for parent ID ${PARENT_COLLECTION_ID}.`);
		console.log("[Raindrop] Checking if parent collection itself has bookmarks...");
		childCollections.push({
			_id: PARENT_COLLECTION_ID,
			title: "Общее",
		});
	}

	const shelves = [];

	for (const col of childCollections) {
		console.log(`[Raindrop] Fetching bookmarks for collection "${col.title}" (ID: ${col._id})...`);
		const drops = await fetchRaindropsInCollection(col._id);

		if (drops.length === 0) {
			console.log(`[Raindrop] Skipping empty collection "${col.title}".`);
			continue;
		}

		const entries = drops.map((drop) => {
			const href = typeof drop.link === "string" ? drop.link : "";
			const domain = extractDomain(href);
			const label = drop.title?.trim() || domain || "Без названия";
			const note = (drop.note?.trim() || drop.excerpt?.trim() || domain).trim();

			// Проверка на репозиторий GitHub: github.com/{owner}/{repo}
			let faviconUrl;
			const ghMatch = href.match(/^https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9_\-]+)(?:\/([a-zA-Z0-9_\-\.]+))?/);
			if (ghMatch && ghMatch[1] && !["orgs", "topics", "features", "collections", "trending"].includes(ghMatch[1])) {
				const owner = ghMatch[1];
				// Аватар владельца репозитория вместо однообразного октокота
				faviconUrl = `https://github.com/${owner}.png?size=64`;
			} else if (domain) {
				faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
			}

			return {
				label,
				href,
				note,
				icon: faviconUrl,
			};
		});

		shelves.push({
			key: slugify(col.title),
			name: col.title,
			entries,
		});
	}

	console.log(`[Raindrop] Generated ${shelves.length} shelves with ${shelves.reduce((acc, s) => acc + s.entries.length, 0)} total links.`);

	// 1. Запись стандартизированного снапшота в src/data/snapshots/bookmarks.json
	const SNAPSHOT_FILE = resolve(ROOT_DIR, "src/data/snapshots/bookmarks.json");
	const snapshotPayload = createSnapshotEnvelope({
		provider: "raindrop",
		items: shelves,
		extra: {
			totalLinks: shelves.reduce((acc, s) => acc + s.entries.length, 0),
		},
	});
	writeJsonAtomic(SNAPSHOT_FILE, snapshotPayload);
	console.log(`[Raindrop] Successfully saved snapshot to ${SNAPSHOT_FILE}`);

	// 2. Обратная совместимость: компактный compass.ts импортирует снапшот
	const compatContent = `/**
 * Автоматически сгенерированный адаптер для обратной совместимости.
 * Первичный снапшот хранится в src/data/snapshots/bookmarks.json
 */
import type { CompassShelf } from "@/types/compass";
import snapshot from "../../../src/data/snapshots/bookmarks.json";

export const compassData = (snapshot.items || []) as CompassShelf[];
`;
	writeTextAtomic(COMPASS_DATA_FILE, compatContent);
	console.log(`[Raindrop] Updated compatibility module ${COMPASS_DATA_FILE}`);
}

main().catch((err) => {
	console.error("[Raindrop] Fatal error:", err);
	process.exit(1);
});
