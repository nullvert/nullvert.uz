<script lang="ts">
import type { MediaItemData } from "@/types/media";

let {
	item,
	progressPercent = 0,
}: {
	item: MediaItemData;
	progressPercent?: number;
} = $props();
</script>

<div class="media-card__overlay">
	<h3 class="media-card__overlay-title" title={item.title}>
		{item.title}
	</h3>

	{#if item.authorOrStudio || item.year || item.subMeta}
		<div class="media-card__overlay-meta">
			{#if item.authorOrStudio}
				<span class="media-card__overlay-author" title={item.authorOrStudio}>
					{item.authorOrStudio}
				</span>
			{/if}
			{#if item.authorOrStudio && (item.year || item.subMeta)}
				<span class="media-card__overlay-dot" aria-hidden="true">·</span>
			{/if}
			{#if item.year}
				<span class="media-card__overlay-year">{item.year}</span>
			{/if}
			{#if item.year && item.subMeta}
				<span class="media-card__overlay-dot" aria-hidden="true">·</span>
			{/if}
			{#if item.subMeta}
				<span class="media-card__overlay-sub">{item.subMeta}</span>
			{/if}
		</div>
	{/if}

	<div class="media-card__overlay-details">
		<div class="media-card__overlay-details-inner">
			{#if item.description}
				<p class="media-card__overlay-desc">{item.description}</p>
			{/if}

			{#if item.progress}
				<div class="media-card__overlay-progress">
					<div class="media-card__progress-info">
						<span>Прогресс</span>
						<span>{item.progress.watched} / {item.progress.total} {item.progress.unit ?? ""}</span>
					</div>
					<div class="media-card__progress-track">
						<div class="media-card__progress-fill" style={`width: ${progressPercent}%;`}></div>
					</div>
				</div>
			{/if}

			{#if item.genres && item.genres.length > 0}
				<div class="media-card__overlay-genres">
					{#each item.genres.slice(0, 4) as genre (genre)}
						<span class="media-card__genre-tag">
							{genre}
						</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<style lang="stylus">
.media-card__overlay
	position: absolute
	inset: 0
	z-index: 3
	display: flex
	flex-direction: column
	justify-content: flex-end
	padding: 0.875rem
	border-radius: inherit
	background: linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.82) 32%, rgba(0, 0, 0, 0.98) 100%)
	opacity: 0
	pointer-events: none
	-webkit-font-smoothing: antialiased
	-moz-osx-font-smoothing: grayscale
	text-rendering: optimizeLegibility
	transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1)

	:global(.media-card:hover) &
		opacity: 1
		pointer-events: auto

	:global(.media-card--title-on-poster) &
		opacity: 1
		pointer-events: auto
		background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.45) 40%, rgba(0, 0, 0, 0.88) 100%)

	:global(.media-card--title-on-poster:hover) &
		background: linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.82) 32%, rgba(0, 0, 0, 0.96) 100%)

.media-card__overlay-title
	margin: 0 0 0.3125rem
	color: #ffffff
	font: var(--m3e-type-title-small)
	font-size: 0.9375rem
	font-weight: 700
	line-height: 1.3
	letter-spacing: -0.01em
	display: -webkit-box
	-webkit-line-clamp: 2
	-webkit-box-orient: vertical
	overflow: hidden
	text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8)

.media-card__overlay-meta
	display: flex
	align-items: center
	flex-wrap: nowrap
	gap: 0.375rem
	margin-bottom: 0.4375rem
	font: var(--m3e-type-label-small)
	font-size: 0.75rem
	font-weight: 600
	color: rgba(255, 255, 255, 0.88)
	white-space: nowrap
	overflow: hidden
	text-overflow: ellipsis

.media-card__overlay-author
	color: rgba(255, 255, 255, 0.95)
	white-space: nowrap
	overflow: hidden
	text-overflow: ellipsis
	letter-spacing: -0.01em

.media-card__overlay-year
	color: var(--primary)
	font-variant-numeric: tabular-nums
	flex-shrink: 0

.media-card__overlay-sub
	color: rgba(255, 255, 255, 0.85)
	white-space: nowrap
	overflow: hidden
	text-overflow: ellipsis

.media-card__overlay-dot
	color: rgba(255, 255, 255, 0.4)
	user-select: none
	flex-shrink: 0

.media-card__overlay-details
	display: grid
	grid-template-rows: 0fr
	opacity: 0
	pointer-events: none
	transition: grid-template-rows 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease

	:global(.media-card:hover) &
		grid-template-rows: 1fr
		opacity: 1
		pointer-events: auto

.media-card__overlay-details-inner
	min-height: 0
	overflow: hidden
	opacity: 0
	transition: opacity 0.3s ease

	:global(.media-card:hover) &
		opacity: 1

.media-card__overlay-desc
	margin: 0 0 0.625rem
	color: #ffffff
	font: var(--m3e-type-body-small)
	font-size: 0.78125rem
	line-height: 1.45
	letter-spacing: 0.01em
	display: -webkit-box
	-webkit-line-clamp: 4
	-webkit-box-orient: vertical
	overflow: hidden
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7)

.media-card__overlay-progress
	margin-bottom: 0.5rem

.media-card__progress-info
	display: flex
	justify-content: space-between
	align-items: center
	margin-bottom: 0.25rem
	color: rgba(255, 255, 255, 0.85)
	font: var(--m3e-type-label-small)
	font-size: 0.6875rem
	font-weight: 600

.media-card__progress-track
	width: 100%
	height: 4px
	border-radius: var(--shape-corner-full)
	background: rgba(255, 255, 255, 0.2)
	overflow: hidden

.media-card__progress-fill
	height: 100%
	border-radius: var(--shape-corner-full)
	background: var(--primary)
	transition: width var(--m3e-duration-medium) var(--m3e-easing-standard)

.media-card__overlay-genres
	display: flex
	flex-wrap: wrap
	gap: 0.3125rem

.media-card__genre-tag
	display: inline-flex
	align-items: center
	justify-content: center
	text-align: center
	height: 1.375rem
	box-sizing: border-box
	line-height: 1
	padding: 0 0.5rem
	border-radius: var(--shape-corner-xs, 4px)
	background: rgba(255, 255, 255, 0.16)
	backdrop-filter: blur(6px)
	-webkit-backdrop-filter: blur(6px)
	border: 1px solid rgba(255, 255, 255, 0.08)
	color: rgba(255, 255, 255, 0.95)
	font: var(--m3e-type-label-small)
	font-size: 0.6875rem
	font-weight: 500
	white-space: nowrap
	overflow: hidden
	text-overflow: ellipsis
	max-width: 100%
</style>
