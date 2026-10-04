import type { PermalinkConfig } from "@/types/permalinkConfig.ts";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * Конфигурация постоянных ссылок (Permalink).
 * Управляет формированием URL-адресов статей по шаблону.
 */
export const permalinkConfig: PermalinkConfig = withUserConfig("permalink", {
	/** Включить ли глобальный permalink; если false, используется стандартный путь (/posts/<slug>/) */
	enable: false,
	/**
	 * Шаблон формата permalink
	 * Поддерживаемые плейсхолдеры:
	 * - %year% : 4 цифры года (например, 2026)
	 * - %monthnum% : 2 цифры месяца (01-12)
	 * - %day% : 2 цифры дня (01-31)
	 * - %hour% : 2 цифры часа (00-23)
	 * - %minute% : 2 цифры минут (00-59)
	 * - %second% : 2 цифры секунд (00-59)
	 * - %post_id% : порядковый номер статьи (по дате публикации, самая первая = 1)
	 * - %postname% : имя файла статьи (slug, в нижнем регистре)
	 * - %raw_postname% : исходное имя файла статьи (с сохранением регистра)
	 * - %category% : категория (при отсутствии — "uncategorized")
	 *
	 * Примеры:
	 * - "%year%-%monthnum%-%postname%" => "/2026-12-my-post/"
	 * - "%post_id%-%postname%" => "/42-my-post/"
	 * - "%category%-%postname%" => "/tech-my-post/"
	 * - "%year%/%monthnum%/%day%/%postname%" => "/2026/12/01/my-post/"
	 *
	 * Примечание: слэш "/" поддерживается для создания вложенных путей.
	 */
	format: "%postname%",
});
