import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { cleanupOrphanedCovers } from "./media-cover-helper.mjs";
import sharp from "sharp";
import {
	ROOT_DIR,
	SNAPSHOT_DIR,
	loadEnvFile,
	getSetting,
	fetchJson,
	fetchWithTimeout,
	ensureDir,
	writeJsonAtomic,
} from "./sync-common.mjs";

const SNAPSHOT_FILE = resolve(SNAPSHOT_DIR, "hardcover.json");
const COVERS_DIR = resolve(ROOT_DIR, "public/assets/media/books");

const env = loadEnvFile();
const TOKEN = getSetting("HARDCOVER_TOKEN", { cliValue: process.argv[2], env });

if (!TOKEN) {
	console.error("[Hardcover] Error: HARDCOVER_TOKEN not specified in arguments or .env!");
	process.exit(1);
}

const authHeader = TOKEN.startsWith("Bearer ") ? TOKEN : `Bearer ${TOKEN}`;
const HARDCOVER_ENDPOINT = "https://api.hardcover.app/v1/graphql";

function mapHardcoverStatus(statusId) {
	switch (statusId) {
		case 1:
			return "planned"; // Want to read
		case 2:
			return "reading"; // Currently reading
		case 3:
			return "completed"; // Read
		case 4:
			return "dropped"; // Did not finish (DNF)
		default:
			console.warn(`[Hardcover] Unknown status ID "${statusId}"; defaulting to planned.`);
			return "planned";
	}
}

async function fetchOpenLibrarySubjects(title, author) {
	try {
		const cleanTitle = title.replace(/[:\-–—].*$/, "").trim();
		const q = encodeURIComponent(`${cleanTitle} ${author || ""}`.trim());
		const res = await fetchWithTimeout(`https://openlibrary.org/search.json?q=${q}&limit=3`, { timeoutMs: 5000 });
		if (!res.ok) return [];
		const data = await res.json();
		const docs = data.docs || [];
		for (const doc of docs) {
			if (doc.key) {
				const workRes = await fetchWithTimeout(`https://openlibrary.org${doc.key}.json`, { timeoutMs: 4000 });
				if (workRes.ok) {
					const work = await workRes.json();
					if (Array.isArray(work.subjects) && work.subjects.length > 0) {
						return work.subjects;
					}
				}
			}
			if (Array.isArray(doc.subject) && doc.subject.length > 0) {
				return doc.subject;
			}
		}
	} catch {
		// Silent fallback if OpenLibrary is unreachable
	}
	return [];
}

async function fetchHardcoverData() {
	console.log("[Hardcover] Fetching library and reading goals from Hardcover API...");

	const query = `query BooksData {
		me {
			id
			username
			name
			user_books(order_by: { updated_at: desc }) {
				id
				status_id
				rating
				review
				starred
				created_at
				updated_at
				edition_id
				edition {
					id
					title
					pages
					image {
						url
					}
				}
				user_book_reads {
					id
					progress
					progress_pages
					started_at
					finished_at
				}
				book {
					id
					title
					slug
					pages
					release_year
					rating
					ratings_count
					cached_contributors
					cached_tags
					description
					image {
						url
					}
					editions(where: { image: { url: { _is_null: false } } }, order_by: { users_count: desc }, limit: 10) {
						id
						pages
						image {
							url
						}
					}
					book_series {
						position
						series {
							name
							books_count
						}
					}
				}
			}
		}
		goals(where: { state: { _eq: "active" } }, order_by: { start_date: desc }) {
			id
			description
			goal
			progress
			metric
			start_date
			end_date
			state
		}
	}`;

	const json = await fetchJson(HARDCOVER_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			authorization: authHeader,
		},
		body: JSON.stringify({ query }),
	}, { label: "Hardcover" });
	if (json.errors && json.errors.length > 0) {
		throw new Error(`[Hardcover] GraphQL Error: ${json.errors[0].message}`);
	}

	return json.data;
}

async function main() {
	try {
		const data = await fetchHardcoverData();
		const me = data.me?.[0];
		if (!me) {
			throw new Error("[Hardcover] User profile not found for the provided token.");
		}

		console.log(`[Hardcover] Authenticated as ${me.name || me.username} (@${me.username})`);
		const userBooks = me.user_books || [];
		const goals = data.goals || [];

		console.log(`[Hardcover] Processing ${userBooks.length} books and ${goals.length} active goals...`);

		ensureDir(COVERS_DIR);

		const items = [];
		const activeCoverFilenames = new Set();

		for (const ub of userBooks) {
			const book = ub.book;
			if (!book) continue;

			// Автор(ы)
			let author = "";
			if (Array.isArray(book.cached_contributors) && book.cached_contributors.length > 0) {
				const authors = book.cached_contributors
					.filter((c) => !c.contribution || c.contribution.toLowerCase().includes("author"))
					.map((c) => c.name || c.author?.name)
					.filter(Boolean);
				author = authors.join(", ") || book.cached_contributors[0]?.name || "";
			}

			const bookTitle = ub.edition?.title || book.title || "Без названия";

			// Жанры
			let genres = [];
			if (book.cached_tags?.Genre && Array.isArray(book.cached_tags.Genre)) {
				for (const g of book.cached_tags.Genre) {
					if (!g?.tag) continue;
					const parts = String(g.tag).split(";").map((p) => p.trim()).filter(Boolean);
					for (const part of parts) {
						if (!genres.includes(part)) {
							genres.push(part);
						}
					}
				}
				const NON_GENRE_TAGS = new Set([
					"spanish", "english", "russian", "italian", "french", "german", "japanese",
					"chinese", "korean", "portuguese", "polish", "dutch", "swedish", "turkish",
					"arabic", "latin", "greek", "hebrew", "hindi", "ukrainian", "czech", "hungarian",
					"audiobook", "ebook", "hardcover", "paperback", "kindle", "novel", "book",
					"books", "fiction", "non-fiction", "nonfiction", "literature",
					"cancer in adolescence", "realistic fiction", "juvenile fiction",
					"young adult fiction", "romance fiction", "bereavement", "psychology",
					"juvenile", "young adult", "contemporary", "contemporary romance"
				]);

				// Remove composite umbrella tags and language/noise tags
				genres = genres.filter((genre) => {
					const lower = genre.trim().toLowerCase();
					if (NON_GENRE_TAGS.has(lower)) return false;

					const isComposite = genre.includes(" & ") || genre.includes(" / ");
					if (!isComposite) return true;
					const parts = genre.split(/\s*(?:&|\/)\s*/).filter(Boolean);
					const hasConstituent = parts.some((p) =>
						genres.some((g) => g.toLowerCase() === p.toLowerCase()),
					);
					return !hasConstituent;
				});
			}

			// Если в Hardcover у книги нет жанров (cached_tags пустые), обогащаем из публичного OpenLibrary API
			if (genres.length === 0) {
				const subjects = await fetchOpenLibrarySubjects(bookTitle, author);
				if (subjects.length > 0) {
					const subjectLower = subjects.map((s) => String(s).toLowerCase());
					// Определяем основные жанры по OpenLibrary subjects
					if (subjectLower.some((s) => s.includes("adventure") || s.includes("viajes") || s.includes("castaways") || s.includes("voyages"))) {
						genres.push("Adventure");
					}
					if (subjectLower.some((s) => s.includes("classic") || s.includes("french literature"))) {
						genres.push("Classics");
					}
					if (subjectLower.some((s) => s.includes("science fiction") || s.includes("sci-fi"))) {
						genres.push("Science Fiction");
					}
					if (subjectLower.some((s) => s.includes("soft skills") || s.includes("vocational") || s.includes("interpersonal") || s.includes("employability") || s.includes("career"))) {
						genres.push("Career");
					}
					if (subjectLower.some((s) => s.includes("computer programming") || s.includes("software development") || s.includes("developers"))) {
						genres.push("Programming");
					}
					if (subjectLower.some((s) => s.includes("self-help") || s.includes("personal development") || s.includes("empowerment"))) {
						genres.push("Self-Help");
					}
					if (subjectLower.some((s) => s.includes("thriller") || s.includes("suspense"))) {
						genres.push("Thriller");
					}
					if (subjectLower.some((s) => s.includes("philosophy"))) {
						genres.push("Philosophy");
					}
					if (subjectLower.some((s) => s.includes("business") || s.includes("communication"))) {
						if (!genres.includes("Career")) genres.push("Business");
					}
				}
			}

			// Определение статуса: если у книги открыта активная сессия чтения (started_at без finished_at),
			// считаем её читаемой, либо мапим статус из Hardcover
			const latestRead = ub.user_book_reads?.[0];
			const isActivelyReading = Boolean(latestRead?.started_at && !latestRead?.finished_at && ub.status_id !== 3 && ub.status_id !== 4);
			const computedStatus = isActivelyReading ? "reading" : mapHardcoverStatus(ub.status_id);

			// Количество страниц строго из данных издания/книги Hardcover
			const pagesCount = ub.edition?.pages || latestRead?.edition?.pages || book.pages || undefined;

			// Прогресс чтения
			let progress;
			if (latestRead && (latestRead.progress_pages !== null || latestRead.progress !== null || computedStatus === "reading")) {
				const pages = latestRead.progress_pages || 0;
				const total = pagesCount || book.pages || (latestRead.progress ? Math.round(pages / (latestRead.progress / 100)) : undefined);
				if (total || pages > 0) {
					progress = {
						watched: pages,
						total: total || pages,
						unit: "стр.",
					};
				}
			}

			// Серия: только если в серии действительно больше 1 книги (не одиночное произведение)
			let series;
			if (Array.isArray(book.book_series) && book.book_series.length > 0) {
				const s = book.book_series[0];
				const booksInSeries = s?.series?.books_count ?? 2;
				if (s?.series?.name && booksInSeries > 1) {
					series = s.position ? `${s.series.name} #${s.position}` : s.series.name;
				}
			}

			// Выбор наилучшей вертикальной портретной обложки:
			// Сначала проверяем обложку конкретного выбранного пользователем издания (ub.edition?.image?.url)
			let bestCoverUrl = "";
			const filename = `book_${book.id}_${ub.id}.jpeg`;
			const localPath = resolve(COVERS_DIR, filename);
			const publicUrl = `/assets/media/books/${filename}`;

			// Avoid re-downloading and re-encoding a cover already cached locally.
			try {
				if (existsSync(localPath) && statSync(localPath).size > 0) bestCoverUrl = publicUrl;
			} catch {
				// Treat unreadable cache files as missing; the download path can replace them.
			}

			const userEditionCover = ub.edition?.image?.url;
			if (!bestCoverUrl && userEditionCover) {
				try {
					const res = await fetchWithTimeout(userEditionCover);
					if (res.ok) {
						const buf = Buffer.from(await res.arrayBuffer());
						await sharp(buf)
							.jpeg({ quality: 90 })
							.toFile(localPath);
						bestCoverUrl = publicUrl;
					}
				} catch {
					// Fall through to other candidates
				}
			}

			// Если обложки у выбранного издания нет, перебираем fallback кандидатов
			if (!bestCoverUrl) {
				let coverCandidates = [
					...(book.editions?.map((e) => e.image?.url) || []),
					book.image?.url,
				].filter(Boolean);

				// Отсеиваем очевидные мини-превью (._SX98_.jpg)
				let filteredCandidates = coverCandidates.filter((u) => !u.includes("_SX") && !u.includes("_SY"));
				if (filteredCandidates.length === 0) filteredCandidates = coverCandidates;

				for (const candUrl of filteredCandidates.slice(0, 8)) {
					try {
						const res = await fetchWithTimeout(candUrl);
						if (!res.ok) continue;
						const buf = Buffer.from(await res.arrayBuffer());
						const meta = await sharp(buf).metadata();
						if (meta.width && meta.height) {
							const ratio = meta.width / meta.height;
							if (ratio >= 0.55 && ratio <= 0.85 && meta.height >= 240) {
								await sharp(buf)
									.jpeg({ quality: 90 })
									.toFile(localPath);
								bestCoverUrl = publicUrl;
								break;
							}
						}
					} catch {
						// Fall through
					}
				}

				// Last-resort image is still transcoded to JPEG; never save arbitrary source
				// bytes under a .jpeg filename.
				if (!bestCoverUrl && filteredCandidates[0]) {
					try {
						const res = await fetchWithTimeout(filteredCandidates[0]);
						if (res.ok) {
							const buf = Buffer.from(await res.arrayBuffer());
							await sharp(buf).jpeg({ quality: 90 }).toFile(localPath);
							bestCoverUrl = publicUrl;
						}
					} catch (error) {
						console.warn(`[Hardcover] Could not create cover for ${book.title || book.id}: ${error.message}`);
					}
				}
			}

			let coverUrl = bestCoverUrl;
			if (coverUrl === publicUrl) activeCoverFilenames.add(filename);

			items.push({
				id: String(book.id || ub.id),
				userBookId: String(ub.id),
				title: bookTitle,
				author: author || "Неизвестный автор",
				series,
				cover: coverUrl,
				link: book.slug ? `https://hardcover.app/books/${book.slug}` : undefined,
				status: computedStatus,
				rating: ub.rating ? Number((ub.rating * 2).toFixed(1)) : undefined,
				originalRating: ub.rating,
				review: ub.review || undefined,
				starred: Boolean(ub.starred),
				progress,
				pages: pagesCount,
				year: book.release_year ? String(book.release_year) : undefined,
				genres: genres.length > 0 ? Array.from(new Set(genres)) : undefined,
				description: book.description || undefined,
			});
		}

		const snapshot = {
			updatedAt: new Date().toISOString(),
			user: {
				id: me.id,
				username: me.username,
				name: me.name,
			},
			goals: goals.map((g) => ({
				id: String(g.id),
				description: g.description,
				goal: g.goal,
				progress: g.progress,
				metric: g.metric,
				startDate: g.start_date,
				endDate: g.end_date,
				state: g.state,
			})),
			items,
		};

		writeJsonAtomic(SNAPSHOT_FILE, snapshot);
		cleanupOrphanedCovers(COVERS_DIR, activeCoverFilenames, "Hardcover");
		console.log(`[Hardcover] Success! Snapshot written to ${SNAPSHOT_FILE}`);
		console.log(`[Hardcover] Total books synced: ${items.length}, goals synced: ${goals.length}`);
	} catch (err) {
		console.error("[Hardcover] Sync error:", err);
		process.exit(1);
	}
}

main();
