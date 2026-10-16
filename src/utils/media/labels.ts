import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";

/**
 * Ключи слоя проекта для каталогов медиа (хранятся в shirones/config/i18nConfig.ts).
 */
export const MEDIA_LABEL = {
	all: "mediaCatalog.all",
	status: "mediaCatalog.status",
	sort: "mediaCatalog.sort",
	source: "mediaCatalog.source",
	options: "mediaCatalog.options",
	optionsAndFilters: "mediaCatalog.optionsAndFilters",
	searchPlaceholder: "mediaCatalog.searchPlaceholder",
	noResults: "mediaCatalog.noResults",

	sortDefault: "mediaCatalog.sortDefault",
	sortYear: "mediaCatalog.sortYear",
	sortRating: "mediaCatalog.sortRating",
	sortTitle: "mediaCatalog.sortTitle",

	// Кино
	cinemaTypeAll: "cinema.typeAll",
	cinemaTypeMovie: "cinema.typeMovie",
	cinemaTypeShow: "cinema.typeShow",
	cinemaSourceLabel: "cinema.sourceLabel",
	cinemaCounts: "cinema.counts",
	cinemaUnitEpisode: "cinema.unitEpisode",
	cinemaUnitMinute: "cinema.unitMinute",

	// Игры
	gamesAll: "games.all",
	gamesPlatformLabel: "games.platformLabel",
	gamesUnitHours: "games.unitHours",
	gamesStatusCompleted: "games.statusCompleted",

	// Общие статусы
	statusWatching: "mediaCatalog.statusWatching",
	statusPlaying: "mediaCatalog.statusPlaying",
	statusCompleted: "mediaCatalog.statusCompleted",
	statusPlanned: "mediaCatalog.statusPlanned",
	statusWishlist: "mediaCatalog.statusWishlist",
	statusOnHold: "mediaCatalog.statusOnHold",
	statusDropped: "mediaCatalog.statusDropped",
} as const;

export function mediaLabel(key: string, fallback: string): string {
	return (i18n(key as unknown as I18nKey) as string) ?? fallback;
}
