import type { MediaDomain } from "../../../types/mediaCatalog";
import { MEDIA_LABEL, mediaLabel } from "../labels";

export interface CinemaItem {
	id: string;
	type: "movie" | "show";
	title: string;
	cover?: string;
	link?: string;
	status: "watching" | "completed" | "planned" | "onHold" | "dropped";
	rating?: number;
	progress?: { watched: number; total: number; unit?: string };
	year?: string;
	runtime?: number;
	genres?: string[];
	directorOrStudio?: string;
	description?: string;
}

export const cinemaDomain: MediaDomain<CinemaItem> = {
	key: "cinema",
	getId: (item) => item.id,
	toCard: (item) => {
		const meta = cinemaDomain.statusMeta[item.status];
		const durationOrType = item.type === "movie"
			? (item.runtime ? `${item.runtime} ${mediaLabel(MEDIA_LABEL.cinemaUnitMinute, "мин.")}` : mediaLabel(MEDIA_LABEL.cinemaTypeMovie, "Фильм"))
			: (item.progress?.total ? `${item.progress.total} ${mediaLabel(MEDIA_LABEL.cinemaUnitEpisode, "эп.")}` : (item.runtime ? `${item.runtime} ${mediaLabel(MEDIA_LABEL.cinemaUnitMinute, "мин.")}/эп.` : mediaLabel(MEDIA_LABEL.cinemaTypeShow, "Сериал")));

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
			authorOrStudio: durationOrType,
			description: item.description,
			genres: item.genres,
		};
	},
	searchFields: (item) => [
		item.title,
		item.year,
		item.directorOrStudio,
		...(item.genres || []),
	],
	statusOrder: ["watching", "completed", "planned", "onHold", "dropped"],
	statusMeta: {
		watching: {
			label: mediaLabel(MEDIA_LABEL.statusWatching, "Смотрю"),
			icon: "material-symbols:play-arrow-rounded",
			color: "var(--primary)",
		},
		completed: {
			label: mediaLabel(MEDIA_LABEL.statusCompleted, "Просмотрено"),
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
		{ value: "default", label: mediaLabel(MEDIA_LABEL.sortDefault, "По умолчанию"), icon: "material-symbols:format-list-numbered-rounded" },
		{ value: "year", label: mediaLabel(MEDIA_LABEL.sortYear, "По году"), icon: "material-symbols:calendar-today-rounded", toggleDirection: true },
		{ value: "rating", label: mediaLabel(MEDIA_LABEL.sortRating, "По оценке"), icon: "material-symbols:star-rounded", toggleDirection: true },
		{ value: "title", label: mediaLabel(MEDIA_LABEL.sortTitle, "По алфавиту"), icon: "material-symbols:sort-by-alpha-rounded", toggleDirection: true },
	],
	defaultSort: "default",
	defaultSortOrder: "desc",
	sources: [
		{ value: "all", label: mediaLabel(MEDIA_LABEL.cinemaTypeAll, "Всё"), icon: "material-symbols:video-library-outline-rounded" },
		{ value: "movie", label: mediaLabel(MEDIA_LABEL.cinemaTypeMovie, "Фильмы"), icon: "material-symbols:movie-outline-rounded" },
		{ value: "show", label: mediaLabel(MEDIA_LABEL.cinemaTypeShow, "Сериалы"), icon: "material-symbols:tv-outline-rounded" },
	],
	sourceLabel: mediaLabel(MEDIA_LABEL.cinemaSourceLabel, "Тип медиа"),
	searchPlaceholder: "Поиск фильма или сериала...",
	countLabel: (count) => `${count} ${mediaLabel(MEDIA_LABEL.cinemaCounts, "наименований")}`,
	filterBySource: (item, source) => source === "all" || item.type === source,
};
