<script lang="ts">
import type { Snippet } from "svelte";

let {
	ariaLabel = "Список медиа",
	forceHover = false,
	showBorder = true,
	columns = 4,
	children,
}: {
	ariaLabel?: string;
	forceHover?: boolean;
	showBorder?: boolean;
	columns?: number;
	children?: Snippet;
} = $props();
</script>

<div
	class="media-card-grid media-card-grid--cols-{columns}"
	class:media-card-grid--force-hover={forceHover}
	class:media-card-grid--hide-border={!showBorder}
	role="list"
	aria-label={ariaLabel}
>
	{@render children?.()}
</div>

<style lang="stylus">
.media-card-grid
	display: grid
	/* По умолчанию 4 колонки, либо 3 если передано columns=3 */
	grid-template-columns: repeat(4, minmax(0, 1fr))
	gap: 1.5rem
	padding: 4px
	box-sizing: border-box

	&--cols-3
		grid-template-columns: repeat(3, minmax(0, 1fr))
		gap: 1rem

	&--cols-2
		grid-template-columns: repeat(2, minmax(0, 1fr))
		gap: 1.25rem

	@media (max-width: 68rem) // < 1088px
		grid-template-columns: repeat(3, minmax(0, 1fr))
		gap: 0.875rem

		&.media-card-grid--cols-2
			grid-template-columns: repeat(2, minmax(0, 1fr))

	@media (max-width: 52rem) // Tablet (< 832px)
		&.media-card-grid--cols-3
			grid-template-columns: repeat(2, minmax(0, 1fr))
			gap: 0.875rem

	@media (max-width: 36rem) // Mobile (< 576px)
		grid-template-columns: repeat(2, minmax(0, 1fr))
		gap: 0.75rem

		&.media-card-grid--cols-3
			grid-template-columns: 1fr
			gap: 0.75rem

		&.media-card-grid--cols-2
			grid-template-columns: 1fr
			gap: 0.875rem

	& > [role="listitem"]
		content-visibility: auto
		contain-intrinsic-size: auto 320px

	/* ── Testing: Скрытие анимированной рамки ── */
	&--hide-border
		:global(.media-card__fancy-border),
		:global(.media-card__gradient-border),
		:global(.media-card__gold-aura)
			display: none !important

	/* ── Testing: Принудительное состояние Hover ── */
	&--force-hover
		:global(.media-card__fancy-border)
			--_i: 100% !important
			opacity: 1 !important

		:global(.media-card__gradient-border)
			opacity: 1 !important

		:global(.media-card__foil-shine)
			opacity: 0.9 !important

		:global(.media-card__gold-aura)
			opacity: 1 !important

		:global(.media-card__overlay)
			opacity: 1 !important
			pointer-events: auto !important

		:global(.media-card__overlay-title),
		:global(.media-card__overlay-meta),
		:global(.media-card__overlay-details-inner)
			transform: translate3d(0, 0, 0) !important
			opacity: 1 !important

		:global(.media-card--title-on-poster .media-card__overlay)
			background: linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.82) 32%, rgba(0, 0, 0, 0.96) 100%) !important

		:global(.media-card--title-on-poster .media-card__overlay-details)
			grid-template-rows: 1fr !important
			opacity: 1 !important
			pointer-events: auto !important

		:global(.media-card__top-status),
		:global(.media-card__top-rating)
			background: unquote("color-mix(in oklab, var(--electric-color, var(--primary)) 28%, rgba(15, 23, 42, 0.88)) !important")

		:global(.media-card__top-status-icon),
		:global(.media-card__top-rating-val)
			color: #ffffff !important
</style>
