import type { MediaDomain } from "../../../types/mediaCatalog";

export interface BookGoal {
	id: string;
	description: string;
	goal: number;
	progress: number;
	metric: "book" | "page" | string;
	startDate?: string;
	endDate?: string;
	state: string;
}

export interface BookItem {
	id: string;
	userBookId?: string;
	title: string;
	author: string;
	series?: string;
	cover?: string;
	link?: string;
	status: "reading" | "completed" | "planned" | "onHold" | "dropped";
	rating?: number;
	originalRating?: number;
	starred?: boolean;
	progress?: { watched: number; total: number; unit?: string };
	pages?: number;
	year?: string;
	genres?: string[];
	description?: string;
	review?: string;
}

export interface BooksSnapshot {
	updatedAt: string;
	user: {
		id: number;
		username: string;
		name?: string;
	};
	goals: BookGoal[];
	items: BookItem[];
}

export const booksDomain: MediaDomain<BookItem> = {
	key: "books",
	getId: (item) => item.id,
	toCard: (item) => {
		const meta = booksDomain.statusMeta[item.status];
		const pagesLabel = item.pages ? `${item.pages} стр.` : undefined;

		// Filter redundant compound genres, language tags, and secondary noise tags
		const rawGenres = item.genres || [];
		const nonGenreTags = new Set([
			// Languages / translations
			"spanish", "english", "russian", "italian", "french", "german", "japanese",
			"chinese", "korean", "portuguese", "polish", "dutch", "swedish", "turkish",
			"arabic", "latin", "greek", "hebrew", "hindi", "ukrainian", "czech", "hungarian",
			// Format / publication tags
			"audiobook", "ebook", "hardcover", "paperback", "kindle", "novel", "book",
			"books", "fiction", "non-fiction", "nonfiction", "literature",
			// Redundant sub-genre & secondary topic tags (leave primary genres)
			"cancer in adolescence", "realistic fiction", "juvenile fiction",
			"young adult fiction", "romance fiction", "bereavement", "psychology",
			"juvenile", "young adult", "contemporary", "contemporary romance"
		]);

		const filteredGenres = rawGenres.filter((genre) => {
			const lower = genre.trim().toLowerCase();
			if (nonGenreTags.has(lower)) return false;

			const isComposite = genre.includes(" & ") || genre.includes(" / ");
			if (!isComposite) return true;
			const parts = genre.split(/\s*(?:&|\/)\s*/).filter(Boolean);
			const hasConstituent = parts.some((p) =>
				rawGenres.some((g) => g.toLowerCase() === p.toLowerCase()),
			);
			return !hasConstituent;
		});

		return {
			title: item.title,
			cover: item.cover,
			link: item.link,
			rating: item.rating,
			status: item.status,
			statusLabel: meta?.label,
			statusColor: meta?.color,
			statusIcon: meta?.icon,
			progress: item.progress,
			year: item.year,
			authorOrStudio: item.author,
			subMeta: pagesLabel,
			description: item.description,
			genres: filteredGenres,
			badge: item.series,
		};
	},
	searchFields: (item) => [
		item.title,
		item.author,
		item.series,
		item.year,
		...(item.genres || []),
	],
	statusOrder: ["reading", "completed", "planned", "onHold", "dropped"],
	statusMeta: {
		reading: {
			label: "Читаю",
			icon: "material-symbols:menu-book-rounded",
			color: "var(--primary)",
		},
		completed: {
			label: "Прочитано",
			icon: "material-symbols:check-rounded",
			color: "var(--tertiary)",
		},
		planned: {
			label: "В планах",
			icon: "material-symbols:bookmark-rounded",
			color: "var(--secondary)",
		},
		onHold: {
			label: "Отложено",
			icon: "material-symbols:pause-rounded",
			color: "var(--on-surface-variant)",
		},
		dropped: {
			label: "Брошено",
			icon: "material-symbols:close-rounded",
			color: "var(--error)",
		},
	},
	defaultStatus: "",
	sortOptions: [
		{ value: "default", label: "По умолчанию", icon: "material-symbols:format-list-numbered-rounded" },
		{ value: "pages", label: "По страницам", icon: "material-symbols:auto-stories-outline-rounded", toggleDirection: true },
		{ value: "title", label: "По названию", icon: "material-symbols:sort-by-alpha-rounded", toggleDirection: true },
	],
	defaultSort: "default",
	defaultSortOrder: "desc",
	sort: (items, currentSort, sortOrder) => {
		if (currentSort === "default") return items;
		return [...items].sort((a, b) => {
			if (currentSort === "pages") {
				const pagesA = a.pages ?? 0;
				const pagesB = b.pages ?? 0;
				return sortOrder === "asc" ? pagesA - pagesB : pagesB - pagesA;
			}
			if (currentSort === "title") {
				const cmp = a.title.localeCompare(b.title, "ru", { sensitivity: "base" });
				return sortOrder === "asc" ? cmp : -cmp;
			}
			return 0;
		});
	},
	searchPlaceholder: "Поиск...",
	countLabel: (count) => `${count} книг`,
	cardProps: {
		showTitleOnPoster: false,
		aspect: "poster",
		maxNativeWidth: 480,
		columns: 3,
		bookSpine: false,
	},
};
