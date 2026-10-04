import type { ResolvedUmamiOptions, UmamiConfig } from "@/types/umamiConfig";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * Единый источник конфигурации аналитики Umami (предоставляется через oddmisc).
 *
 * Следует принципу «ноль лишней нагрузки»: по умолчанию отключено (enable: false),
 * при выключенном состоянии не производит внешних запросов, не оставляет лишнего DOM и не утяжеляет бандл.
 *
 * Подробная документация: `docs/umami-guide.md`
 */
export const umamiConfig: UmamiConfig = withUserConfig("umami", {
	/** Общий переключатель Umami: при false рантайм-скрипт и DOM-элементы не загружаются вовсе */
	enable: false,
	/** Публичная ссылка на дашборд Umami (обязательно) */
	shareUrl: "",
	/** Umami Website ID; сбор аналитики активируется при совместном заполнении со scriptUrl */
	websiteId: "",
	/** URL трекинг-скрипта Umami; сбор аналитики активируется при совместном заполнении с websiteId */
	scriptUrl: "",
});

/**
 * Валидация и парсинг конфигурации Umami. Возвращает null, если отключено или отсутствуют обязательные параметры.
 */
export function resolveUmamiOptions(config: UmamiConfig): ResolvedUmamiOptions {
	if (!config.enable) {
		return null;
	}
	const shareUrl = config.shareUrl?.trim();
	if (!shareUrl) {
		return null;
	}
	return {
		shareUrl,
		websiteId: config.websiteId?.trim() || undefined,
		scriptUrl: config.scriptUrl?.trim() || undefined,
	};
}

export type { ResolvedUmamiOptions };
