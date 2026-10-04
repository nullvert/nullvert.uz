import type { ArticleConfig } from "@/types/articleConfig";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * Конфигурация страницы детального просмотра статьи.
 */
export const articleConfig: ArticleConfig = withUserConfig("article", {
	lastUpdated: {
		// При выключении уведомление о дате последнего обновления не отображается.
		enable: true,
		// Расчет по дням календаря UTC; показывать начиная со дня достижения указанного срока (0 — показывать сразу).
		minimumAgeDays: 90,
	},
	discovery: {
		// При выключении общего тумблера блок «Читайте также» в конце статьи не рассчитывается и не рендерится.
		enable: true,
		related: {
			// Показывать только статьи, имеющие хотя бы один общий тег или категорию.
			enable: true,
			count: 2,
		},
		random: {
			// Стабильная случайная выборка по идентификатору текущей статьи (результат в рамках одной сборки не меняется при перезагрузке).
			enable: true,
			count: 2,
		},
	},
	share: {
		// При выключении блок кнопок «Поделиться» в конце статьи не рендерится и не добавляет клиентскую гидратацию.
		enable: true,
		// Включать ли обложку статьи по умолчанию при генерации постера (если обложка недоступна, оформление мягко адаптируется).
		includeCover: true,
	},
});

const MAX_DISCOVERY_COUNT = 6;

export interface ArticleDiscoveryOptions {
	relatedCount: number;
	randomCount: number;
}

export interface ArticleShareOptions {
	includeCover: boolean;
}

export function normalizeDiscoveryCount(value: number): number {
	return Number.isFinite(value)
		? Math.min(MAX_DISCOVERY_COUNT, Math.max(0, Math.floor(value)))
		: 0;
}

export function resolveArticleDiscoveryOptions(
	config: Pick<ArticleConfig, "discovery">,
): ArticleDiscoveryOptions | null {
	if (!config.discovery.enable) return null;

	const relatedCount = config.discovery.related.enable
		? normalizeDiscoveryCount(config.discovery.related.count)
		: 0;
	const randomCount = config.discovery.random.enable
		? normalizeDiscoveryCount(config.discovery.random.count)
		: 0;

	return relatedCount > 0 || randomCount > 0
		? { relatedCount, randomCount }
		: null;
}

export function resolveArticleShareOptions(
	config: Pick<ArticleConfig, "share">,
): ArticleShareOptions | null {
	if (!config.share.enable) return null;
	return { includeCover: config.share.includeCover };
}

export function resolveLastUpdatedNoticeOptions(
	config: Pick<ArticleConfig, "lastUpdated">,
): ArticleConfig["lastUpdated"] | null {
	return config.lastUpdated.enable ? config.lastUpdated : null;
}
