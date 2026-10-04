import { aboutConfig } from "./aboutConfig.ts";
import { albumsConfig } from "./albumsConfig.ts";
import { animeConfig } from "./animeConfig.ts";
import { compassConfig } from "./compassConfig.ts";
import { devicesConfig } from "./devicesConfig.ts";
import { friendsConfig } from "./friendsConfig.ts";
import { gamesConfig } from "./gamesConfig.ts";
import { momentsConfig } from "./momentsConfig.ts";
import { projectsConfig } from "./projectsConfig.ts";
import { seriesConfig } from "./seriesConfig.ts";
import { skillsConfig } from "./skillsConfig.ts";
import { timelineConfig } from "./timelineConfig.ts";

/** Получить список идентификаторов всех страниц, выключенных через enable: false */
export function getDisabledPages(): string[] {
	const disabled: string[] = [];
	if (skillsConfig.enable === false) disabled.push("skills");
	if (projectsConfig.enable === false) disabled.push("projects");
	if (timelineConfig.enable === false) disabled.push("timeline");
	if (devicesConfig.enable === false) disabled.push("devices");
	if (gamesConfig.enable === false) disabled.push("games");
	if (animeConfig.enable === false) disabled.push("anime");
	if (aboutConfig.enable === false) disabled.push("about");
	if (friendsConfig.enable === false) disabled.push("friends");
	if (momentsConfig.enable === false) disabled.push("moments");
	if (albumsConfig.enable === false) disabled.push("albums");
	if (compassConfig.enable === false) disabled.push("compass");
	if (seriesConfig.enable === false) disabled.push("series");
	return disabled;
}

/**
 * Проверка, должен ли путь страницы включаться в sitemap.
 * Исключает отключенные страницы (например, /skills/, /skills/index.html) и заглушки 404.
 */
export function isSitemapPageAllowed(pageUrl: string): boolean {
	const disabled = getDisabledPages();
	for (const p of disabled) {
		if (
			pageUrl.endsWith(`/${p}/`) ||
			pageUrl.endsWith(`/${p}`) ||
			pageUrl.includes(`/${p}/`)
		) {
			return false;
		}
	}
	return true;
}
