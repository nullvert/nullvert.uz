import type { FabConfig } from "@/types/fabConfig";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * Конфигурация плавающей панели быстрых действий (FAB) в углу экрана.
 *
 * 【Основные параметры】
 * - enable: включить ли плавающую панель;
 * - align: "start" (слева) | "end" (справа, по умолчанию);
 * - size: "small" | "regular" (по умолчанию) | "large";
 * - offset: отступы от угла (поддерживаются CSS-переменные или пиксели);
 * - items: список кнопок действий (рендерятся по порядку в массиве):
 *   - type: "top" — плавный возврат наверх (появляется при прокрутке ниже баннера);
 *   - type: "toc" — плавающее оглавление статьи (на десктопе уже есть в боковой панели, по умолчанию только mobile/tablet);
 *   - type: "comment" — кнопка перехода к комментариям (нулевой DOM, если комментарии отключены);
 *   - type: "home" — кнопка возврата на главную (onlySubPages: true показывает только на внутренних страницах);
 *   - devices: матрица поддерживаемых устройств ("mobile" | "tablet" | "desktop"), по умолчанию на всех;
 *   - pages: фильтр страниц (например, ["post"]).
 *
 * Архитектурный стандарт описан в docs/fab-system.md.
 */
export const fabConfig: FabConfig = withUserConfig("fab", {
	enable: true,
	align: "end",
	size: "regular",
	offset: {
		bottom: "var(--m3e-space-8)",
		right: "var(--m3e-space-6)",
	},
	items: [
		{
			type: "top",
			enable: true,
			devices: ["mobile", "tablet", "desktop"],
		},
		{
			type: "toc",
			enable: true,
			devices: ["mobile", "tablet"],
			pages: ["post"],
			depth: 3,
			closeOnSelect: true,
		},
		{
			type: "comment",
			enable: true,
			devices: ["mobile", "tablet"],
			pages: ["post"],
		},
		{
			type: "home",
			enable: true,
			devices: ["mobile", "tablet"],
			onlySubPages: true,
		},
	],
});
