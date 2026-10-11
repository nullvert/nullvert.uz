import type { MediaDomain } from "../../../types/mediaCatalog";
import { MEDIA_LABEL, mediaLabel } from "../labels";
import { dedupeById } from "../catalogFilter";

export interface GameItem {
	id: string;
	title: string;
	slug?: string;
	cover?: string;
	banner?: string;
	link?: string;
	status: "playing" | "completed" | "planned" | "onHold" | "dropped";
	rating?: number;
	hours?: number;
	platform?: string;
	year?: string;
	genres?: string[];
	developer?: string;
	description?: string;
}

const STATUS_PRIORITY: Record<string, number> = {
	completed: 5,
	playing: 4,
	onHold: 3,
	dropped: 2,
	planned: 1,
};

export const gamesDomain: MediaDomain<GameItem> = {
	key: "games",
	getId: (item) => item.id,
	toCard: (item) => {
		const meta = gamesDomain.statusMeta[item.status];
		const timeOrPlatform = item.hours && item.hours > 0
			? `${item.hours} ${mediaLabel(MEDIA_LABEL.gamesUnitHours, "ч.")}`
			: (item.platform || "PC");

		return {
			title: item.title,
			cover: item.cover || item.banner,
			link: item.link,
			rating: item.rating,
			status: item.status,
			statusLabel: meta?.label,
			statusColor: meta?.color,
			statusIcon: meta?.icon,
			year: item.year,
			authorOrStudio: timeOrPlatform,
			description: item.description,
			genres: item.genres,
		};
	},
	searchFields: (item) => [
		item.title,
		item.year,
		item.developer,
		item.platform,
		...(item.genres || []),
	],
	statusOrder: ["playing", "completed", "planned", "onHold", "dropped"],
	statusMeta: {
		playing: {
			label: mediaLabel(MEDIA_LABEL.statusPlaying, "Играю"),
			icon: "material-symbols:sports-esports-outline-rounded",
			color: "var(--primary)",
		},
		completed: {
			label: mediaLabel(MEDIA_LABEL.statusCompleted, "Пройдено"),
			icon: "material-symbols:check-rounded",
			color: "var(--tertiary)",
		},
		planned: {
			label: mediaLabel(MEDIA_LABEL.statusPlanned, "В планах"),
			icon: "material-symbols:bookmark-rounded",
			color: "var(--secondary)",
		},
		onHold: {
			label: mediaLabel(MEDIA_LABEL.statusOnHold, "Отложено"),
			icon: "material-symbols:pause-rounded",
			color: "var(--on-surface-variant)",
		},
		dropped: {
			label: mediaLabel(MEDIA_LABEL.statusDropped, "Брошено"),
			icon: "material-symbols:close-rounded",
			color: "var(--error)",
		},
	},
	defaultStatus: "",
	sortOptions: [
		{ value: "title", label: mediaLabel(MEDIA_LABEL.sortTitle, "По алфавиту"), icon: "material-symbols:sort-by-alpha-rounded", toggleDirection: true },
		{ value: "rating", label: mediaLabel(MEDIA_LABEL.sortRating, "По оценке"), icon: "material-symbols:star-rounded", toggleDirection: true },
	],
	defaultSort: "title",
	defaultSortOrder: "asc",
	sourceLabel: mediaLabel(MEDIA_LABEL.gamesPlatformLabel, "Платформа"),
	searchPlaceholder: "Поиск игры по названию, жанру...",
	countLabel: (count) => `${count} игр`,
	prepare: (raw) => {
		return dedupeById(raw, (i) => i.id, (i) => STATUS_PRIORITY[i.status] ?? 0);
	},
	filterBySource: (item, source) => {
		return source === "all" || (item.platform || "Windows PC") === source;
	},
	hooks: {
		onStatusChange: (newStatus, ctx) => {
			if (newStatus && ctx.currentSort === "rating") {
				// Если в выбранном статусе нет оценок, сбрасываем на алфавит
				ctx.setSort("title");
			}
		},
		onSortChange: (newSort, ctx) => {
			if (newSort === "rating") {
				ctx.setOrder("desc");
				ctx.setStatus("");
			} else if (newSort === "title") {
				ctx.setOrder("asc");
			}
		},
		preFilter: (item, ctx) => {
			if (ctx.currentSort === "rating" && !ctx.selectedStatus && (item.rating == null || item.rating <= 0)) {
				return false;
			}
			return true;
		},
	},
};
