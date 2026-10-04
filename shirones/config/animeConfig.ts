import type {
	AnimeConfig,
	AnimeFallbackKind,
	AnimeProvider,
	AnimeSourceKind,
	ResolvedAnimeOptions,
} from "@/types/animeConfig.ts";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Shirone: Конфигурация страницы аниме и внешних источников данных
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Следует принципу «ноль лишней нагрузки» и двухслойной модели (`docs/remote-data-system.md`):
 * - Локальный режим (local): полностью оффлайн, использует `src/data/anime.ts`, без сети и нагрузки на сборку;
 * - Режим снимка (snapshot): чтение очищенных локальных JSON-снимков (`shirones/config/data/anime-snapshots/`);
 * - Внешняя синхронизация запускается только явно через `pnpm anime:sync`, в рантайме внешние API не опрашиваются;
 * - Приватные токены (например, Bilibili SESSDATA) передаются только через переменные окружения (.env).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 【Популярные сценарии настройки】
 * ─────────────────────────────────────────────────────────────────────────────
 * Сценарий A: Локальные данные (по умолчанию, самый стабильный вариант)
 *   ```ts
 *   source: { kind: "local" }
 *   ```
 *
 * Сценарий B: Использование снапшота Bangumi
 *   1. Укажите свой Bangumi ID, переключите `providers.bangumi.enable` в `true`;
 *   2. Установите `source` в `{ kind: "snapshot", provider: "bangumi" }`;
 *   3. В терминале выполните `pnpm.cmd anime:sync --provider bangumi`.
 *
 * Сценарий C: Использование снапшота Bilibili
 *   1. Укажите свой UID Bilibili (`vmid`), переключите `providers.bilibili.enable` в `true`;
 *   2. Если список скрыт, укажите в `.env` строку `BILI_SESSDATA="ваш_токен"`;
 *   3. Установите `source` в `{ kind: "snapshot", provider: "bilibili" }`;
 *   4. В терминале выполните `pnpm.cmd anime:sync --provider bilibili`.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const animeConfig: AnimeConfig = withUserConfig("anime", {
	/** Включить страницу аниме; если false, пункт меню скрывается, а при переходе на /anime/ отдается 404 */
	enable: false,
	title: "$t:anime",
	description: "$t:animeBanner",

	/** Основной источник данных */
	source: {
		kind: "local",
		// provider: "bangumi",
		// file: "bangumi.json",
		// fetchOnDev: true,
	},

	/** Стратегия отката при ошибке (если снапшот поврежден или отсутствует — откат к локальным данным) */
	fallback: {
		kind: "local",
	},

	/** Настройки внешних провайдеров */
	providers: {
		bangumi: {
			enable: false,
			userId: "", // Числовой UID Bangumi или публичный логин (для теста можно "sai")
			request: {
				pageSize: 50,
				maxItems: 300,
				minDelayMs: 200,
			},
		},
		bilibili: {
			enable: false,
			vmid: "", // Публичный UID на Bilibili
			sessdataEnv: "BILI_SESSDATA",
			cover: {
				mode: "local", // "local" локальное кэширование (рекомендуется) | "remote" удаленные ссылки | "none"
				useWebp: true,
			},
			request: {
				pageSize: 30,
				maxItems: 300,
				minDelayMs: 300,
			},
		},
	},

	/** Управление хранением снапшотов */
	snapshot: {
		directory: "shirones/config/data/anime-snapshots",
		staleAfterDays: 30,
		keepLastValid: true,
	},
});

const SAFE_FILENAME_PATTERN = /^[a-zA-Z0-9_-]+\.json$/;

/**
 * Валидация и резолв конфигурации Anime в неизменяемые опции
 */
export function resolveAnimeOptions(config: AnimeConfig): ResolvedAnimeOptions {
	const enable = Boolean(config.enable);
	const fallback: AnimeFallbackKind =
		config.fallback?.kind === "empty" ? "empty" : "local";

	const directory =
		typeof config.snapshot?.directory === "string" &&
		config.snapshot.directory.trim() &&
		!config.snapshot.directory.includes("..")
			? config.snapshot.directory.trim().replace(/[\\/]+$/, "")
			: "shirones/config/data/anime-snapshots";

	const staleAfterDays =
		typeof config.snapshot?.staleAfterDays === "number" &&
		Number.isFinite(config.snapshot.staleAfterDays) &&
		config.snapshot.staleAfterDays > 0
			? Math.floor(config.snapshot.staleAfterDays)
			: 30;

	const keepLastValid = config.snapshot?.keepLastValid ?? true;

	const rawKind = config.source?.kind;
	let kind: AnimeSourceKind = "local";
	let provider: AnimeProvider | undefined;
	let file: string | undefined;

	if (rawKind === "snapshot") {
		const rawProvider = config.source?.provider;
		if (rawProvider === "bangumi" || rawProvider === "bilibili") {
			provider = rawProvider;
		}

		const rawFile = config.source?.file?.trim();
		if (
			rawFile &&
			SAFE_FILENAME_PATTERN.test(rawFile) &&
			// Если указан provider, но в file ошибочно указан json другого провайдера, автоматически исправляем на соответствующий json
			!(provider === "bilibili" && rawFile === "bangumi.json") &&
			!(provider === "bangumi" && rawFile === "bilibili.json")
		) {
			file = rawFile;
		} else if (provider) {
			file = `${provider}.json`;
		}

		const fetchOnDev = config.source?.fetchOnDev ?? true;

		if (file) {
			kind = "snapshot";
		}

		return Object.freeze({
			enable,
			source: Object.freeze({
				kind,
				...(provider ? { provider } : {}),
				...(file ? { file } : {}),
				fetchOnDev,
			}),
			fallback,
			snapshot: Object.freeze({
				directory,
				staleAfterDays,
				keepLastValid,
			}),
		});
	}

	return Object.freeze({
		enable,
		source: Object.freeze({
			kind,
			...(provider ? { provider } : {}),
			...(file ? { file } : {}),
			fetchOnDev: config.source?.fetchOnDev ?? true,
		}),
		fallback,
		snapshot: Object.freeze({
			directory,
			staleAfterDays,
			keepLastValid,
		}),
	});
}

export const resolvedAnimeOptions: ResolvedAnimeOptions =
	resolveAnimeOptions(animeConfig);
