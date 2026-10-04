import type {
	CommentConfig,
	GiscusConfig,
	TwikooConfig,
} from "@/types/commentConfig";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * Единый источник конфигурации системы комментариев.
 *
 * Следует принципу «ноль лишней нагрузки»: по умолчанию отключено (enable: false),
 * при выключенном состоянии не производит внешних запросов, не оставляет лишнего DOM и не утяжеляет бандл.
 *
 * 【Инструкция по настройке комментариев Twikoo】
 * 1. Разверните бэкенд Twikoo и получите ID окружения (Tencent Cloud / Vercel / Railway / свой сервер);
 * 2. Установите `enable` в `true`, а `provider` в `"twikoo"`;
 * 3. Укажите ваш `twikoo.envId`;
 * 4. (Опционально) Настройте свой `scriptUrl` (например, зеркало CDN unpkg/jsdelivr).
 *
 * 【Инструкция по настройке комментариев Giscus】
 * 1. Создайте публичный репозиторий GitHub и включите Discussions в настройках;
 * 2. Установите приложение giscus App (https://github.com/apps/giscus) в этот репозиторий;
 * 3. На сайте https://giscus.app следуйте мастеру настройки и выберите категорию обсуждений,
 *    скопируйте сгенерированные `data-repo-id` и `data-category-id`;
 * 4. Установите `enable` в `true`, а `provider` в `"giscus"`,
 *    заполните обязательные поля: `giscus.repo`, `giscus.repoId`, `giscus.categoryId`;
 * 5. (Опционально) Настройте `mapping`, `reactionsEnabled`, `inputPosition`,
 *    `theme.light` / `theme.dark`, `lang` и `scriptUrl`.
 */
export const commentConfig: CommentConfig = withUserConfig("comment", {
	/** Общий переключатель комментариев: при false скрипты и DOM не загружаются вовсе */
	enable: false,
	/** Провайдер комментариев: "none" | "twikoo" | "giscus" */
	provider: "none",
	/** Ленивая загрузка по вьюпорту: скрипты загружаются только при докрутке до блока комментариев (рекомендуется true) */
	lazy: true,
	/** Специфичные настройки Twikoo */
	twikoo: {
		/** ID окружения Twikoo (например, "https://your-twikoo.vercel.app") */
		envId: "",
		/** CDN адрес фронтенд-скрипта Twikoo */
		scriptUrl: "https://cdn.jsdelivr.net/npm/twikoo@1.7.20/dist/twikoo.min.js",
		/** Язык комментариев: "auto" (по языку сайта) | "ru" | "en" | "zh-CN" и др. */
		lang: "auto",
		/** Плейсхолдер поля ввода */
		placeholder: "Share your thoughts...",
	},
	/** Специфичные настройки Giscus (на базе GitHub Discussions) */
	giscus: {
		/** Публичный репозиторий, формат "owner/repo" (обязательно) */
		repo: "",
		/** ID репозитория из конфигуратора giscus.app (обязательно) */
		repoId: "",
		/** Название категории Discussion, например "Announcements" (пусто — без ограничений) */
		category: "Announcements",
		/** ID категории из конфигуратора giscus.app (обязательно) */
		categoryId: "",
		/** Привязка страницы к Discussion: pathname (по умолчанию) / url / title / og:title / specific / number */
		mapping: "pathname",
		/** Строгое сопоставление по заголовку (хэш SHA-1), исключает ошибочный fuzzy поиск GitHub */
		strict: false,
		/** Показывать ли реакции к главному посту */
		reactionsEnabled: true,
		/** Отправлять ли метаданные обсуждения родительской странице */
		emitMetadata: false,
		/** Положение формы ввода: bottom (под комментариями, по умолчанию) | top (над комментариями) */
		inputPosition: "bottom",
		/** Темы giscus для светлого и темного режимов (ключ темы giscus или URL кастомного CSS) */
		theme: { light: "light", dark: "dark" },
		/** Язык: "auto" (по языку сайта) | код языка giscus ("ru", "en") */
		lang: "auto",
		/** URL скрипта client.js giscus (при селф-хостинге укажите собственный) */
		scriptUrl: "https://giscus.app/client.js",
	},
});

export type ResolvedCommentOptions =
	| {
			provider: "twikoo";
			lazy: boolean;
			twikoo: TwikooConfig;
	  }
	| {
			provider: "giscus";
			lazy: boolean;
			giscus: GiscusConfig;
	  }
	| null;

/**
 * Валидация и парсинг конфигурации комментариев. Возвращает null при выключении или отсутствии обязательных параметров.
 */
export function resolveCommentOptions(
	config: CommentConfig,
): ResolvedCommentOptions {
	if (!config.enable || config.provider === "none") {
		return null;
	}
	if (config.provider === "twikoo") {
		const envId = config.twikoo.envId?.trim();
		const scriptUrl = config.twikoo.scriptUrl?.trim();
		if (!envId || !scriptUrl) {
			return null;
		}
		return {
			provider: "twikoo",
			lazy: config.lazy,
			twikoo: {
				...config.twikoo,
				envId,
				scriptUrl,
			},
		};
	}
	if (config.provider === "giscus") {
		const repo = config.giscus.repo?.trim();
		const repoId = config.giscus.repoId?.trim();
		const categoryId = config.giscus.categoryId?.trim();
		if (!repo || !repoId || !categoryId) {
			return null;
		}
		return {
			provider: "giscus",
			lazy: config.lazy,
			giscus: {
				...config.giscus,
				repo,
				repoId,
				categoryId,
				category: config.giscus.category?.trim() ?? "",
				theme: {
					light: config.giscus.theme?.light?.trim() || "light",
					dark: config.giscus.theme?.dark?.trim() || "dark",
				},
				scriptUrl: config.giscus.scriptUrl?.trim(),
			},
		};
	}
	return null;
}
