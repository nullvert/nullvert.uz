import { musicTracks } from "./data/music.ts";
import type {
	MetingMusicConfig,
	MusicConfig,
	MusicProvider,
	PlaybackMode,
	TrackDescriptor,
} from "@/types/musicConfig.ts";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * Единый источник конфигурации музыкального плеера боковой панели.
 * Следует принципу «ноль лишней нагрузки»: при выключении не создает сетевых запросов и лишнего DOM.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 【Руководство по 4 режимам работы (Provider)】
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. "local" (локальный независимый режим, по умолчанию):
 *    - Источник данных: shirones/config/data/music.ts
 *    - Особенности: ноль внешних API, мгновенная готовность, работает оффлайн.
 *    - Пример:
 *      provider: "local"
 *
 * 2. "custom" (пользовательский список треков):
 *    - Источник данных: массив треков в поле `tracks` (внешние ссылки на аудио и обложки)
 *    - Особенности: гибкая настройка без изменения общих файлов данных.
 *
 * 3. "meting" (облачный плейлист):
 *    - Источник данных: удаленный плейлист через Meting API (NetEase / QQ / Kugou и др.)
 *    - Особенности: асинхронная подгрузка, автоматический парсинг обложек и метаданных.
 *    - Опция `preload: "metadata"`: предзагрузка метаданных при попадании плеера во вьюпорт
 *      (без скачивания самого аудио); по умолчанию "none".
 *
 * 4. "mixed" (смешанный расширенный режим, рекомендуется):
 *    - Источник данных: локальные треки + облачный плейлист Meting
 *    - Особенности: первый трек играет мгновенно из локальных файлов, а облачные подтягиваются в фоне;
 *      при сбое облака плеер плавно переходит на локальные треки.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const musicConfig: MusicConfig = withUserConfig("music", {
	enable: true,
	provider: "local",
	// tracks: [
	// 	{
	// 		id: "custom-1",
	// 		title: "Sample track",
	// 		artist: "Artist",
	// 		cover: "/assets/music/cover/example.webp",
	// 		source: "/assets/music/url/example.mp3",
	// 		duration: 240,
	// 	},
	// ],
	meting: {
		server: "netease",
		type: "playlist",
		id: "14164869977",
		// Предзагрузка метаданных при попадании во вьюпорт:
		// "metadata" (грузить инфо) | "none" (по умолчанию, запрос только после клика)
		preload: "none",
	},
	defaultVolume: 0.3,
	defaultMode: "sequence",
});

export interface ResolvedMusicOptions {
	readonly provider: MusicProvider;
	readonly playlist: readonly TrackDescriptor[];
	readonly meting?: MetingMusicConfig;
	readonly defaultVolume: number;
	readonly defaultMode: PlaybackMode;
}

const ABSOLUTE_MEDIA_SOURCE = /^(?:https?:)?\/\//i;
const UNSAFE_SCHEME = /^[a-z][a-z\d+.-]*:/i;

function normalizeMediaSource(value: string): string | null {
	const source = value.trim();
	if (!source) return null;
	if (ABSOLUTE_MEDIA_SOURCE.test(source) || source.startsWith("/")) {
		return source;
	}
	if (UNSAFE_SCHEME.test(source)) return null;
	return `/${source.replace(/^\.\//, "")}`;
}

function normalizeTrack(
	track: TrackDescriptor,
	usedIds: Set<string>,
): TrackDescriptor | null {
	const id = track.id.trim();
	const title = track.title.trim();
	const source = normalizeMediaSource(track.source);
	if (!id || !title || !source || usedIds.has(id)) return null;

	usedIds.add(id);
	const artist = track.artist?.trim() || undefined;
	const cover = track.cover
		? (normalizeMediaSource(track.cover) ?? undefined)
		: undefined;
	const duration =
		typeof track.duration === "number" &&
		Number.isFinite(track.duration) &&
		track.duration > 0
			? track.duration
			: undefined;
	const isNew = typeof track.isNew === "boolean" ? track.isNew : undefined;

	return Object.freeze({ id, title, source, artist, cover, duration, isNew });
}

export function clampMusicVolume(value: number, fallback = 0.7): number {
	if (!Number.isFinite(value)) return fallback;
	return Math.min(1, Math.max(0, value));
}

/** Заполнение дефолтных значений meting (preload по умолчанию "none") */
function resolveMetingConfig(
	meting: MetingMusicConfig | undefined,
): MetingMusicConfig | undefined {
	if (!meting) return meting;
	return Object.freeze({ ...meting, preload: meting.preload ?? "none" });
}

export function resolveMusicOptions(
	config: MusicConfig,
): ResolvedMusicOptions | null {
	if (!config.enable) return null;

	const provider: MusicProvider = config.provider ?? "local";

	if (provider === "meting") {
		const id = config.meting?.id?.trim();
		if (!id) return null;
		return Object.freeze({
			provider: "meting",
			playlist: Object.freeze([]),
			meting: resolveMetingConfig(config.meting),
			defaultVolume: clampMusicVolume(config.defaultVolume),
			defaultMode: config.defaultMode,
		});
	}

	let rawTracks: readonly TrackDescriptor[] = [];
	if (provider === "local" || provider === "mixed") {
		rawTracks = config.tracks ?? musicTracks;
	} else if (provider === "custom") {
		rawTracks = config.tracks ?? [];
	}

	const usedIds = new Set<string>();
	const playlist = rawTracks
		.map((track) => normalizeTrack(track, usedIds))
		.filter((track): track is TrackDescriptor => track !== null);

	if (provider === "mixed") {
		const metingId = config.meting?.id?.trim();
		if (playlist.length === 0 && !metingId) return null;
		return Object.freeze({
			provider: "mixed",
			playlist: Object.freeze(playlist),
			meting: resolveMetingConfig(config.meting),
			defaultVolume: clampMusicVolume(config.defaultVolume),
			defaultMode: config.defaultMode,
		});
	}

	if (playlist.length === 0) return null;

	return Object.freeze({
		provider,
		playlist: Object.freeze(playlist),
		defaultVolume: clampMusicVolume(config.defaultVolume),
		defaultMode: config.defaultMode,
	});
}
