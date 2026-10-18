<script lang="ts">
import Icon from "@iconify/svelte";

let {
	topAction,
	statusLabel,
	status,
	statusIcon,
	topBadge,
	topDiscount,
	rating,
}: {
	topAction?: string | number;
	statusLabel?: string;
	status?: string;
	statusIcon?: string;
	topBadge?: string;
	topDiscount?: string;
	rating?: number;
} = $props();
</script>

<!-- Бейдж статуса или ранга (слева вверху) -->
{#if topAction}
	<span
		class="media-card__top-status media-card__top-status--text"
		title={`Позиция в списке: ${topAction}`}
		aria-label={`Позиция в списке: ${topAction}`}
	>
		<span class="media-card__top-rank-val">{topAction}</span>
	</span>
{:else if statusLabel}
	<span
		class="media-card__top-status"
		title={statusLabel}
		aria-label={statusLabel}
	>
		{#if status === "planned" || statusIcon === "material-symbols:bookmark-rounded"}
			<svg class="media-card__top-status-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
			</svg>
		{:else if statusIcon}
			<Icon icon={statusIcon} class="media-card__top-status-icon" aria-hidden="true" />
		{:else}
			<span class="media-card__status-dot" aria-hidden="true"></span>
		{/if}
	</span>
{/if}

<!-- Бейдж цены или оценки (справа вверху) -->
{#if topBadge}
	<div
		class="media-card__top-price-badge"
		class:media-card__top-price-badge--discounted={Boolean(topDiscount)}
		title={topDiscount ? `Скидка ${topDiscount}: ${topBadge}` : `Цена: ${topBadge}`}
	>
		{#if topDiscount}
			<span class="media-card__steam-discount">{topDiscount}</span>
		{/if}
		<span class="media-card__steam-price" class:media-card__steam-price--discounted={Boolean(topDiscount)}>
			{topBadge}
		</span>
	</div>
{:else if rating !== undefined && rating > 0}
	<span class="media-card__top-rating" title={`Оценка: ${rating}`}>
		<span class="media-card__top-rating-val">{rating}</span>
	</span>
{/if}

<style lang="stylus">
.media-card__top-status
	position: absolute
	top: 0
	left: 0
	z-index: 6
	display: inline-flex
	align-items: center
	justify-content: center
	width: var(--badge-size, 1.875rem)
	height: var(--badge-size, 1.875rem)
	box-sizing: border-box
	border-radius: unquote("0 0 calc(var(--badge-size, 1.875rem) * 0.33) 0")
	background: rgba(15, 23, 42, 0.72)
	backdrop-filter: blur(12px)
	-webkit-backdrop-filter: blur(12px)
	border: none
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3)
	transition: background var(--m3e-duration-medium) var(--m3e-easing-standard), transform var(--m3e-duration-short) var(--m3e-easing-standard)

	:global(.media-card:hover) &
		background: unquote("color-mix(in oklab, var(--electric-color, var(--media-status-color, var(--primary))) 32%, rgba(15, 23, 42, 0.9))")

	:global(.media-card__top-status-icon)
		width: unquote("calc(var(--badge-size, 1.875rem) * 0.57)")
		height: unquote("calc(var(--badge-size, 1.875rem) * 0.57)")
		color: rgba(255, 255, 255, 0.88)
		flex-shrink: 0

	:global(.media-card:hover) & :global(.media-card__top-status-icon)
		color: #ffffff

.media-card__status-dot
	width: 0.5rem
	height: 0.5rem
	border-radius: 50%
	background: rgba(255, 255, 255, 0.88)
	transition: background var(--m3e-duration-medium) var(--m3e-easing-standard)

	:global(.media-card:hover) &
		background: #ffffff

.media-card__top-status--text
	padding: unquote("0 calc(var(--badge-size, 1.875rem) * 0.25)")
	width: auto
	min-width: var(--badge-size, 1.875rem)

.media-card__top-rank-val
	font-family: ui-monospace, "SF Pro Rounded", "JetBrains Mono Variable", "SFMono-Regular", Menlo, Monaco, Consolas, "Segoe UI", sans-serif
	font-size: unquote("calc(var(--badge-size, 1.875rem) * 0.42)")
	font-weight: 800
	line-height: 1
	color: #ffffff
	font-variant-numeric: tabular-nums

.media-card__top-price-badge
	position: absolute
	top: 0
	right: 0
	z-index: 6
	display: inline-flex
	align-items: stretch
	height: var(--badge-size, 1.875rem)
	box-sizing: border-box
	border-radius: unquote("0 0 0 calc(var(--badge-size, 1.875rem) * 0.33)")
	overflow: hidden
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35)
	background: #101822

	&--discounted
		background: linear-gradient(90deg, #3d581a 0%, #344c16 48%, #1f2b1d 68%, #0f1822 100%)
		backdrop-filter: blur(8px)
		-webkit-backdrop-filter: blur(8px)

.media-card__steam-discount
	display: inline-flex
	align-items: center
	justify-content: center
	padding: 0 0.45rem
	background: transparent
	color: #bbf812
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6)
	font-family: "Motiva Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
	font-size: 0.75rem
	font-weight: 700
	line-height: var(--badge-size, 1.875rem)
	user-select: none

.media-card__steam-price
	display: inline-flex
	align-items: center
	justify-content: center
	padding: 0 0.5rem
	background: rgba(15, 23, 42, 0.78)
	backdrop-filter: blur(12px)
	-webkit-backdrop-filter: blur(12px)
	color: #ffffff
	font-family: "Motiva Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
	font-size: 0.75rem
	font-weight: 600
	line-height: var(--badge-size, 1.875rem)

	&--discounted
		background: transparent
		backdrop-filter: none
		-webkit-backdrop-filter: none
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7)
		font-weight: 700

.media-card__top-rating
	position: absolute
	top: 0
	right: 0
	z-index: 6
	display: inline-flex
	align-items: center
	justify-content: center
	min-width: var(--badge-size, 1.875rem)
	height: var(--badge-size, 1.875rem)
	padding: unquote("0 calc(var(--badge-size, 1.875rem) * 0.23)")
	box-sizing: border-box
	border-radius: unquote("0 0 0 calc(var(--badge-size, 1.875rem) * 0.33)")
	background: rgba(15, 23, 42, 0.72)
	backdrop-filter: blur(12px)
	-webkit-backdrop-filter: blur(12px)
	border: none
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3)
	transition: background var(--m3e-duration-medium) var(--m3e-easing-standard), transform var(--m3e-duration-short) var(--m3e-easing-standard)

	:global(.media-card:hover) &
		background: unquote("color-mix(in oklab, var(--electric-color, var(--primary)) 34%, rgba(15, 23, 42, 0.9))")

.media-card__top-rating-val
	font-family: ui-monospace, "SF Pro Rounded", "JetBrains Mono Variable", "SFMono-Regular", Menlo, Monaco, Consolas, "Segoe UI", sans-serif
	font-size: unquote("calc(var(--badge-size, 1.875rem) * 0.43)")
	font-weight: 800
	line-height: 1
	letter-spacing: -0.01em
	font-variant-numeric: tabular-nums lining-nums
	color: rgba(255, 255, 255, 0.95)
	transition: color var(--m3e-duration-medium) var(--m3e-easing-standard)

	:global(.media-card:hover) &
		color: #ffffff
</style>
