<script lang="ts">
/**
 * CatalogSegmented — сегментированный переключатель опций (MD3E Segmented Button Group).
 * Без галочек, с акцентом цвета и четким разделителем, не обрезает текст.
 */
import Icon from "@iconify/svelte";

export interface SegmentedOption {
	value: string;
	label: string;
	icon?: string;
	count?: number | string;
}

let {
	options = [],
	value = $bindable(""),
	onchange,
}: {
	options: SegmentedOption[];
	value?: string;
	onchange?: (val: string) => void;
} = $props();

const handleSelect = (val: string) => {
	value = val;
	onchange?.(val);
};
</script>

<div class="catalog-segmented" role="tablist">
	{#each options as opt}
		{@const isSelected = value === opt.value}
		<button
			type="button"
			role="tab"
			aria-selected={isSelected}
			class="catalog-segmented__item"
			class:catalog-segmented__item--active={isSelected}
			onclick={() => handleSelect(opt.value)}
		>
			{#if opt.icon}
				<Icon icon={opt.icon} class="catalog-segmented__icon" aria-hidden="true" />
			{/if}

			<span class="catalog-segmented__label">{opt.label}</span>

			{#if opt.count !== undefined}
				<span class="catalog-segmented__count">{opt.count}</span>
			{/if}
		</button>
	{/each}
</div>

<style lang="stylus">
.catalog-segmented
	display: flex
	align-items: stretch
	width: 100%
	height: 2.375rem
	border-radius: var(--shape-corner-medium, 0.75rem)
	border: 1px solid var(--outline-variant)
	background: unquote("color-mix(in srgb, var(--surface) 60%, transparent)")
	overflow: hidden
	box-sizing: border-box

	&__item
		flex: 1 1 0
		min-width: 0
		height: 100%
		display: inline-flex
		align-items: center
		justify-content: center
		gap: 0.35rem
		padding: 0 0.5rem
		border: none
		border-right: 1px solid var(--outline-variant)
		background: transparent
		color: var(--on-surface-variant)
		font: var(--m3e-type-label-medium)
		font-size: 0.8125rem
		font-weight: 500
		letter-spacing: 0.01em
		cursor: pointer
		white-space: nowrap
		user-select: none
		-webkit-tap-highlight-color: transparent
		transition:
			background-color var(--m3e-duration-short) var(--m3e-easing-standard),
			color var(--m3e-duration-short) var(--m3e-easing-standard)

		&:last-child
			border-right: none

		&:hover:not(&--active)
			background: unquote("color-mix(in srgb, var(--on-surface) 8%, transparent)")
			color: var(--on-surface)

		&--active
			background: var(--secondary-container)
			color: var(--on-secondary-container)
			font-weight: 600

	:global(&__icon)
		width: 1rem
		height: 1rem
		flex-shrink: 0

	&__label
		overflow: hidden
		text-overflow: ellipsis
		white-space: nowrap

	&__count
		font-size: 0.6875rem
		font-weight: 500
		opacity: 0.75
		font-variant-numeric: tabular-nums
		font-family: var(--font-mono, monospace)

	&__item--active &__count
		opacity: 0.9
		font-weight: 600
</style>
