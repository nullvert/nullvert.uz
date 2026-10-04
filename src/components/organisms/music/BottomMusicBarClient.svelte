<script lang="ts">
import Icon from "@iconify/svelte";
import { onMount, untrack } from "svelte";
import type { ResolvedMusicOptions } from "@/config/musicConfig";
import type {
	MusicErrorCode,
	MusicRuntime,
	MusicSnapshot,
	PlaybackMode,
	TrackDescriptor,
} from "@/types/musicConfig";
import BottomMusicDrawer from "./BottomMusicDrawer.svelte";
import { createMusicRuntime, destroyMusicRuntime } from "@utils/music";
import "./bottomMusicBar.css";

interface Labels {
	playerTitle?: string;
	previous: string;
	play: string;
	pause: string;
	next: string;
	mute: string;
	unmute: string;
	playbackMode: string;
	modeSequence: string;
	modeRepeatOne: string;
	modeShuffle: string;
	progress: string;
	volume: string;
	showPlaylist: string;
	hidePlaylist: string;
	empty: string;
	loading: string;
	notRequested: string;
	nowPlaying: string;
	filterAll: string;
	filterFavorites: string;
	filterNew: string;
	emptyFavorites: string;
	emptyNew: string;
	resetFilters: string;
	expandPlayer: string;
	collapsePlayer: string;
	randomTrack: string;
	close: string;
	favoriteAdd: string;
	favoriteRemove: string;
	favoriteIn: string;
	errors: Record<MusicErrorCode, string>;
}

interface Props {
	options: ResolvedMusicOptions;
	labels: Labels;
}

let { options, labels }: Props = $props();

let runtime = $state<MusicRuntime | null>(null);
// Initial snapshot only: the island hydrates once per page, later changes are
// owned by the runtime, so reading the props non-reactively is intentional.
const initialOptions = untrack(() => options);
const hasInitialTracks = initialOptions.playlist.length > 0;
const hasMeting =
	(initialOptions.provider === "meting" ||
		initialOptions.provider === "mixed") &&
	Boolean(initialOptions.meting?.id);

let snapshot = $state<MusicSnapshot>({
	playlist: initialOptions.playlist,
	currentIndex: hasInitialTracks ? 0 : -1,
	currentTrack: initialOptions.playlist[0] ?? null,
	status: "idle",
	currentTime: 0,
	duration: initialOptions.playlist[0]?.duration ?? 0,
	volume: initialOptions.defaultVolume,
	muted: false,
	mode: initialOptions.defaultMode,
	error: hasInitialTracks || hasMeting ? null : "empty-playlist",
});

let playlistOpen = $state(false);
let isMinimized = $state(false);
let isEnabled = $state(
	typeof window !== "undefined"
		? localStorage.getItem("shirone-music-enabled") !== "false"
		: true,
);
let draggingSeek = $state(false);
let dragTime = $state<number | null>(null);

const FAVORITES_STORAGE_KEY = "shirone-music-favorites";
const SEEN_TRACKS_STORAGE_KEY = "shirone-music-seen";

let favorites = $state<string[]>([]);
let seenTrackIds = $state<string[]>([]);
let filterTab = $state<"all" | "favorites" | "new">("all");

function getTrackIsNew(track: TrackDescriptor): boolean {
	return Boolean(track.isNew) && !seenTrackIds.includes(track.id);
}

function markTrackAsSeen(trackId: string): void {
	if (!trackId || seenTrackIds.includes(trackId)) return;
	seenTrackIds = [...seenTrackIds, trackId];
	if (typeof window !== "undefined") {
		try {
			localStorage.setItem(SEEN_TRACKS_STORAGE_KEY, JSON.stringify(seenTrackIds));
		} catch {}
	}
}

const playing = $derived(snapshot.status === "playing");
const loading = $derived(snapshot.status === "loading");
const hasTracks = $derived(snapshot.playlist.length > 0);

const newCount = $derived.by(() => {
	let count = 0;
	for (const track of snapshot.playlist) {
		if (getTrackIsNew(track)) count++;
	}
	return count;
});

const totalNewConfiguredCount = $derived.by(() => {
	let count = 0;
	for (const track of snapshot.playlist) {
		if (track.isNew) count++;
	}
	return count;
});

const validFavoritesCount = $derived.by(() => {
	const currentTrackIds = new Set(snapshot.playlist.map((t) => t.id));
	return favorites.filter((id) => currentTrackIds.has(id)).length;
});

interface FilteredItem {
	track: TrackDescriptor;
	originalIndex: number;
	isFavorite: boolean;
}

const filteredPlaylist = $derived.by(() => {
	const result: FilteredItem[] = [];

	for (let i = 0; i < snapshot.playlist.length; i++) {
		const rawTrack = snapshot.playlist[i];
		const isFav = favorites.includes(rawTrack.id);
		const isUnseen = getTrackIsNew(rawTrack);

		if (filterTab === "favorites" && !isFav) continue;
		if (filterTab === "new" && !rawTrack.isNew) continue;

		result.push({
			track: {
				...rawTrack,
				isNew: isUnseen,
			},
			originalIndex: i,
			isFavorite: isFav,
		});
	}

	return result;
});

const effectiveTrack = $derived.by(() => {
	if (!playing && filterTab !== "all" && filteredPlaylist.length > 0) {
		const inFilter = filteredPlaylist.some(
			(item) => item.originalIndex === snapshot.currentIndex,
		);
		if (!inFilter) {
			return filteredPlaylist[0].track;
		}
	}
	return snapshot.currentTrack;
});

const currentEffectiveTime = $derived(
	draggingSeek && dragTime !== null ? dragTime : snapshot.currentTime,
);
const duration = $derived(
	Math.max(
		0,
		!playing && effectiveTrack && effectiveTrack !== snapshot.currentTrack
			? (effectiveTrack.duration ?? 0)
			: snapshot.duration,
	),
);
const progressMax = $derived(duration > 0 ? duration : 1);
const progressRatio = $derived(
	duration > 0 ? Math.min(Math.max(currentEffectiveTime / duration, 0), 1) : 0,
);

const displayTime = $derived(formatTime(currentEffectiveTime));
const displayDuration = $derived(formatTime(duration));

const currentTitle = $derived(
	effectiveTrack?.title ??
		(loading ? labels.loading : labels.empty),
);
const currentArtist = $derived(
	effectiveTrack?.artist ?? (loading ? "..." : "—"),
);
const isCurrentFavorite = $derived(
	Boolean(effectiveTrack && favorites.includes(effectiveTrack.id)),
);

const modeIcons: Record<PlaybackMode, string> = {
	sequence: "material-symbols:repeat-rounded",
	"repeat-one": "material-symbols:repeat-one-rounded",
	shuffle: "material-symbols:shuffle-rounded",
};

const modeLabels: Record<PlaybackMode, string> = $derived({
	sequence: labels.modeSequence,
	"repeat-one": labels.modeRepeatOne,
	shuffle: labels.modeShuffle,
});

onMount(() => {
	let unsubscribe = () => {};
	let active = true;

	if (typeof window !== "undefined") {
		isEnabled = localStorage.getItem("shirone-music-enabled") !== "false";
		if (!isEnabled) {
			document.documentElement.dataset.music = "disabled";
		}
		try {
			const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
			if (stored) favorites = JSON.parse(stored);
		} catch {}
		try {
			const storedSeen = localStorage.getItem(SEEN_TRACKS_STORAGE_KEY);
			if (storedSeen) seenTrackIds = JSON.parse(storedSeen);
		} catch {}
	}

	const onVisibilityChange = (e: Event) => {
		const detail = (e as CustomEvent<{ enabled: boolean }>).detail;
		if (typeof detail?.enabled === "boolean") {
			isEnabled = detail.enabled;
			if (!isEnabled) {
				document.documentElement.dataset.music = "disabled";
				if (playing) {
					void runtime?.pause();
				}
			} else {
				delete document.documentElement.dataset.music;
			}
		}
	};
	window.addEventListener("shirone-music-visibility-change", onVisibilityChange);

		destroyMusicRuntime();
		runtime = createMusicRuntime(options, {
			createAudio: () => {
				const el = new Audio();
				el.addEventListener(
					"ended",
					(e) => {
						if (filterTab !== "all" && filteredPlaylist.length > 0) {
							if (snapshot.mode === "repeat-one") return;
							e.stopImmediatePropagation();
							nextTrack();
						}
					},
					true,
				);
				return el;
			},
		});
		unsubscribe = runtime.subscribe((next) => {
			snapshot = next;
			if (next.status === "playing" && next.currentTrack?.id) {
				markTrackAsSeen(next.currentTrack.id);
			}

			// Поддержка системных медиа-клавиш клавиатуры и OS Media Notification (Next / Prev / Play / Pause)
			if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
				const track = next.currentTrack;
				if (track) {
					try {
						navigator.mediaSession.metadata = new MediaMetadata({
							title: track.title,
							artist: track.artist || "Shirone",
							album: track.album || "Playlist",
							artwork: track.cover
								? [{ src: track.cover, sizes: "512x512", type: "image/webp" }]
								: [],
						});
					} catch {}
				}

				try {
					navigator.mediaSession.playbackState =
						next.status === "playing" ? "playing" : "paused";
				} catch {}
			}
		});

		// Регистрация обработчиков медиа-клавиш клавиатуры
		if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
			try {
				navigator.mediaSession.setActionHandler("play", () => {
					void runtime?.play();
				});
				navigator.mediaSession.setActionHandler("pause", () => {
					void runtime?.pause();
				});
				navigator.mediaSession.setActionHandler("nexttrack", () => {
					nextTrack();
				});
				navigator.mediaSession.setActionHandler("previoustrack", () => {
					previousTrack();
				});
				navigator.mediaSession.setActionHandler("seekto", (details) => {
					if (typeof details.seekTime === "number") {
						runtime?.seek(details.seekTime);
					}
				});
			} catch {}
		}

	return () => {
		active = false;
		unsubscribe();
		runtime?.destroy();
		window.removeEventListener("shirone-music-visibility-change", onVisibilityChange);
	};
});

function formatTime(value: number): string {
	if (!Number.isFinite(value) || value < 0) return "0:00";
	const seconds = Math.floor(value);
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function getNextFilteredIndex(direction: "next" | "prev", mode: PlaybackMode): number {
	const len = filteredPlaylist.length;
	if (len <= 0) return -1;
	if (len === 1) return 0;

	const currentFilteredIndex = filteredPlaylist.findIndex(
		(item) => item.originalIndex === snapshot.currentIndex,
	);

	if (direction === "next") {
		if (mode === "shuffle") {
			const base = currentFilteredIndex >= 0 ? currentFilteredIndex : 0;
			const offset = 1 + Math.floor(Math.random() * (len - 1));
			return (base + offset) % len;
		}
		if (currentFilteredIndex < 0) return 0;
		return (currentFilteredIndex + 1) % len;
	} else {
		if (mode === "shuffle") {
			const base = currentFilteredIndex >= 0 ? currentFilteredIndex : 0;
			const offset = 1 + Math.floor(Math.random() * (len - 1));
			return (base + offset) % len;
		}
		if (currentFilteredIndex <= 0) return len - 1;
		return currentFilteredIndex - 1;
	}
}

function cycleMode(): void {
	const modes: PlaybackMode[] = ["sequence", "repeat-one", "shuffle"];
	const index = modes.indexOf(snapshot.mode);
	runtime?.setMode(modes[(index + 1) % modes.length]);
}

function togglePlay(): void {
	if (snapshot.status !== "playing") {
		if (filterTab !== "all" && filteredPlaylist.length > 0) {
			const inFilter = filteredPlaylist.some(
				(item) => item.originalIndex === snapshot.currentIndex,
			);
			if (!inFilter) {
				void runtime?.select(filteredPlaylist[0].originalIndex);
				return;
			}
		}
	}
	void runtime?.toggle();
}

function nextTrack(): void {
	if (filterTab === "all" || filteredPlaylist.length === 0) {
		void runtime?.next();
		return;
	}
	const nextIdx = getNextFilteredIndex(
		"next",
		snapshot.mode === "repeat-one" ? "sequence" : snapshot.mode,
	);
	if (nextIdx >= 0) {
		void runtime?.select(filteredPlaylist[nextIdx].originalIndex);
	}
}

function previousTrack(): void {
	if (snapshot.currentTime > 3) {
		runtime?.seek(0);
		return;
	}
	if (filterTab === "all" || filteredPlaylist.length === 0) {
		void runtime?.previous();
		return;
	}
	const prevIdx = getNextFilteredIndex(
		"prev",
		snapshot.mode === "repeat-one" ? "sequence" : snapshot.mode,
	);
	if (prevIdx >= 0) {
		void runtime?.select(filteredPlaylist[prevIdx].originalIndex);
	}
}

function setVolume(event: Event): void {
	const val = Number((event.currentTarget as HTMLInputElement).value);
	runtime?.setVolume(val);
}

function toggleMute(): void {
	runtime?.setMuted(!snapshot.muted);
}

function onVolumeWheel(event: WheelEvent): void {
	event.preventDefault();
	const step = 0.05;
	const delta = event.deltaY < 0 ? step : -step;
	const current = snapshot.muted ? 0 : snapshot.volume;
	const next = Math.min(Math.max(current + delta, 0), 1);
	if (snapshot.muted && next > 0) {
		runtime?.setMuted(false);
	}
	runtime?.setVolume(Math.round(next * 100) / 100);
}

const volumePercent = $derived(
	Math.round((snapshot.muted ? 0 : snapshot.volume) * 100)
);

function onProgressPointerDown(): void {
	draggingSeek = true;
}

function onProgressInput(event: Event): void {
	const val = Number((event.currentTarget as HTMLInputElement).value);
	dragTime = Number.isFinite(val) ? Math.max(0, val) : null;
}

function onProgressChange(event: Event): void {
	const val = Number((event.currentTarget as HTMLInputElement).value);
	draggingSeek = false;
	dragTime = null;
	if (Number.isFinite(val)) {
		runtime?.seek(Math.max(0, val));
	}
}

function onProgressPointerUp(event: PointerEvent): void {
	draggingSeek = false;
	const input = event.currentTarget as HTMLInputElement;
	const val = Number(input.value);
	dragTime = null;
	if (Number.isFinite(val)) {
		runtime?.seek(Math.max(0, val));
	}
}

function toggleFavorite(trackId: string, event?: Event): void {
	event?.stopPropagation();
	if (favorites.includes(trackId)) {
		favorites = favorites.filter((id) => id !== trackId);
	} else {
		favorites = [...favorites, trackId];
	}
	if (typeof window !== "undefined") {
		try {
			localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
		} catch {}
	}
}

function handleTrackClick(originalIndex: number): void {
	const clickedTrack = snapshot.playlist[originalIndex];
	if (clickedTrack?.id) {
		markTrackAsSeen(clickedTrack.id);
	}
	if (originalIndex === snapshot.currentIndex) {
		void runtime?.toggle();
	} else {
		void runtime?.select(originalIndex);
	}
}

function shuffleAndPlay(): void {
	if (filteredPlaylist.length === 0) return;
	runtime?.setMode("shuffle");
	const nextIdx = getNextFilteredIndex("next", "shuffle");
	if (nextIdx >= 0) {
		void runtime?.select(filteredPlaylist[nextIdx].originalIndex);
	}
}

function togglePlaylist(): void {
	playlistOpen = !playlistOpen;
	if (playlistOpen) {
		void runtime?.initialize();
	}
}
</script>

{#if isEnabled}
	{#if isMinimized}
		<!-- Компактная плавающая пилюля возврата плеера -->
		<button
			type="button"
			class="bottom-player-pill m3-state-layer"
			onclick={() => (isMinimized = false)}
			aria-label={labels.expandPlayer}
			title={labels.expandPlayer}
		>
			<Icon icon="material-symbols:music-note-rounded" class="pill-music-icon" />
			<span class="pill-text">{currentTitle}</span>
			<Icon
				icon={playing ? "material-symbols:equalizer-rounded" : "material-symbols:play-arrow-rounded"}
				class="pill-status-icon"
			/>
		</button>
	{:else}
		<!-- Полноразмерный плеер в стиле M3E стриминговых сервисов -->
		<aside
			class="bottom-music-bar"
			class:is-dragging={draggingSeek}
			aria-label={labels.playerTitle || labels.notRequested}
			data-playing={playing ? "true" : "false"}
		>
			<!-- 0. Фоновая адаптивная заливка прогресса (Яндекс Музыка style) -->
			<div
				class="bottom-music-bar__progress-bg"
				style={`width: ${progressRatio * 100}%`}
				aria-hidden="true"
			></div>

			<!-- 1. Верхний прогресс-бар в стиле Яндекс Музыки -->
			<div class="scrubber-container">
				<div class="scrubber-track">
					<div class="scrubber-fill" style={`width: ${progressRatio * 100}%`}>
						<span class="scrubber-thumb" aria-hidden="true"></span>
					</div>
				</div>
				<input
					type="range"
					min="0"
					max={progressMax}
					step="0.1"
					value={Math.min(currentEffectiveTime, progressMax)}
					disabled={duration <= 0 || !hasTracks}
					aria-label={labels.progress.replace("{current}", displayTime).replace("{duration}", displayDuration)}
					onpointerdown={onProgressPointerDown}
					onpointerup={onProgressPointerUp}
					oninput={onProgressInput}
					onchange={onProgressChange}
					class="scrubber-input"
				/>
			</div>

			<div class="bottom-music-bar__inner">
				<!-- 2. Левая секция: сердечко вместо обложки, название и автор -->
				<div class="bottom-music-bar__track">
					<button
						type="button"
						class="player-fav-btn m3-state-layer"
						class:is-fav={isCurrentFavorite}
						onclick={(e) => effectiveTrack && toggleFavorite(effectiveTrack.id, e)}
						aria-label={isCurrentFavorite ? labels.favoriteRemove : labels.favoriteAdd}
						title={isCurrentFavorite ? labels.favoriteIn : labels.favoriteAdd}
						disabled={!effectiveTrack}
					>
						{#if isCurrentFavorite}
							<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
								<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
							</svg>
						{/if}
					</button>

					<div class="track-info">
						<div class="track-title-row">
							<span class="track-title" title={currentTitle}>{currentTitle}</span>
							{#if playing}
								<div class="eq-bars" aria-hidden="true" title={labels.nowPlaying.replace("{title}", currentTitle)}>
									<span class="bar bar-1"></span>
									<span class="bar bar-2"></span>
									<span class="bar bar-3"></span>
								</div>
							{/if}
						</div>
						<div class="track-meta">
							<span class="track-artist" title={currentArtist}>{currentArtist}</span>
							{#if duration > 0}
								<span class="meta-dot" aria-hidden="true">•</span>
								<span class="track-time" aria-hidden="true">{displayTime} / {displayDuration}</span>
							{/if}
						</div>
					</div>
				</div>

				<!-- 3. Центральная секция: строго по центру окна -->
				<div class="bottom-music-bar__controls">
					<button
						type="button"
						class="btn-icon btn-mode m3-state-layer"
						onclick={cycleMode}
						aria-label={`${labels.playbackMode}: ${modeLabels[snapshot.mode]}`}
						title={`${labels.playbackMode}: ${modeLabels[snapshot.mode]}`}
						disabled={!hasTracks}
					>
						<Icon icon={modeIcons[snapshot.mode]} />
					</button>

					<button
						type="button"
						class="btn-icon m3-state-layer"
						onclick={previousTrack}
						aria-label={labels.previous}
						title={labels.previous}
						disabled={!hasTracks}
					>
						<Icon icon="material-symbols:skip-previous-rounded" />
					</button>

					<button
						type="button"
						class="btn-play m3-state-layer"
						class:is-playing={playing}
						onclick={togglePlay}
						aria-label={playing ? labels.pause : labels.play}
						title={playing ? labels.pause : labels.play}
						disabled={!hasTracks && !hasMeting}
					>
						{#if playing}
							<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
								<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" class="translate-x-[1px]">
								<path d="M8 5v14l11-7z"/>
							</svg>
						{/if}
					</button>

					<button
						type="button"
						class="btn-icon m3-state-layer"
						onclick={nextTrack}
						aria-label={labels.next}
						title={labels.next}
						disabled={!hasTracks}
					>
						<Icon icon="material-symbols:skip-next-rounded" />
					</button>
				</div>

				<!-- 4. Правая секция: капсула громкости, плейлист, сворачивание -->
				<div class="bottom-music-bar__actions">
					<div
						class="volume-capsule"
						onwheel={onVolumeWheel}
						title="Громкость (колесико мыши)"
					>
						<button
							type="button"
							class="volume-btn m3-state-layer"
							onclick={toggleMute}
							aria-label={snapshot.muted ? labels.unmute : labels.mute}
							title={snapshot.muted ? labels.unmute : labels.mute}
						>
							{#if snapshot.muted || snapshot.volume === 0}
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
									<path d="M4.34 2.93L2.93 4.34 7.29 8.7 7 9H3v6h4l5 5v-6.59l4.18 4.18c-.65.49-1.38.88-2.18 1.11v2.06c1.39-.32 2.65-.97 3.72-1.84l1.94 1.94 1.41-1.41L4.34 2.93zM12 4L9.91 6.09 12 8.18V4zm4.5 8c0-.72-.18-1.39-.49-1.99l1.53-1.53C17.81 9.48 18 10.71 18 12c0 2.22-1.21 4.15-3 5.19v-2.12c1.07-.76 1.76-2 1.76-3.07zm2.5 0c0 1.25-.32 2.43-.88 3.46l1.49 1.49C20.35 15.48 21 13.82 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71z"/>
								</svg>
							{:else if snapshot.volume < 0.5}
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
									<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
								</svg>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
									<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
								</svg>
							{/if}
						</button>
						<div class="volume-slider-wrap">
							<input
								type="range"
								min="0"
								max="1"
								step="0.01"
								value={snapshot.muted ? 0 : snapshot.volume}
								aria-label={labels.volume.replace("{volume}", String(volumePercent))}
								oninput={setVolume}
								class="volume-slider"
								style={`--vol-pct: ${volumePercent}%`}
							/>
						</div>
						<span class="volume-pct" aria-hidden="true">{volumePercent}%</span>
					</div>

					<button
						type="button"
						class="btn-icon btn-playlist m3-state-layer"
						class:active={playlistOpen}
						onclick={togglePlaylist}
						aria-label={playlistOpen ? labels.hidePlaylist : labels.showPlaylist}
						title={playlistOpen ? labels.hidePlaylist : labels.showPlaylist}
					>
						<Icon icon="material-symbols:queue-music-rounded" />
						{#if newCount > 0}
							<span class="btn-playlist__badge" aria-label="{newCount} new">
								{newCount > 9 ? "9+" : newCount}
							</span>
						{/if}
					</button>

					<button
						type="button"
						class="btn-icon btn-minimize m3-state-layer"
						onclick={() => (isMinimized = true)}
						aria-label={labels.collapsePlayer}
						title={labels.collapsePlayer}
					>
						<Icon icon="material-symbols:keyboard-arrow-down-rounded" />
					</button>
				</div>
			</div>

			<!-- 5. Всплывающая карточка очереди воспроизведения -->
			<BottomMusicDrawer
				isOpen={playlistOpen}
				items={filteredPlaylist}
				currentIndex={snapshot.currentIndex}
				playing={playing}
				filterTab={filterTab}
				favoritesCount={validFavoritesCount}
				newCount={newCount}
				totalNewCount={totalNewConfiguredCount}
				totalCount={snapshot.playlist.length}
				labels={labels}
				onSelectTrack={handleTrackClick}
				onToggleFavorite={toggleFavorite}
				onShuffle={shuffleAndPlay}
				onClose={() => (playlistOpen = false)}
				onSetFilterTab={(tab) => (filterTab = tab)}
				formatTime={formatTime}
			/>
		</aside>
	{/if}
{/if}
