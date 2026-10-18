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

	// Книги
	booksAll: "books.all",
	booksCounts: "books.counts",
	booksReading: "books.reading",
	booksCompleted: "books.completed",
	booksPlanned: "books.planned",
	booksOnHold: "books.onHold",
	booksDropped: "books.dropped",
	booksSortPages: "books.sortPages",
	booksSortTitle: "books.sortTitle",
	booksProgress: "books.progress",
	booksUnitPages: "books.unitPages",
	booksGenres: "books.genres",
	booksChallenge: "books.challenge",
	booksDaysLeft: "books.daysLeft",
	booksReadingGoal: "books.readingGoal",
	booksMetricBooks: "books.metricBooks",
	booksMetricPages: "books.metricPages",

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
