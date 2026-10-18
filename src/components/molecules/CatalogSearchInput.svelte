<script lang="ts">
/**
 * CatalogSearchInput — универсальное капсульное поле поиска каталогов (Медиа, Компас).
 * Реализовано на Svelte 5 (Runes), полностью адаптивно с очисткой по клику на крестик.
 */
import TextField from "@components/atoms/input/TextField.svelte";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";

let {
	value = $bindable(""),
	placeholder = "Поиск...",
	id = "catalog-search-input",
}: {
	value?: string;
	placeholder?: string;
	id?: string;
} = $props();
</script>

<div
	class="catalog-search"
	onclick={(e) => {
		if ((e.target as HTMLElement)?.closest('.catalog-search__clear')) return;
		const input = (e.currentTarget as HTMLElement).querySelector('input');
		input?.focus();
	}}
>
	<TextField
		{id}
		type="text"
		bind:value
		{placeholder}
		hideLabel
		variant="outlined"
	>
		<svg slot="leading" class="w-5 h-5 text-[var(--on-surface-variant)]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M9.5 3a6.5 6.5 0 0 1 5.25 10.33l4.96 4.96a1 1 0 0 1-1.42 1.42l-4.96-4.96A6.5 6.5 0 1 1 9.5 3m0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9"/>
		</svg>
	</TextField>
	{#if value}
		<button
			type="button"
			class="catalog-search__clear"
			aria-label={i18n(I18nKey.clear)}
			onclick={() => (value = "")}
		>
			<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="m12 13.4-4.9 4.9q-.275.275-.7.275t-.7-.275q-.275-.275-.275-.7t.275-.7l4.9-4.9-4.9-4.9q-.275-.275-.275-.7t.275-.7q.275-.275.7-.275t.7.275l4.9 4.9 4.9-4.9q.275-.275.7-.275t.7.275q.275.275.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7q-.275.275-.7.275t-.7-.275z"/>
			</svg>
		</button>
	{/if}
</div>

<style lang="stylus">
.catalog-search
	position: relative
	width: 100%

	:global(.m3-text-field)
		width: 100%
		height: 2.75rem !important
		border-radius: var(--shape-corner-medium, 0.75rem) !important
		background: var(--surface-container, rgba(125, 125, 125, 0.08)) !important
		border: none !important
		box-shadow: none !important
		transition: background-color var(--m3e-duration-short) ease
		padding-left: 0.875rem !important
		padding-right: 0.875rem !important
		gap: 0.5rem !important

	:global(.m3-text-field:hover)
		background: var(--surface-container-high, rgba(125, 125, 125, 0.12)) !important

	:global(.m3-text-field:focus-within)
		background: var(--surface-container-highest, rgba(125, 125, 125, 0.16)) !important

	:global(.m3-text-field input)
		outline: none !important
		box-shadow: none !important
		border: none !important
		font-size: 0.875rem !important
		color: var(--on-surface) !important
		padding: 0 !important
		padding-right: 0.5rem !important
		-webkit-tap-highlight-color: transparent

	:global(.m3-text-field input::placeholder)
		color: var(--on-surface-variant) !important

	&__clear
		position: absolute
		right: 0.75rem
		top: 50%
		transform: translateY(-50%)
		display: inline-flex
		align-items: center
		justify-content: center
		width: 1.75rem
		height: 1.75rem
		border: none
		border-radius: var(--shape-corner-full, 9999px)
		background: transparent
		color: var(--on-surface-variant)
		cursor: pointer
		-webkit-tap-highlight-color: transparent
		transition: background-color var(--m3e-duration-short) ease, color var(--m3e-duration-short) ease
		z-index: 2

		> :global(svg)
			width: 1.125rem
			height: 1.125rem

		&:hover
			background: var(--surface-container-highest, rgba(125, 125, 125, 0.15))
			color: var(--on-surface)
</style>
