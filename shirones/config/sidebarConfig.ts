/**
 * Конфигурация макета боковой панели (data-driven управление).
 *
 * 【Основные понятия】
 * 1. arrangement (режим организации панелей):
 *    - "single" (одна панель, по умолчанию): все виджеты идут в одну основную колонку (ширина контента 85rem);
 *    - "dual" (две колонки): виджеты с column: "secondary" попадают во второстепенную колонку (при ширине экрана ≥ 1280px разворачивается 3 колонки, ширина 96rem),
 *      в диапазоне от 1024px до 1279px автоматически мягко деградирует в одну панель.
 * 2. side (сторона расположения основной панели):
 *    - "left": основная колонка слева (по умолчанию), при dual второстепенная встает справа;
 *    - "right": основная колонка справа, при dual второстепенная встает слева.
 * 3. Свойства виджета (widget):
 *    - type: тип компонента ("profile" | "music" | "announcement" | "categories" | "tags" | "series" | "stats" | "calendar" | "toc");
 *    - enable: включен ли виджет;
 *    - slot: "top" (фиксирован вверху) | "sticky" (прилипает при скролле страницы);
 *    - column: "primary" (основная колонка, по умолчанию) | "secondary" (второстепенная колонка, действует только при arrangement: "dual");
 *    - pages: показывать только на указанных страницах (например, ["home", "post"], при отсутствии отображается везде);
 *    - collapseAfter: лимит элементов до сворачивания (для categories/tags/series, при превышении появляется кнопка «Показать еще»).
 *
 * Определение типов см. в src/types/sidebarConfig.ts.
 */
import type { SidebarConfig } from "@/types/sidebarConfig";
import { withUserConfig } from "@/utils/config-overlay.ts";

export const sidebarConfig: SidebarConfig = withUserConfig("sidebar", {
	enable: true,
	arrangement: "single",
	side: "right",
	components: [
		{ type: "profile", enable: true, slot: "top", pages: ["home"] },
		{ type: "music", enable: false, slot: "top" },
		{ type: "announcement", enable: false, slot: "top", pages: ["home"] },
		{
			type: "categories",
			enable: true,
			slot: "sticky",
			collapseAfter: 5,
			pages: [
				"home",
				"friends",
				"moments",
				"anime",
				"compass",
				"skills",
				"projects",
				"devices",
				"games",
				"timeline",
				"albums",
				// "about",
				// "post",
			],
		},
		{
			type: "series",
			enable: false,
			slot: "sticky",
			collapseAfter: 5,
			pages: [
				"home",
				"friends",
				"moments",
				"anime",
				"compass",
				"skills",
				"projects",
				"devices",
				"games",
				"timeline",
				"albums",
				"about",
				"post",
			],
		},
		{
			type: "tags",
			enable: true,
			slot: "sticky",
			collapseAfter: 6,
			pages: [
				"home",
				"friends",
				"moments",
				"anime",
				"compass",
				"skills",
				"projects",
				"devices",
				"games",
				"timeline",
				"albums",
				"about",
				// "post",
			],
		},
		{
			type: "stats",
			enable: false,
			slot: "top",
			column: "primary",
			pages: ["home"],
		},
		{ type: "calendar", enable: false, slot: "top", column: "primary" },
		{
			type: "toc",
			enable: true,
			slot: "sticky",
			column: "primary",
			pages: ["post"],
		},
	],
});
