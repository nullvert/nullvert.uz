import type { MediaDomain } from "../../../types/mediaCatalog";
import { ANIME_STATUS_META } from "@utils/anime/status";
import { i18n } from "@i18n/translation";
import I18nKey from "@i18n/i18nKey";
import { MEDIA_LABEL, mediaLabel } from "../labels";
import type { AnimeItem } from "shirones/src/data/anime.ts";

export const animeDomain: MediaDomain<AnimeItem> = {
	key: "anime",
	getId: (item) => item.identity?.subjectId || item.title,
	toCard: (anime) => {
		const meta = ANIME_STATUS_META[anime.status];
		const icon = anime.status === "planned" ? "material-symbols:bookmark-rounded" : meta?.icon;
		return {
			title: anime.title,
			cover: anime.cover,
			link: anime.link,
			rating: anime.rating,
			status: anime.status,
			statusLabel: meta ? i18n(meta.key) : undefined,
			statusColor: meta ? meta.color : undefined,
			statusIcon: icon,
			progress: anime.status === "watching" && anime.progress ? {
				watched: anime.progress.watched,
				total: anime.progress.total,
				unit: "эп.",
			} : undefined,
			year: anime.year,
			authorOrStudio: anime.studio,
			description: anime.description,
			genres: anime.genres,
		};
	},
	searchFields: (anime) => [
		anime.title,
		anime.description,
		anime.studio,
		anime.year,
		...(anime.genres || []),
	],
	statusOrder: ["watching", "completed", "planned", "onHold", "dropped"],
	statusMeta: {
		watching: {
			label: i18n(ANIME_STATUS_META.watching.key),
			icon: ANIME_STATUS_META.watching.icon,
			color: ANIME_STATUS_META.watching.color,
		},
		completed: {
			label: i18n(ANIME_STATUS_META.completed.key),
			icon: ANIME_STATUS_META.completed.icon,
			color: ANIME_STATUS_META.completed.color,
		},
		planned: {
			label: i18n(ANIME_STATUS_META.planned.key),
			icon: "material-symbols:bookmark-rounded",
			color: ANIME_STATUS_META.planned.color,
		},
		onHold: {
			label: i18n(ANIME_STATUS_META.onHold.key),
			icon: ANIME_STATUS_META.onHold.icon,
			color: ANIME_STATUS_META.onHold.color,
		},
		dropped: {
			label: i18n(ANIME_STATUS_META.dropped.key),
			icon: ANIME_STATUS_META.dropped.icon,
			color: ANIME_STATUS_META.dropped.color,
		},
	},
	defaultStatus: "",
	prepare: (items) => {
		const STATUS_WEIGHT: Record<string, number> = {
			watching: 5,
			completed: 4,
			onHold: 3,
			planned: 2,
			dropped: 1,
		};
		return [...items].sort((a, b) => (STATUS_WEIGHT[b.status] ?? 0) - (STATUS_WEIGHT[a.status] ?? 0));
	},
	sortOptions: [
		{ value: "default", label: mediaLabel(MEDIA_LABEL.sortDefault, "По умолчанию"), icon: "material-symbols:format-list-numbered-rounded" },
		{ value: "year", label: mediaLabel(MEDIA_LABEL.sortYear, "По году"), icon: "material-symbols:calendar-today-rounded", toggleDirection: true },
		{ value: "rating", label: mediaLabel(MEDIA_LABEL.sortRating, "По оценке"), icon: "material-symbols:star-rounded", toggleDirection: true },
		{ value: "title", label: mediaLabel(MEDIA_LABEL.sortTitle, "По алфавиту"), icon: "material-symbols:sort-by-alpha-rounded", toggleDirection: true },
	],
	defaultSort: "default",
	defaultSortOrder: "desc",
	searchPlaceholder: "Поиск аниме...",
	countLabel: (count) => `${count} ${i18n(I18nKey.animeCounts)}`,
	cardProps: {
		showTitleOnPoster: true,
	},
	hooks: {
		onStatusChange: (newStatus, ctx) => {
			if (newStatus && newStatus !== "completed" && ctx.currentSort === "rating") {
				ctx.setSort("default");
			}
		},
		onSortChange: (newSort, ctx) => {
			if (newSort === "rating" && ctx.selectedStatus !== "completed") {
				ctx.setStatus("completed");
			}
		},
	},
};
