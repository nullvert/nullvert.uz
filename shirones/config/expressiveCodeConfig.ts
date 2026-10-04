import type { ExpressiveCodeConfig } from "@/types/config";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * Темы блоков кода Expressive Code (используются в astro.config.mjs и setting-utils).
 * Типы описаны в src/types/config.ts.
 */
export const expressiveCodeConfig: ExpressiveCodeConfig = withUserConfig(
	"expressiveCode",
	{
		// Примечание: некоторые стили (например, цвет фона) переопределяются в конфигурации темы.
		// Блоки кода переключают темную и светлую темы синхронно с темой сайта
		theme: "github-dark",
		lightTheme: "github-light",
		darkTheme: "github-dark",
	},
);
