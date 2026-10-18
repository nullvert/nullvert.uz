<script lang="ts">
/**
 * CatalogFilterItem — универсальный пункт бокового меню фильтрации:
 * - Круглая капсульная форма (border-radius: 9999px)
 * - Опциональная иконка (Iconify или SVG через snippet)
 * - Название с автоматическим обрезанием (ellipsis)
 * - Капсульный счетчик количества (badge)
 * - Опциональная стрелка сортировки (asc / desc)
 */
import Icon from "@iconify/svelte";
import type { Snippet } from "svelte";

let {
	title,
	active = false,
	count,
	icon,
	iconSnippet,
	actionSnippet,
	showDirection = false,
	sortOrder = "desc",
	class: className = "",
	onclick,
}: {
	title: string;
	active?: boolean;
	count?: number | string;
	icon?: string;
	iconSnippet?: Snippet;
	actionSnippet?: Snippet;
	showDirection?: boolean;
	sortOrder?: "asc" | "desc";
	class?: string;
	onclick?: () => void;
} = $props();
</script>

<button
	type="button"
	class="catalog-filter-item {className}"
	class:catalog-filter-item--active={active}
	{onclick}
>
	{#if iconSnippet || icon}
		<span class="catalog-filter-item__icon">
			{#if iconSnippet}
				{@render iconSnippet()}
			{:else}
				<Icon {icon} aria-hidden="true" />
			{/if}
		</span>
	{/if}

	<span class="catalog-filter-item__title">{title}</span>

	{#if count !== undefined}
		<span class="catalog-filter-item__badge">{count}</span>
	{/if}

	{#if actionSnippet}
		<span class="catalog-filter-item__custom-action" onclick={(e) => e.stopPropagation()}>
			{@render actionSnippet()}
		</span>
	{/if}

	{#if showDirection && active}
		<span class="catalog-filter-item__action" class:catalog-filter-item__action--asc={sortOrder === "asc"}>
			<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M12 20q-.425 0-.712-.288t-.288-.712V5.425l-4.9 4.9q-.275.275-.7.275t-.7-.275q-.275-.275-.275-.7t.275-.7l6.6-6.6q.3-.3.7-.3t.7.3l6.6 6.6q.275.275.275.7t-.275.7q-.275.275-.7.275t-.7-.275l-4.9-4.9V19q0 .425-.288.713T12 20"/>
			</svg>
		</span>
	{/if}
</button>

<style lang="stylus">
.catalog-filter-item
	display: flex
	align-items: center
	gap: 0.75rem
	width: 100%
	height: 2.625rem
	padding: 0 0.875rem
	border: 1px solid transparent
	border-radius: var(--shape-corner-medium, 0.75rem)
	background: transparent
	color: var(--on-surface-variant)
	font: var(--m3e-type-body-small)
	font-size: 0.875rem
	font-weight: 500
	cursor: pointer
	text-align: left
	user-select: none
	box-sizing: border-box
	transition:
		background-color var(--m3e-duration-short) var(--m3e-easing-standard),
		border-color var(--m3e-duration-short) var(--m3e-easing-standard),
		color var(--m3e-duration-short) var(--m3e-easing-standard),
		box-shadow var(--m3e-duration-short) var(--m3e-easing-standard),
		transform var(--m3e-duration-short) var(--m3e-easing-standard)

	&:hover:not(&--active)
		background: var(--surface-container-high, rgba(125, 125, 125, 0.08))
		color: var(--on-surface)

		.catalog-filter-item__icon
			transform: translateX(2px)
			color: var(--primary)

	&--active
		background: unquote("color-mix(in srgb, var(--primary) 14%, transparent)")
		border-color: transparent
		color: var(--primary)
		font-weight: 600

		.catalog-filter-item__icon
			color: var(--primary)
			transform: scale(1.05)

		.catalog-filter-item__badge
			color: var(--primary)
			font-weight: 600

		.catalog-filter-item__action
			color: var(--primary)

	&__icon
		display: inline-flex
		align-items: center
		justify-content: center
		width: 1.25rem
		height: 1.25rem
		flex-shrink: 0
		color: var(--on-surface-variant)
		transition: transform var(--m3e-duration-short) var(--m3e-easing-standard), color var(--m3e-duration-short) var(--m3e-easing-standard)

		> :global(svg)
			width: 1.2rem
			height: 1.2rem

	&__dot
		width: 0.5rem
		height: 0.5rem
		border-radius: 50%
		background: currentColor

	&__title
		flex: 1
		min-width: 0
		white-space: nowrap
		overflow: hidden
		text-overflow: ellipsis

	&__badge
		display: inline-flex
		align-items: center
		justify-content: flex-end
		min-width: 1.5rem
		color: var(--on-surface-variant)
		font: var(--m3e-type-label-small)
		font-size: 0.8125rem
		font-weight: 500
		font-variant-numeric: tabular-nums

	&__action
		display: inline-flex
		align-items: center
		justify-content: center
		width: 1.25rem
		height: 1.25rem
		flex-shrink: 0
		color: var(--on-surface-variant)
		transition: transform var(--m3e-duration-short) var(--m3e-easing-standard)

		> :global(svg)
			width: 1.125rem
			height: 1.125rem

		&--asc
			transform: rotate(180deg)

	&__custom-action
		display: inline-flex
		align-items: center
		justify-content: center
		flex-shrink: 0
</style>
