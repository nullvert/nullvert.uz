<script lang="ts">
import Icon from "@iconify/svelte";
import type { TrackDescriptor } from "@/types/musicConfig";

interface PlaylistItem {
	track: TrackDescriptor;
	originalIndex: number;
	isFavorite: boolean;
}

interface Labels {
	showPlaylist: string;
	empty: string;
	emptyFavorites: string;
	emptyNew: string;
	resetFilters: string;
	randomTrack: string;
	close: string;
	favoriteAdd: string;
	favoriteRemove: string;
	favoriteIn: string;
	filterAll: string;
	filterFavorites: string;
	filterNew: string;
}

interface Props {
	isOpen: boolean;
	items: PlaylistItem[];
	currentIndex: number;
	playing: boolean;
	filterTab: "all" | "favorites" | "new";
	favoritesCount: number;
	newCount: number;
	totalNewCount?: number;
	totalCount: number;
	labels: Labels;
	onSelectTrack: (originalIndex: number) => void;
	onToggleFavorite: (trackId: string, event: MouseEvent) => void;
	onShuffle: () => void;
	onClose: () => void;
	onSetFilterTab: (tab: "all" | "favorites" | "new") => void;
	formatTime: (sec: number) => string;
}

let {
	isOpen,
	items,
	currentIndex,
	playing,
	filterTab,
	favoritesCount,
	newCount,
	totalNewCount,
	totalCount,
	labels,
	onSelectTrack,
	onToggleFavorite,
	onShuffle,
	onClose,
	onSetFilterTab,
	formatTime,
}: Props = $props();
</script>

{#if isOpen}
	<div class="playlist-scrim" aria-hidden="true" onclick={onClose}></div>
	<div class="playlist-drawer" role="region" aria-label={labels.showPlaylist}>
		<!-- Шапка очереди треков -->
		<div class="playlist-drawer__header">
			<div class="header-title-wrap">
				<Icon icon="material-symbols:queue-music-rounded" class="header-icon" />
				<span class="header-title">{labels.showPlaylist}</span>
			</div>

			<div class="playlist-drawer__actions">
				<button
					type="button"
					class="drawer-icon-btn m3-state-layer"
					onclick={onShuffle}
					aria-label={labels.randomTrack}
					title={labels.randomTrack}
					disabled={items.length === 0}
				>
					<Icon icon="material-symbols:shuffle-rounded" />
				</button>
				<button
					type="button"
					class="drawer-icon-btn m3-state-layer"
					onclick={onClose}
					aria-label={labels.close}
					title={labels.close}
				>
					<Icon icon="material-symbols:close-rounded" />
				</button>
			</div>
		</div>

		<!-- Список треков со скроллбаром -->
		<div class="playlist-drawer__list">
			{#if items.length === 0}
				<div class="playlist-empty-state">
					<Icon icon="material-symbols:music-off-rounded" class="empty-icon" />
					<p class="empty-text">
						{#if filterTab === "favorites"}
							{labels.emptyFavorites}
						{:else if filterTab === "new"}
							{labels.emptyNew}
						{:else}
							{labels.empty}
						{/if}
					</p>
					{#if filterTab !== "all"}
						<button
							type="button"
							class="empty-reset-btn m3-state-layer"
							onclick={() => onSetFilterTab("all")}
						>
							{labels.resetFilters}
						</button>
					{/if}
				</div>
			{:else}
				{#each items as item (item.track.id)}
					{@const isCurrent = item.originalIndex === currentIndex}
					<div
						class="playlist-item m3-state-layer"
						class:is-active={isCurrent}
						onclick={() => onSelectTrack(item.originalIndex)}
						role="button"
						tabindex="0"
						onkeydown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onSelectTrack(item.originalIndex);
							}
						}}
					>
						<div class="item-leading" aria-hidden="true">
							{#if isCurrent && playing}
								<div class="item-eq-bars">
									<span class="bar bar-1"></span>
									<span class="bar bar-2"></span>
									<span class="bar bar-3"></span>
								</div>
							{:else if isCurrent && !playing}
								<span class="item-pause-icon">
									<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
										<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
									</svg>
								</span>
							{:else}
								<span class="item-num">{item.originalIndex + 1}</span>
							{/if}
							<span class="item-play-hover">
								{#if isCurrent && playing}
									<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
										<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
									</svg>
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
										<path d="M8 5v14l11-7z"/>
									</svg>
								{/if}
							</span>
						</div>

						<div class="item-info">
							<span class="item-title" title={item.track.title}>{item.track.title}</span>
							{#if item.track.isNew}
								<span class="badge-new-subtle">new</span>
							{/if}
						</div>

						{#if item.track.duration}
							<span class="item-duration">{formatTime(item.track.duration)}</span>
						{/if}

						<button
							type="button"
							class="item-fav-btn"
							class:is-fav={item.isFavorite}
							onclick={(e) => onToggleFavorite(item.track.id, e)}
							aria-label={item.isFavorite ? labels.favoriteRemove : labels.favoriteAdd}
							title={item.isFavorite ? labels.favoriteIn : labels.favoriteAdd}
						>
							{#if item.isFavorite}
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
								</svg>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
									<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
								</svg>
							{/if}
						</button>
					</div>
				{/each}
			{/if}
		</div>

		<!-- MD3E Outlined Segmented Button Bar внизу шторки -->
		<div class="playlist-drawer__footer">
			<div class="m3-segmented-button-group" role="tablist" aria-label={labels.showPlaylist}>
				<button
					type="button"
					role="tab"
					class="m3-segmented-item"
					class:selected={filterTab === "all"}
					aria-selected={filterTab === "all"}
					onclick={() => onSetFilterTab("all")}
				>
					<span class="m3-segmented-check-wrap" aria-hidden="true">
						{#if filterTab === "all"}
							<svg class="m3-segmented-check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
								<path d="m9.55 18l-5.7-5.7l1.425-1.425L9.55 15.15l9.175-9.175L20.15 7.4z"/>
							</svg>
						{/if}
					</span>
					<span class="m3-segmented-label">{labels.filterAll}</span>
					<span class="m3-segmented-count">{totalCount}</span>
				</button>

				<button
					type="button"
					role="tab"
					class="m3-segmented-item"
					class:selected={filterTab === "favorites"}
					aria-selected={filterTab === "favorites"}
					onclick={() => onSetFilterTab("favorites")}
				>
					<span class="m3-segmented-check-wrap" aria-hidden="true">
						{#if filterTab === "favorites"}
							<svg class="m3-segmented-check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
								<path d="m9.55 18l-5.7-5.7l1.425-1.425L9.55 15.15l9.175-9.175L20.15 7.4z"/>
							</svg>
						{/if}
					</span>
					<span class="m3-segmented-label">{labels.filterFavorites}</span>
					<span class="m3-segmented-count">{favoritesCount}</span>
				</button>

				<button
					type="button"
					role="tab"
					class="m3-segmented-item"
					class:selected={filterTab === "new"}
					aria-selected={filterTab === "new"}
					onclick={() => onSetFilterTab("new")}
				>
					<span class="m3-segmented-check-wrap" aria-hidden="true">
						{#if filterTab === "new"}
							<svg class="m3-segmented-check" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
								<path d="m9.55 18l-5.7-5.7l1.425-1.425L9.55 15.15l9.175-9.175L20.15 7.4z"/>
							</svg>
						{/if}
					</span>
					<span class="m3-segmented-label">{labels.filterNew}</span>
					<span class="m3-segmented-count">{totalNewCount ?? newCount}</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
/* Фоновый диммер при открытом плейлисте */
.playlist-scrim {
	position: fixed;
	inset: 0;
	background: color-mix(in srgb, var(--scrim, #000) 65%, transparent);
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	z-index: 48;
	animation: scrimFadeIn 200ms cubic-bezier(0.2, 0, 0, 1) forwards;
}

@keyframes scrimFadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

/* Карточка очереди воспроизведения */
.playlist-drawer {
	position: fixed;
	bottom: calc(56px + 12px);
	right: 1.5rem;
	width: 390px;
	max-width: calc(100vw - 1.5rem);
	background: color-mix(in srgb, var(--surface-container) 95%, transparent);
	backdrop-filter: blur(28px);
	-webkit-backdrop-filter: blur(28px);
	border: 1px solid var(--outline-variant);
	border-radius: var(--shape-corner-l, 16px);
	box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
	overflow: hidden;
	z-index: 50;
	animation: popIn 200ms cubic-bezier(0.2, 0, 0, 1) forwards;
	display: flex;
	flex-direction: column;
}

@keyframes popIn {
	from {
		opacity: 0;
		transform: translateY(8px) scale(0.98);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

.playlist-drawer__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.85rem 1rem 0.6rem 1rem;
	background: color-mix(in srgb, var(--surface-container-high) 85%, transparent);
	border-bottom: 1px solid color-mix(in srgb, var(--outline-variant) 40%, transparent);
}

.header-title-wrap {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.header-title {
	font-weight: 500;
	font-size: 0.8125rem;
	letter-spacing: 0.012em;
	line-height: 1.4;
	color: var(--on-surface);
}

.playlist-drawer__actions {
	display: flex;
	align-items: center;
	gap: 0.25rem;
	flex-shrink: 0;
}

.drawer-icon-btn {
	width: 28px;
	height: 28px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 9999px;
	border: none;
	background: transparent;
	color: var(--primary);
	font-size: 1.1rem;
	cursor: pointer;
	transition: background-color 140ms ease, color 140ms ease, transform 100ms ease;
}

.drawer-icon-btn:hover {
	background: color-mix(in srgb, var(--primary) 14%, transparent);
	color: var(--primary);
	transform: scale(1.08);
}

.drawer-icon-btn:disabled {
	opacity: 0.4;
	cursor: not-allowed;
}

/* MD3E Segmented Button (Фильтры плейлиста) */
.playlist-drawer__footer {
	padding: 0.55rem 0.65rem 0.65rem;
	background: color-mix(in srgb, var(--surface-container-high) 85%, transparent);
	border-top: 1px solid color-mix(in srgb, var(--outline-variant) 35%, transparent);
}

.m3-segmented-button-group {
	display: flex;
	align-items: stretch;
	width: 100%;
	height: 38px;
	border-radius: var(--shape-corner-full, 9999px);
	border: 1px solid var(--outline-variant);
	background: color-mix(in srgb, var(--surface) 60%, transparent);
	overflow: hidden;
	box-sizing: border-box;
}

.m3-segmented-item {
	flex: 1 1 0;
	min-width: 0;
	height: 100%;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.35rem;
	padding: 0 0.4rem;
	border: none;
	border-right: 1px solid var(--outline-variant);
	background: transparent;
	color: var(--on-surface-variant);
	font-size: 0.76rem;
	font-weight: 450;
	letter-spacing: 0.012em;
	line-height: 1.4;
	cursor: pointer;
	white-space: nowrap;
	user-select: none;
	transition: background-color var(--m3e-duration-short, 140ms) var(--m3e-easing-standard, ease),
	            color var(--m3e-duration-short, 140ms) var(--m3e-easing-standard, ease);
}

.m3-segmented-item:last-child {
	border-right: none;
}

.m3-segmented-item:hover:not(.selected) {
	background: color-mix(in srgb, var(--on-surface) 8%, transparent);
	color: var(--on-surface);
}

.m3-segmented-item.selected {
	background: var(--secondary-container);
	color: var(--on-secondary-container);
	font-weight: 600;
}

.m3-segmented-check-wrap {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 0;
	overflow: visible;
	transition: width 150ms cubic-bezier(0.2, 0, 0, 1);
}

.m3-segmented-item.selected .m3-segmented-check-wrap {
	width: 16px;
}

.m3-segmented-check {
	flex-shrink: 0;
	width: 15px;
	height: 15px;
	color: var(--on-secondary-container);
	animation: checkPopIn 150ms cubic-bezier(0.2, 0, 0, 1) forwards;
}

@keyframes checkPopIn {
	from {
		transform: scale(0.6);
		opacity: 0;
	}
	to {
		transform: scale(1);
		opacity: 1;
	}
}

.m3-segmented-label {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.m3-segmented-count {
	font-size: 0.68rem;
	font-weight: 500;
	opacity: 0.75;
	font-variant-numeric: tabular-nums;
	font-family: var(--font-mono, monospace);
}

.m3-segmented-item.selected .m3-segmented-count {
	opacity: 0.9;
	font-weight: 600;
}

/* Список треков (рассчитан ровно под 7 песен без вертикального скролла) */
.playlist-drawer__list {
	max-height: 325px;
	overflow-y: auto;
	padding: 0.35rem 0.5rem;
	scrollbar-width: thin;
	scrollbar-color: color-mix(in srgb, var(--on-surface-variant) 25%, transparent) transparent;
}

.playlist-drawer__list::-webkit-scrollbar {
	width: 5px;
}

.playlist-drawer__list::-webkit-scrollbar-track {
	background: transparent;
	margin: 6px 0;
}

.playlist-drawer__list::-webkit-scrollbar-thumb {
	background: color-mix(in srgb, var(--on-surface-variant) 25%, transparent);
	border-radius: 9999px;
	transition: background-color 150ms ease;
}

.playlist-drawer__list::-webkit-scrollbar-thumb:hover {
	background: var(--primary);
}

.playlist-item {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	width: 100%;
	padding: 0.55rem 0.75rem;
	border: none;
	border-radius: var(--shape-corner-s, 8px);
	background: transparent;
	color: var(--on-surface);
	text-align: left;
	cursor: pointer;
	transition: background-color 120ms ease;
	font-size: 0.8125rem;
	margin-bottom: 4px;
	user-select: none;
}

.playlist-item:hover {
	background: var(--surface-container-highest);
}

.playlist-item.is-active {
	background: color-mix(in srgb, var(--primary) 12%, transparent);
	color: var(--primary);
}

.item-leading {
	width: 22px;
	height: 22px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	position: relative;
}

.item-num {
	font-size: 0.72rem;
	color: var(--on-surface-variant);
	font-family: var(--font-mono, monospace);
	font-variant-numeric: tabular-nums;
}

.item-pause-icon {
	color: var(--primary);
	display: flex;
	align-items: center;
	justify-content: center;
}

.playlist-item.is-active .item-num {
	color: var(--primary);
	font-weight: 600;
}

.item-play-hover {
	display: none;
	font-size: 1.15rem;
	color: var(--primary);
}

.item-eq-bars {
	display: flex;
	align-items: flex-end;
	gap: 1.5px;
	height: 11px;
	width: 12px;
	justify-content: center;
}

.item-eq-bars .bar {
	width: 2px;
	background: var(--primary);
	border-radius: 1px;
	animation: itemBounce 800ms infinite ease-in-out alternate;
}

.item-eq-bars .bar-1 { height: 60%; animation-delay: 0ms; }
.item-eq-bars .bar-2 { height: 100%; animation-delay: 200ms; }
.item-eq-bars .bar-3 { height: 40%; animation-delay: 400ms; }

@keyframes itemBounce {
	0% { height: 25%; }
	100% { height: 100%; }
}

@media (prefers-reduced-motion: reduce) {
	.item-eq-bars .bar {
		animation: none;
	}
}

.playlist-item:hover .item-num,
.playlist-item:hover .item-pause-icon,
.playlist-item:hover .item-eq-bars {
	display: none;
}

.playlist-item:hover .item-play-hover {
	display: flex;
}

.item-info {
	display: flex;
	align-items: center;
	gap: 0.45rem;
	flex: 1;
	min-width: 0;
}

.item-title {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	font-size: 0.8125rem;
	font-weight: 450;
	letter-spacing: 0.012em;
	line-height: 1.4;
}

.playlist-item.is-active .item-title {
	font-weight: 600;
}

.badge-new-subtle {
	font-size: 0.65rem;
	font-weight: 600;
	color: var(--primary);
	background: color-mix(in srgb, var(--primary) 12%, transparent);
	padding: 0.5px 5px;
	border-radius: 9999px;
	line-height: 1.2;
	flex-shrink: 0;
	letter-spacing: 0.02em;
}

.item-duration {
	font-size: 0.72rem;
	font-family: var(--font-mono, monospace);
	font-variant-numeric: tabular-nums;
	color: var(--on-surface-variant);
	flex-shrink: 0;
	margin-right: 0.2rem;
}

.item-fav-btn {
	width: 28px;
	height: 28px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border: none;
	background: transparent;
	color: var(--primary);
	opacity: 0.65;
	cursor: pointer;
	border-radius: 9999px;
	flex-shrink: 0;
	transition: opacity 120ms ease, color 120ms ease, transform 120ms ease;
}

.playlist-item:hover .item-fav-btn,
.item-fav-btn.is-fav {
	opacity: 1;
}

.item-fav-btn.is-fav {
	color: var(--primary);
	filter: drop-shadow(0 0 5px color-mix(in srgb, var(--primary) 45%, transparent));
}

.item-fav-btn:hover {
	opacity: 1;
	transform: scale(1.15);
	color: var(--primary);
}

.playlist-empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 2rem 1rem;
	text-align: center;
	gap: 0.5rem;
}

.playlist-empty-state :global(.empty-icon) {
	font-size: 2rem;
	color: var(--on-surface-variant);
	opacity: 0.4;
}

.empty-text {
	font-size: 0.78rem;
	color: var(--on-surface-variant);
	max-width: 240px;
	line-height: 1.4;
	margin: 0;
}

.empty-reset-btn {
	border: 1px solid var(--outline-variant);
	background: color-mix(in srgb, var(--surface-container-highest) 50%, transparent);
	color: var(--primary);
	font-size: 0.72rem;
	font-weight: 600;
	padding: 0.3rem 0.75rem;
	border-radius: 9999px;
	cursor: pointer;
	margin-top: 0.25rem;
}

@media (max-width: 768px) {
	.playlist-drawer {
		bottom: calc(58px + 10px);
		right: 0.75rem;
		left: 0.75rem;
		width: auto;
	}
}
</style>
