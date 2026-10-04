import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { aboutConfig } from "@/config/aboutConfig";
import { albumsConfig } from "@/config/albumsConfig";
import { animeConfig } from "@/config/animeConfig";
import { compassConfig } from "@/config/compassConfig";
import { devicesConfig } from "@/config/devicesConfig";
import { friendsConfig } from "@/config/friendsConfig";
import { gamesConfig } from "@/config/gamesConfig";
import { momentsConfig } from "@/config/momentsConfig";
import { projectsConfig } from "@/config/projectsConfig";
import { seriesConfig } from "@/config/seriesConfig";
import { skillsConfig } from "@/config/skillsConfig";
import { timelineConfig } from "@/config/timelineConfig";
import type {
	NavBarConfig,
	NavBarConfigOverride,
	NavBarLink,
	NavBarLinkOverride,
} from "@/types/navBarConfig";
import { getUserConfig } from "@/utils/config-overlay.ts";
import { pruneUnavailableNavLinks } from "@/utils/nav-utils.ts";

/**
 * Конфигурация панели навигации (единый источник).
 * - LinkPresets: таблица именованных пресетов ссылок (название / url / иконка настраиваются централизованно);
 * - navBarConfig: структура навигации (порядок + группы / children выпадающего меню).
 *   Управляет выпадающим меню десктопа и мобильной шторкой навигации.
 *
 * Ссылки на отключенные страницы автоматически вырезаются в navBarConfig.
 */
export const LinkPresets: Record<string, NavBarLink> = {
	Home: {
		name: i18n(I18nKey.home),
		url: "/",
		icon: "material-symbols:home-outline-rounded",
		pageKey: "home",
	},
	Archive: {
		name: i18n(I18nKey.archive),
		url: "/archive/",
		icon: "material-symbols:archive-outline-rounded",
		pageKey: "archive",
	},
	Friends: {
		name: i18n(I18nKey.friends),
		url: "/friends/",
		icon: "material-symbols:handshake-outline-rounded",
		pageKey: "friends",
	},
	Moments: {
		name: i18n(I18nKey.moments),
		url: "/moments/",
		icon: "material-symbols:auto-awesome-outline-rounded",
		pageKey: "moments",
	},
	Anime: {
		name: i18n(I18nKey.anime),
		url: "/anime/",
		icon: "material-symbols:live-tv-outline-rounded",
		pageKey: "anime",
	},
	Compass: {
		name: i18n(I18nKey.compass),
		url: "/compass/",
		icon: "material-symbols:explore-rounded",
		pageKey: "compass",
	},
	Skills: {
		name: i18n(I18nKey.skills),
		url: "/skills/",
		icon: "material-symbols:workspaces-outline-rounded",
		pageKey: "skills",
	},
	Projects: {
		name: i18n(I18nKey.projects),
		url: "/projects/",
		icon: "material-symbols:deployed-code-outline-rounded",
		pageKey: "projects",
	},
	Devices: {
		name: i18n(I18nKey.devices),
		url: "/devices/",
		icon: "material-symbols:devices-rounded",
		pageKey: "devices",
	},
	Games: {
		name: i18n(I18nKey.games),
		url: "/games/",
		icon: "material-symbols:sports-esports-outline-rounded",
		pageKey: "games",
	},
	Timeline: {
		name: i18n(I18nKey.timeline),
		url: "/timeline/",
		icon: "material-symbols:timeline-rounded",
		pageKey: "timeline",
	},
	Albums: {
		name: i18n(I18nKey.albums),
		url: "/albums/",
		icon: "material-symbols:photo-library-outline-rounded",
		pageKey: "albums",
	},
	Categories: {
		name: i18n(I18nKey.categories),
		url: "/categories/",
		icon: "material-symbols:folder-outline-rounded",
		pageKey: "categories",
	},
	Tags: {
		name: i18n(I18nKey.tags),
		url: "/tags/",
		icon: "material-symbols:label-outline-rounded",
		pageKey: "tags",
	},
	Series: {
		name: i18n(I18nKey.series),
		url: "/series/",
		icon: "material-symbols:auto-stories-outline-rounded",
		pageKey: "series",
	},
	About: {
		name: i18n(I18nKey.about),
		url: "/about/",
		icon: "material-symbols:info-outline-rounded",
		pageKey: "about",
	},
	GitHub: {
		name: "GitHub",
		url: "https://github.com/LyraVoid/Shirone",
		icon: "fa6-brands:github",
		external: true,
		pageKey: "github",
	},
};

const defaultNavBarConfig: NavBarConfig = {
	links: [
		LinkPresets.Home,
		LinkPresets.Archive,
		LinkPresets.Categories,
		LinkPresets.Tags,
		LinkPresets.About,
	],
};

import { resolveI18nText } from "@/utils/i18n-utils.ts";

function fail(message: string): never {
	throw new Error(`[config] nav-bar：${message}`);
}

function resolveName(name: string): string {
	return resolveI18nText(name);
}

/**
 * Внутренние маршруты страниц (без завершающего слэша), отключенных в конфигурации.
 * Используется в `pruneUnavailableNavLinks()` для удаления ссылок из навигации, чтобы не оставлять битых 404 ссылок.
 */
const unavailableFeatureRoutes: ReadonlySet<string> = new Set([
	...(friendsConfig.enable ? [] : ["/friends"]),
	...(momentsConfig.enable ? [] : ["/moments"]),
	...(animeConfig.enable ? [] : ["/anime"]),
	...(compassConfig.enable ? [] : ["/compass"]),
	...(albumsConfig.enable ? [] : ["/albums"]),
	...(skillsConfig.enable ? [] : ["/skills"]),
	...(projectsConfig.enable ? [] : ["/projects"]),
	...(devicesConfig.enable ? [] : ["/devices"]),
	...(gamesConfig.enable ? [] : ["/games"]),
	...(timelineConfig.enable ? [] : ["/timeline"]),
	...(aboutConfig.enable ? [] : ["/about"]),
	...(seriesConfig.enable ? [] : ["/series"]),
]);

/**
 * Преобразование декларативных пунктов навигации в объекты `NavBarLink`.
 */
export function resolveNavBarLinks(
	entries: readonly NavBarLinkOverride[],
	presets: Record<string, NavBarLink> = LinkPresets,
): NavBarLink[] {
	return entries.map((entry) => {
		let base: NavBarLink | null = null;
		if (entry.preset !== undefined) {
			base = presets[entry.preset] ?? null;
			if (!base) {
				fail(
					`Неизвестный пресет "${entry.preset}". Доступные: ${Object.keys(presets).join(", ")}.`,
				);
			}
		}

		const name =
			entry.name !== undefined ? resolveName(entry.name) : base?.name;
		if (name === undefined) {
			fail("Каждый элемент требует указания name или ссылки на встроенный preset.");
		}

		// Если children не указан, наследуется подменю из пресета
		return {
			...base,
			name,
			...(entry.url !== undefined ? { url: entry.url } : {}),
			...(entry.icon !== undefined ? { icon: entry.icon } : {}),
			...(entry.pageKey !== undefined ? { pageKey: entry.pageKey } : {}),
			...(entry.external !== undefined ? { external: entry.external } : {}),
			...(entry.children
				? { children: resolveNavBarLinks(entry.children, presets) }
				: {}),
		};
	});
}

const userNavBar = getUserConfig("navBar") as NavBarConfigOverride | undefined;

/**
 * Финальная структура панели навигации с автоматической фильтрацией отключенных страниц.
 */
export const navBarConfig: NavBarConfig = {
	links: pruneUnavailableNavLinks(
		resolveNavBarLinks(
			userNavBar ? userNavBar.links : defaultNavBarConfig.links,
		),
		unavailableFeatureRoutes,
	),
};
