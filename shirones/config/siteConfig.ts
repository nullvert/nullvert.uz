import type { SiteConfig } from "@/types/config";
import type {
	ResolvedTextureOptions,
	TextureConfig,
} from "@/types/textureConfig";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * Основная конфигурация сайта: заголовок / язык / акцентная палитра (динамические цвета HCT) / баннер / оглавление / индикатор прогресса / фавиконки.
 * Типы описаны в src/types/config.ts.
 */
export const siteConfig: SiteConfig = withUserConfig("site", {
	site: "https://nullvert.uz",
	base: "/",
	title: "nv://blog",
	subtitle: "личный техноблог",
	// Выравнивание заголовка и навигации в верхней панели на десктопе: "left" — по левому краю, "center" — по центру.
	topAppBar: {
		contentAlign: "center",
	},
	// Управление панелью настроек отображения: видимость переключателей для пользователей
	displaySettings: {
		colorStyle: true, // Показывать ли сетку выбора стилей палитры (Тональный, Яркий, Нейтральный)
		colorSpec: false, // Фиксировано на M3E 2025
		wallpaperMode: false, // Показывать ли переключение фона (сплошной цвет / баннер)
		layoutMode: true, // Показывать ли переключение вида списка статей (список / сетка)
		reduceMotion: true, // Показывать ли переключатель уменьшения анимаций
		texture: true, // Показывать ли выбор текстуры фона
	},
	lang: "ru" as unknown as SiteConfig["lang"], // Language code, e.g. 'en', 'zh_CN', 'ja', etc.
	// IANA time zone for precise post and moment timestamps. It is independent of lang.
	timeZone: "Asia/Tashkent",
	themeColor: {
		hue: 180, // Default hue 0-360. Чистый циан (Cyan 180°)
		fixed: false, // Hide the theme color picker for visitors
		// Dynamic Material 3 palette style (TonalSpot/Vibrant/Content/Expressive/Rainbow/FruitSalad/Monochrome/Neutral/Fidelity)
		style: "tonalSpot",
		// Design spec version: "2021" (MD3) or "2025" (M3 Expressive). Роли совпадают,
		// отличие лишь в расчете палитры (библиотечный colorSpec статически делегирует 2025)
		spec: "2025",
	},
	// Режим фона страниц по умолчанию: сплошной цвет темы ("none").
	wallpaperMode: {
		defaultMode: "none",
	},
	// Конфигурация системы текстур фона
	texture: {
		enable: true, // Включить систему текстур фона
		defaultPreset: "sakura", // Пресет текстуры по умолчанию: "none" (сплошной чистый фон)
		defaultOpacity: 0.12, // Прозрачность текстуры по умолчанию (0.05 ~ 0.25)
		allowMotion: true, // Разрешить микро-анимацию фона
	},
	banner: {
		// Рекомендуется помещать изображения в src/assets и указывать путь относительно src для сборки AVIF/WebP.
		// Пути public/ с ведущим "/" и удаленные URL также поддерживаются (но без создания адаптивных версий).
		// desktop используется для >= 1024px; mobile — для < 1024px на главной (на мобильных устройствах вне главной обои скрываются).
		// Порядок в массиве задает порядок слайдов; для статического баннера достаточно одного изображения.
		src: {
			desktop: ["assets/images/banner/desktop/1.webp"],
			mobile: ["assets/images/banner/mobile/1.webp"],
		},
		// Точка фокусировки кадрирования изображения: "top", "center" или "bottom".
		position: "center",
		dim: {
			// Полупрозрачное затемнение поверх изображения для лучшей читаемости заголовка и шапки (opacity от 0 до 1).
			enable: false,
			opacity: 0.24,
		},
		homeText: {
			// Отображается только на баннере главной страницы; заголовок и подзаголовок центрируются по вертикали.
			enable: false,
			title: "Мой блог",
			subtitle: [
				"Записки, мысли и эксперименты",
			],
			typewriter: {
				// Эффект печатной машинки для подзаголовка; при выключении подзаголовок отображается сразу целиком.
				enable: false,
				// Скорость печати (интервал между символами, мс).
				speed: 100,
				// Скорость обратного стирания (интервал между символами, мс).
				deleteSpeed: 50,
				// Пауза после завершения печати строки, мс.
				pauseTime: 2000,
				// Зацикливать ли анимацию после завершения; false — проиграть один раз.
				loop: false,
			},
		},
		carousel: {
			// Автоматическая карусель при наличии нескольких изображений (для одного изображения автоматически переходит в статический показ).
			enable: false,
			// Интервал переключения слайдов (мс), минимальное ограничение в рантайме — 3000ms.
			interval: 6000,
			// Длительность плавного перехода (Crossfade) в миллисекундах (по умолчанию 1200ms).
			fadeDuration: 1200,
			// Режим анимации камеры: "ken-burns" (по умолчанию, цикличное панорамирование) | "zoom-in" (приближение) | "zoom-out" (отдаление) | "pan-left" | "pan-right" | "none".
			animation: "ken-burns",
		},
		waves: {
			// Отрисовка декоративных волн цвета фона страницы внизу баннера; при выключении DOM волн не создается.
			enable: false,
		},
	},
	// Оптимизация изображений в теле Markdown-статей (только для удаленных изображений, без лишних скриптов).
	imageOptimization: {
		// Добавление referrerpolicy="no-referrer" для CDN с защитой от хотлинкинга (поддерживает маски).
		noReferrerDomains: ["*.hdslb.com"],
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	progressIndicator: {
		// Стиль индикатора прогресса: dual — двунаправленный (по умолчанию) / single — однонаправленный
		style: "dual",
	},
	favicon: [
		// Иконки вкладки браузера, пути относительно директории public.
		{
			src: "/favicon/favicon.ico",
			sizes: "48x48",
		},
		{
			src: "/favicon/favicon-96x96.png",
			sizes: "96x96",
		},
	],
});

/**
 * Валидация и парсинг опций текстуры фона (с оптимизацией короткого замыкания и нулевых накладных расходов)
 */
export function resolveTextureOptions(
	config: boolean | TextureConfig | undefined = siteConfig.texture,
	displaySettingsTexture: boolean = siteConfig.displaySettings?.texture ?? true,
): ResolvedTextureOptions {
	if (config === false || config === undefined) {
		return {
			enable: false,
			defaultPreset: "none",
			defaultOpacity: 0.12,
			allowMotion: false,
		};
	}

	if (config === true) {
		return {
			enable: true,
			defaultPreset: "starlight",
			defaultOpacity: 0.12,
			allowMotion: true,
		};
	}

	const enable = config.enable ?? true;
	const defaultPreset = config.defaultPreset ?? "starlight";
	const defaultOpacity = config.defaultOpacity ?? 0.12;
	const allowMotion = config.allowMotion ?? true;

	// Оптимизация короткого замыкания производительности:
	// Если настроено enable: false или defaultPreset: "none", и в панели настроек выбор текстуры отключен (посетитель не может включить),
	// то текстура считается полностью выключенной для достижения нулевого DOM, нулевого CSS и нулевого рантайма.
	const effectiveEnable =
		enable && (defaultPreset !== "none" || displaySettingsTexture);

	return {
		enable: effectiveEnable,
		defaultPreset,
		defaultOpacity,
		allowMotion,
	};
}

/** Стиль палитры по умолчанию (резервное значение, если посетитель не выбрал стиль) */
export function getDefaultStyle(): string {
	return siteConfig.themeColor.style;
}

/** Спецификация Color Spec по умолчанию (2021 / 2025) */
export function getDefaultSpec(): string {
	return siteConfig.themeColor.spec;
}

/** Парсинг и возврат переключателей панели настроек отображения (по умолчанию true) */
export function resolveDisplaySettings(): {
	colorStyle: boolean;
	colorSpec: boolean;
	wallpaperMode: boolean;
	layoutMode: boolean;
	reduceMotion: boolean;
	texture: boolean;
} {
	const cfg = siteConfig.displaySettings;
	const textureOpts = resolveTextureOptions(
		siteConfig.texture,
		cfg?.texture ?? true,
	);
	return {
		colorStyle: cfg?.colorStyle ?? true,
		colorSpec: cfg?.colorSpec ?? true,
		wallpaperMode: cfg?.wallpaperMode ?? true,
		layoutMode: cfg?.layoutMode ?? true,
		reduceMotion: cfg?.reduceMotion ?? true,
		texture: textureOpts.enable && (cfg?.texture ?? true),
	};
}

