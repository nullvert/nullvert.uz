import type { FontConfig, ResolvedFontOptions } from "@/types/fontConfig.ts";
import { withUserConfig } from "@/utils/config-overlay.ts";
import { resolveFontOptions as resolve } from "@/utils/font-options.ts";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Shirone: Руководство по конфигурации шрифтов
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Шрифты делятся на 3 роли (Role), каждая решает свою задачу:
 *  1. `body`: основной текст (латиница, кириллица, цифры, базовая пунктуация)
 *  2. `cjk` : шрифты CJK (китайские иероглифы, японские кана, корейский хангыль)
 *  3. `mono`: моноширинный код (блоки кода, инлайн-код, терминал)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 【Популярные сценарии настройки】
 * ─────────────────────────────────────────────────────────────────────────────
 * Сценарий A: Использовать только системные шрифты (без загрузки шрифтов, максимальная скорость)
 *   - Установите `mode: "system"`, а `fontFamilies` сделайте пустым массивом `[]`.
 *
 * Сценарий B: Подключение локального шрифта (.woff2)
 *   1. Поместите файл `.woff2` в директорию `src/assets/fonts/`;
 *   2. В нужной роли (например, `role: "body"`) укажите `source: "local"`;
 *   3. В `file` укажите путь к файлу (например, `"src/assets/fonts/MyFont.woff2"`);
 *   4. В `family` укажите имя семейства шрифта.
 *
 * Сценарий C: Использование пакетов Fontsource из npm
 *   1. Установите пакет (например, `pnpm.cmd add @fontsource/inter`);
 *   2. Установите `source: "fontsource"` и путь в `file` (например, `"@fontsource/inter/400.css"`);
 *   3. В `family` укажите название (например, `"Inter"`).
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const fontConfig: FontConfig = withUserConfig("font", {
	/**
	 * Режим сборки шрифтов:
	 * - `"custom"`: кастомные шрифты (загружает шрифты из списка fontFamilies ниже)
	 * - `"system"`: чистые системные шрифты (без файлов шрифтов, использует встроенные в ОС пользователя)
	 */
	mode: "custom",

	/**
	 * Список семейств шрифтов (роли body, cjk, mono)
	 */
	fontFamilies: [
		// ---------------------------------------------------------------------
		// 1. Основной текст / Body Font: Manrope (геометрический гротеск с отличной кириллицей и латиницей)
		// ---------------------------------------------------------------------
		{
			id: "manrope-body",
			family: "Manrope",
			role: "body",
			source: "fontsource",
			variants: [
				{
					file: "@fontsource/manrope/400.css",
					weight: 400,
					style: "normal",
				},
				{
					file: "@fontsource/manrope/500.css",
					weight: 500,
					style: "normal",
				},
				{
					file: "@fontsource/manrope/700.css",
					weight: 700,
					style: "normal",
				},
			],
			fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
			display: "swap",
			preload: false,
		},

		// ---------------------------------------------------------------------
		// 2. Моноширинный шрифт кода (блоки кода и терминал, переменная --font-mono)
		// ---------------------------------------------------------------------
		{
			id: "jetbrains-mono",
			family: "JetBrains Mono",
			role: "mono",
			source: "fontsource",
			variants: [
				{
					file: "@fontsource-variable/jetbrains-mono/index.css",
					weight: "100 800",
					style: "normal",
				},
				{
					file: "@fontsource-variable/jetbrains-mono/wght-italic.css",
					weight: "100 800",
					style: "italic",
				},
			],
			fallback: [
				"ui-monospace",
				"SFMono-Regular",
				"Menlo",
				"Monaco",
				"Consolas",
				"monospace",
			],
			display: "swap",
			preload: false,
		},
	],

	/**
	 * Сабсеттинг шрифтов (генерация облегченных .woff2 с символами, реально используемыми в контенте)
	 * - В Dev: загружаются полные шрифты без задержек сборки;
	 * - В Build: нарезается ультра-компактный сабсет.
	 */
	subsetting: {
		enable: true, // Включить автоматический сабсеттинг
		includeContent: true, // Сканировать статьи в src/content/
		includeI18n: true, // Сканировать языковые словари
		includeConfig: true, // Сканировать конфигурации и навигацию
		includeCommon: true, // Включать частые знаки препинания и базовые символы
		allowRemoteText: true, // Включать названия треков из облачного плейлиста Meting
	},

	/**
	 * Бюджет размера шрифтов
	 */
	budget: {
		maxTotalBytes: 6 * 1024 * 1024, // Максимальный общий объем кастомных шрифтов: 6MB
		maxFamilyBytes: 4 * 1024 * 1024, // Максимальный размер одного семейства: 4MB
	},
});

/** Валидированный и нормализованный объект настроек шрифтов, используемый шаблонами Astro и CSS */
export const resolvedFontOptions: ResolvedFontOptions = resolve(fontConfig);

/** Функция парсинга и валидации конфигурации шрифтов */
export const resolveFontOptions: (config: FontConfig) => ResolvedFontOptions =
	resolve;
