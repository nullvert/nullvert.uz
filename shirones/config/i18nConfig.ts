import I18nKey from "@i18n/i18nKey";
import type { I18nConfig } from "@/types/i18nConfig.ts";
import { withUserConfig } from "@/utils/config-overlay.ts";

const ru: Partial<Record<I18nKey | string, string>> = {
	// ── Навигация ──
	[I18nKey.home]: "Главная",
	[I18nKey.about]: "О блоге",
	[I18nKey.archive]: "Архив",
	[I18nKey.archiveGroup]: "Группировать по",
	[I18nKey.archiveGroupYear]: "По годам",
	[I18nKey.archiveGroupCategory]: "По категориям",
	[I18nKey.archiveGroupTag]: "По тегам",
	[I18nKey.search]: "Поиск",
	[I18nKey.clear]: "Очистить",

	// ── Друзья ──
	[I18nKey.friends]: "Друзья",
	[I18nKey.friendsNoResults]: "Ничего не найдено",
	[I18nKey.friendsBanner]:
		"Всегда рад обмену ссылками — подробнее на странице «О блоге».",
	[I18nKey.friendsCount]: "друг",
	[I18nKey.friendsCounts]: "друзей",

	// ── Заметки ──
	[I18nKey.moments]: "Заметки",
	[I18nKey.momentsNoResults]: "Заметок не найдено",
	[I18nKey.momentsBanner]:
		"Короткие записи — мысли, события и фрагменты жизни.",
	[I18nKey.momentsCount]: "заметка",
	[I18nKey.momentsCounts]: "заметок",
	[I18nKey.pinned]: "Закреплено",
	[I18nKey.loadMore]: "Загрузить еще",

	// ── Аниме ──
	[I18nKey.anime]: "Аниме",
	[I18nKey.animeBanner]:
		"Список аниме — просмотренное, текущее и запланированное.",
	[I18nKey.animeNoResults]: "Тайтлов не найдено",
	[I18nKey.animeCounts]: "тайтлов",
	[I18nKey.animeStatusWatching]: "Смотрю",
	[I18nKey.animeStatusCompleted]: "Просмотрено",
	[I18nKey.animeStatusPlanned]: "В планах",
	[I18nKey.animeStatusOnHold]: "Отложено",
	[I18nKey.animeStatusDropped]: "Брошено",
	[I18nKey.animeSourceLocal]: "Локальная коллекция",
	[I18nKey.animeSourceBangumi]: "Bangumi",
	[I18nKey.animeSourceBilibili]: "Bilibili",
	[I18nKey.animeProviderUnavailable]: "Источник данных недоступен",
	[I18nKey.animeProviderStale]: "Используется сохраненная копия",
	[I18nKey.animeConfigMissingBangumi]: "ID пользователя Bangumi не настроен",
	[I18nKey.animeConfigMissingBilibili]: "UID Bilibili не настроен",
	[I18nKey.animeSyncEmpty]: "В источнике не найдено записей",

	// ── Навигатор / Полезные ссылки ──
	[I18nKey.compass]: "Навигатор",
	[I18nKey.compassBanner]:
		"Полезные сервисы, инструменты и ссылки, к которым я часто возвращаюсь.",
	[I18nKey.compassNoResults]: "Ничего не найдено",
	[I18nKey.compassCounts]: "сайтов",

	// ── Навыки ──
	[I18nKey.skills]: "Навыки",
	[I18nKey.skillsBanner]:
		"Технологии и инструменты, которые я использую в работе.",
	[I18nKey.skillsCounts]: "навыков",
	[I18nKey.skillCategories]: "Категории навыков",
	[I18nKey.skillLevel]: "Уровень",
	[I18nKey.skillLevelBeginner]: "Базовый",
	[I18nKey.skillLevelIntermediate]: "Уверенный",
	[I18nKey.skillLevelAdvanced]: "Продвинутый",
	[I18nKey.skillLevelExpert]: "Эксперт",

	// ── Проекты ──
	[I18nKey.projects]: "Проекты",
	[I18nKey.projectsBanner]:
		"Избранные работы, пет-проекты и эксперименты.",
	[I18nKey.projectsCounts]: "проектов",
	[I18nKey.projectCategories]: "Категории проектов",
	[I18nKey.projectPhaseShipped]: "Завершен",
	[I18nKey.projectPhaseBuilding]: "В разработке",
	[I18nKey.projectPhaseExploring]: "Исследование",
	[I18nKey.projectVisit]: "Открыть проект",
	[I18nKey.projectSource]: "Исходный код",
	[I18nKey.projectTechnologies]: "Стек технологий",
	[I18nKey.projectsNoResults]: "В этой категории нет проектов",

	// ── Устройства ──
	[I18nKey.devices]: "Устройства",
	[I18nKey.devicesBanner]:
		"Техника, гаджеты и рабочий сетап.",
	[I18nKey.devicesCounts]: "устройств",
	[I18nKey.devicesNoResults]: "Устройств не найдено",
	[I18nKey.devicesSearchPlaceholder]:
		"Поиск по названию, бренду или характеристикам…",
	[I18nKey.devicesCategoryLabel]: "Категории устройств",
	[I18nKey.devicesStatusActive]: "Активно",
	[I18nKey.devicesStatusBackup]: "Запасное",
	[I18nKey.devicesStatusArchived]: "В архиве",
	[I18nKey.devicesStatusWishlist]: "В планах",
	[I18nKey.devicesViewSpecs]: "Подробнее",
	[I18nKey.devicesFeatured]: "Основное",

	// ── Игры ──
	[I18nKey.games]: "Игры",
	[I18nKey.gamesBanner]:
		"Игры, в которые я играю — оценки, время и краткие впечатления.",
	[I18nKey.gamesCounts]: "игр",
	[I18nKey.gamesNoResults]: "Игр не найдено",
	[I18nKey.gamesSearchPlaceholder]:
		"Поиск по названию, разработчику или жанру…",
	[I18nKey.gamesCategoryLabel]: "Категории игр",
	[I18nKey.gamesStatusPlaying]: "Играю",
	[I18nKey.gamesStatusCompleted]: "Пройдено",
	[I18nKey.gamesStatusBacklog]: "В очереди",
	[I18nKey.gamesStatusWishlist]: "В планах",
	[I18nKey.gamesViewDetails]: "Страница игры",
	[I18nKey.gamesFeatured]: "Избранное",
	[I18nKey.gamesHours]: "ч",
	[I18nKey.gamesRating]: "Оценка",

	// ── Хронология ──
	[I18nKey.timeline]: "Хронология",
	[I18nKey.timelineBanner]: "Ключевые этапы, события и памятные даты.",
	[I18nKey.timelineCounts]: "событий",
	[I18nKey.timelineCategories]: "Категории событий",
	[I18nKey.timelineNoResults]: "В этой категории нет событий",

	// ── Альбомы ──
	[I18nKey.albums]: "Альбомы",
	[I18nKey.albumsBanner]: "Визуальный архив мест, людей и мгновений.",
	[I18nKey.albumsNoResults]: "Альбомов не найдено",
	[I18nKey.albumsCounts]: "альбомов",
	[I18nKey.albumsBack]: "Назад к альбомам",
	[I18nKey.albumsPhotos]: "фото",
	[I18nKey.albumPasswordTitle]: "Альбом защищен паролем",
	[I18nKey.albumPasswordDescription]: "Введите пароль для просмотра фотографий.",
	[I18nKey.albumPasswordLabel]: "Пароль",
	[I18nKey.albumPasswordShow]: "Показать пароль",
	[I18nKey.albumPasswordHide]: "Скрыть пароль",
	[I18nKey.albumPasswordRequired]: "Введите пароль",
	[I18nKey.albumPasswordInvalid]: "Неверный пароль",
	[I18nKey.albumPasswordUnlock]: "Разблокировать",
	[I18nKey.albumPasswordUnlocking]: "Разблокировка…",

	// ── Защищенные записи ──
	[I18nKey.postPasswordTitle]: "Запись защищена паролем",
	[I18nKey.postPasswordDescription]:
		"Эта запись зашифрована. Введите пароль для доступа к содержимому.",
	[I18nKey.postPasswordLabel]: "Пароль",
	[I18nKey.postPasswordShow]: "Показать пароль",
	[I18nKey.postPasswordHide]: "Скрыть пароль",
	[I18nKey.postPasswordRequired]: "Введите пароль",
	[I18nKey.postPasswordInvalid]: "Неверный пароль",
	[I18nKey.postPasswordUnlock]: "Разблокировать запись",
	[I18nKey.postPasswordUnlocking]: "Расшифровка…",
	[I18nKey.postEncryptedSummary]: "Запись защищена паролем.",
	[I18nKey.postEncryptedBadge]: "Защищено",
	[I18nKey.postRssEncryptedNotice]:
		"Эта запись зашифрована. Перейдите на сайт и введите пароль для чтения.",

	// ── Галерея изображений ──
	[I18nKey.imageViewer]: "Просмотр изображений",
	[I18nKey.openImage]: "Открыть изображение",
	[I18nKey.previousImage]: "Предыдущее изображение",
	[I18nKey.nextImage]: "Следующее изображение",
	[I18nKey.backToGrid]: "Назад к сетке",
	[I18nKey.viewOriginal]: "Оригинал",

	// ── Теги, категории и серии ──
	[I18nKey.tags]: "Теги",
	[I18nKey.categories]: "Категории",
	[I18nKey.series]: "Серии",
	[I18nKey.seriesCount]: "серия",
	[I18nKey.seriesCounts]: "серий",
	[I18nKey.seriesStatusOngoing]: "В процессе",
	[I18nKey.seriesStatusCompleted]: "Завершена",
	[I18nKey.seriesPartOf]: "Эта запись входит в серию",
	[I18nKey.seriesPart]: "Часть {index} из {total}",
	[I18nKey.seriesPrevInSeries]: "Предыдущая в серии",
	[I18nKey.seriesNextInSeries]: "Следующая в серии",
	[I18nKey.seriesViewAll]: "Все серии",
	[I18nKey.recentPosts]: "Свежие записи",
	[I18nKey.tableOfContents]: "Оглавление",
	[I18nKey.formulaScrollable]: "Формула с горизонтальной прокруткой",
	[I18nKey.fieldRequired]: "Обязательно",
	[I18nKey.fieldOptional]: "Необязательно",
	[I18nKey.fieldDeprecated]: "Устарело",
	[I18nKey.codeBlockExpand]: "Развернуть код",
	[I18nKey.codeBlockCollapse]: "Свернуть код",
	[I18nKey.codeTreeExpand]: "Развернуть дерево файлов",
	[I18nKey.codeTreeCollapse]: "Свернуть дерево файлов",
	[I18nKey.announcement]: "Объявление",
	[I18nKey.announcementClose]: "Закрыть объявление",

	// ── Комментарии ──
	[I18nKey.comments]: "Комментарии",
	[I18nKey.commentsLoading]: "Загрузка комментариев…",
	[I18nKey.commentsLoadFailed]: "Не удалось загрузить комментарии.",
	[I18nKey.commentsRequiresJavaScript]:
		"Для отображения комментариев требуется JavaScript.",

	// ── Метаданные постов ──
	[I18nKey.untitled]: "Без названия",
	[I18nKey.uncategorized]: "Без категории",
	[I18nKey.noTags]: "Без тегов",

	[I18nKey.wordCount]: "слово",
	[I18nKey.wordsCount]: "слов",
	[I18nKey.minuteCount]: "минута",
	[I18nKey.minutesCount]: "минут",
	[I18nKey.postCount]: "запись",
	[I18nKey.postsCount]: "записей",
	[I18nKey.categoriesCount]: "категорий",
	[I18nKey.tagsCount]: "тегов",
	[I18nKey.noData]: "Нет данных",

	// ── Статистика ──
	[I18nKey.stats]: "Статистика",
	[I18nKey.statsPosts]: "Записи",
	[I18nKey.statsWords]: "Слова",
	[I18nKey.statsDays]: "Дней онлайн",
	[I18nKey.statsUpdated]: "Обновлено",
	[I18nKey.statsToday]: "Сегодня",
	[I18nKey.statsYesterday]: "Вчера",
	[I18nKey.statsDaysAgo]: "{days} дн. назад",
	[I18nKey.profileStatsPageViews]: "Просмотры",
	[I18nKey.profileStatsVisits]: "Визиты",

	// ── Календарь ──
	[I18nKey.calendar]: "Календарь",
	[I18nKey.calendarBackToday]: "Сегодня",
	[I18nKey.calendarPrevMonth]: "Предыдущий месяц",
	[I18nKey.calendarNextMonth]: "Следующий месяц",

	// ── Диаграммы Mermaid ──
	[I18nKey.mermaidControls]: "Управление диаграммой",
	[I18nKey.mermaidZoomIn]: "Приблизить",
	[I18nKey.mermaidZoomOut]: "Отдалить",
	[I18nKey.mermaidResetView]: "Сбросить масштаб",
	[I18nKey.mermaidOpenFullscreen]: "На весь экран",
	[I18nKey.mermaidCloseFullscreen]: "Закрыть полноэкранный режим",
	[I18nKey.mermaidFullscreenDiagram]: "Полноэкранная диаграмма: {diagram}",

	// ── Боковые панели и аудиоплеер ──
	[I18nKey.sidebar]: "Боковая панель",
	[I18nKey.sidebarSecondary]: "Дополнительная панель",
	[I18nKey.musicPlayerTitle]: "Аудиоплеер",
	[I18nKey.musicPrevious]: "Предыдущий трек",
	[I18nKey.musicPlay]: "Воспроизведение",
	[I18nKey.musicPause]: "Пауза",
	[I18nKey.musicNext]: "Следующий трек",
	[I18nKey.musicMute]: "Отключить звук",
	[I18nKey.musicUnmute]: "Включить звук",
	[I18nKey.musicPlaybackMode]: "Режим воспроизведения",
	[I18nKey.musicModeSequence]: "По порядку",
	[I18nKey.musicModeRepeatOne]: "Повтор одного трека",
	[I18nKey.musicModeShuffle]: "Случайный порядок",
	[I18nKey.musicProgress]: "Прогресс: {current} из {duration}",
	[I18nKey.musicVolume]: "Громкость: {volume}",
	[I18nKey.musicShowPlaylist]: "Показать плейлист",
	[I18nKey.musicHidePlaylist]: "Скрыть плейлист",
	[I18nKey.musicEmpty]: "Плейлист пуст",
	[I18nKey.musicLoading]: "Загрузка музыки…",
	[I18nKey.musicNotRequested]: "Еще не запрошено",
	[I18nKey.musicNowPlaying]: "Сейчас играет: {title}",
	[I18nKey.musicErrorEmptyPlaylist]: "Плейлист пуст.",
	[I18nKey.musicErrorSourceUnavailable]: "Этот трек недоступен.",
	[I18nKey.musicErrorAutoplayBlocked]:
		"Автовоспроизведение заблокировано. Нажмите «Воспроизведение» для запуска.",
	[I18nKey.musicErrorInvalidTrack]: "Некорректный трек.",

	// ── Настройки оформления (Палитра и темы) ──
	[I18nKey.themeColor]: "Цвет темы",
	[I18nKey.colorStyle]: "Палитра",
	[I18nKey.colorSpec]: "Спецификация",

	[I18nKey.styleTonalSpot]: "Тональный",
	[I18nKey.styleVibrant]: "Яркий",
	[I18nKey.styleContent]: "Контент",
	[I18nKey.styleExpressive]: "Выразительный",
	[I18nKey.styleRainbow]: "Радужный",
	[I18nKey.styleFruitSalad]: "Фруктовый",
	[I18nKey.styleMonochrome]: "Монохромный",
	[I18nKey.styleNeutral]: "Нейтрал",
	[I18nKey.styleFidelity]: "Точный",

	[I18nKey.spec2021]: "MD3 2021",
	[I18nKey.spec2025]: "M3E 2025",

	[I18nKey.lightMode]: "Светлая",
	[I18nKey.darkMode]: "Темная",
	[I18nKey.systemMode]: "Системная",

	// ── Пагинация и списки ──
	[I18nKey.more]: "Еще",
	[I18nKey.categoriesViewAll]: "Все категории",
	[I18nKey.paginationPrev]: "Предыдущая страница",
	[I18nKey.paginationNext]: "Следующая страница",
	[I18nKey.paginationPage]: "Страница {page}",
	[I18nKey.paginationJump]: "Перейти к странице",
	[I18nKey.tagsViewAll]: "Все теги",

	// ── Просмотр статьи ──
	[I18nKey.author]: "Автор",
	[I18nKey.publishedAt]: "Опубликовано",
	[I18nKey.lastUpdatedNotice]: "Обновлено {date}, {days} дн. назад",
	[I18nKey.lastUpdatedWarning]: "Часть информации в этой записи могла устареть",
	[I18nKey.license]: "Лицензия",
	[I18nKey.continueReading]: "Читать далее",
	[I18nKey.relatedReading]: "Похожие записи",
	[I18nKey.relatedReadingSubtitle]: "На основе общих тегов и категорий",
	[I18nKey.randomReading]: "Случайная запись",
	[I18nKey.randomReadingSubtitle]: "Случайная подборка из других материалов",
	[I18nKey.copySuccess]: "Ссылка скопирована",
	[I18nKey.copyLink]: "Скопировать ссылку",
	[I18nKey.copySelection]: "Копировать",
	[I18nKey.copyFailed]: "Не удалось скопировать ссылку. Скопируйте вручную.",
	[I18nKey.sharePageLink]: "Поделиться страницей",

	[I18nKey.shareArticle]: "Поделиться записью",
	[I18nKey.shareArticleDescription]:
		"Создайте карточку для публикации или скопируйте прямую ссылку.",
	[I18nKey.generateSharePoster]: "Создать карточку",
	[I18nKey.generatingSharePoster]: "Создание карточки…",
	[I18nKey.sharePosterPreviewAlt]: "Превью карточки для «{title}»",
	[I18nKey.downloadSharePoster]: "Скачать изображение",
	[I18nKey.sharePosterFailed]:
		"Не удалось создать карточку. Попробуйте еще раз.",
	[I18nKey.retry]: "Повторить",
	[I18nKey.backToTop]: "Наверх",
	[I18nKey.backToComment]: "К комментариям",
	[I18nKey.notFound]: "404",
	[I18nKey.notFoundTitle]: "Страница не найдена",
	[I18nKey.notFoundDescription]:
		"Возможно, она была перемещена, удалена или никогда не существовала.",
	[I18nKey.backToHome]: "На главную",
	[I18nKey.close]: "Закрыть",
	[I18nKey.scanToRead]: "QR-код для чтения с телефона",

	// ── Внешний вид страницы ──
	[I18nKey.reduceMotion]: "Уменьшение движения",
	[I18nKey.wallpaperMode]: "Фон страницы",
	[I18nKey.wallpaperModeBanner]: "С баннером",
	[I18nKey.wallpaperModeNone]: "Сплошной",
	[I18nKey.texturePreset]: "Текстура фона",
	[I18nKey.texturePresetNone]: "Без узора",
	[I18nKey.texturePresetStarlight]: "Сетка",
	[I18nKey.texturePresetCyberDots]: "Пиксельная сетка",
	[I18nKey.texturePresetTopography]: "Топография",
	[I18nKey.texturePresetGeometric]: "Геометрия",
	[I18nKey.texturePresetSakura]: "Снежинки",
	[I18nKey.textureOpacity]: "Интенсивность текстуры",
	[I18nKey.layoutMode]: "Вид списка",
	[I18nKey.layoutList]: "Список",
	[I18nKey.layoutGrid]: "Сетка",
	[I18nKey.resetConfirmTitle]: "Сбросить оформление?",
	[I18nKey.resetConfirmMessage]:
		"Будут восстановлены оттенок, стиль палитры и стандарт цвета по умолчанию.",
	[I18nKey.cancel]: "Отмена",
	[I18nKey.reset]: "Сбросить",
	// Ключи слоя проекта (нет в I18nKey пакета); в других языках используется запасной текст в компоненте.
	"displaySettings.resetDefault": "Сбросить по умолчанию",
	"displaySettings.glassEffect": "Эффект стекла",

	// ── RSS и Atom ──
	[I18nKey.rss]: "RSS-лента",
	[I18nKey.rssSubtitle]: "Подписка на публикации через RSS-ридер",
	[I18nKey.atom]: "Atom-лента",
	[I18nKey.atomSubtitle]: "Подписка на публикации через Atom-ридер",
	[I18nKey.feedLink]: "Адрес фида",
	[I18nKey.feedHowToUse]: "Как подписаться",
	[I18nKey.feedHowToUseDesc]:
		"Добавьте этот адрес в ваш RSS-ридер (NetNewsWire, Feedly, Inoreader, Follow и др.) для автоматического получения новых записей.",
	[I18nKey.feedOpenXml]: "Открыть исходный XML",
	[I18nKey.feedRecentPosts]: "Последние публикации в фиде",
};

export const i18nConfig: I18nConfig = withUserConfig("i18n", {
	ru,
});
