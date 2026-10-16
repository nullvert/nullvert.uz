<script lang="ts">
/**
 * CatalogShell — чистый универсальный каркас страниц-каталогов:
 * - Слева: основной контент страницы (unboxed, без лишней рамки и лишней вложенности)
 * - Справа: sticky-сайдбар с параметрами/фильтрами на десктопе (>= 1024px)
 * - На мобильных (< 1024px): правая шторка RightSideDrawer + плавающая кнопка вызова
 * Никаких данных или специфичной логики внутри — чистая геометрия, позиционирование и поведение.
 */
import RightSideDrawer from "./RightSideDrawer.svelte";
import type { Snippet } from "svelte";

let {
	drawerTitle = "Параметры",
	hasActiveFilters = false,
	sidebar,
	mobileHeader,
	children,
}: {
	drawerTitle?: string;
	hasActiveFilters?: boolean;
	sidebar?: Snippet;
	mobileHeader?: Snippet;
	children?: Snippet;
} = $props();

let isDrawerOpen = $state(false);
</script>

<div class="catalog-shell">
	<!-- Мобильная плашка управления / быстрых действий (если передана) -->
	{#if mobileHeader}
		<div class="catalog-shell__mobile-header">
			<div class="catalog-shell__mobile-header-content">
				{@render mobileHeader()}
			</div>
			{#if sidebar}
				<button
					type="button"
					class="catalog-shell__trigger"
					class:catalog-shell__trigger--active={hasActiveFilters}
					onclick={() => (isDrawerOpen = true)}
					aria-label={drawerTitle}
					title={drawerTitle}
				>
					<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h16q.825 0 1.413.588T22 6v12q0 .825-.587 1.413T20 20zm12-2h4V6h-4zm-2 0V6H4v12z"/>
					</svg>
					{#if hasActiveFilters}
						<span class="catalog-shell__badge" aria-hidden="true"></span>
					{/if}
				</button>
			{/if}
		</div>
	{:else if sidebar}
		<!-- Если mobileHeader не передан, показываем плавающую/верхнюю мобильную кнопку вызова сайдбара -->
		<div class="catalog-shell__mobile-trigger-bar">
			<button
				type="button"
				class="catalog-shell__trigger-pill"
				class:catalog-shell__trigger-pill--active={hasActiveFilters}
				onclick={() => (isDrawerOpen = true)}
				aria-label={drawerTitle}
			>
				<svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h16q.825 0 1.413.588T22 6v12q0 .825-.587 1.413T20 20zm12-2h4V6h-4zm-2 0V6H4v12z"/>
				</svg>
				<span>{drawerTitle}</span>
				{#if hasActiveFilters}
					<span class="catalog-shell__badge" aria-hidden="true"></span>
				{/if}
			</button>
		</div>
	{/if}

	<div class="catalog-shell__layout" class:catalog-shell__layout--has-sidebar={Boolean(sidebar)}>
		<!-- Основной контент (unboxed) -->
		<div class="catalog-shell__content">
			{@render children?.()}
		</div>

		<!-- Десктопный sticky сайдбар справа -->
		{#if sidebar}
			<aside class="catalog-shell__sidebar" aria-label={drawerTitle}>
				<div class="catalog-shell__sidebar-inner">
					{@render sidebar()}
				</div>
			</aside>
		{/if}
	</div>
</div>

<!-- Мобильная шторка справа при разрешении < 1024px -->
{#if sidebar}
	<RightSideDrawer bind:open={isDrawerOpen} title={drawerTitle} ariaLabel={drawerTitle}>
		<div class="catalog-shell__drawer-inner">
			{@render sidebar()}
		</div>
	</RightSideDrawer>
{/if}

<style lang="stylus">
.catalog-shell
	width: 100%

	&__layout
		display: flex
		flex-direction: column
		gap: 1.5rem

		&--has-sidebar
			@media (min-width: 64rem) // 1024px (lg)
				display: grid
				grid-template-columns: minmax(0, 1fr) 19rem
				align-items: start
				gap: 1.75rem

	&__content
		min-width: 0
		padding: 0.25rem 0.25rem 1rem
		overflow: visible

	/* Десктопная правая колонка: чистый sticky-контейнер с полупрозрачной карточкой-фоном */
	&__sidebar
		display: none
		min-width: 0

		@media (min-width: 64rem)
			display: block
			position: sticky
			top: 5.5rem
			align-self: start

	&__sidebar-inner
		display: flex
		flex-direction: column
		gap: 1.125rem
		padding: 1.25rem
		box-sizing: border-box
		border-radius: var(--shape-corner-extra-large, 1.25rem)
		transition: background var(--m3e-duration-medium) var(--m3e-easing-standard), border-color var(--m3e-duration-medium) var(--m3e-easing-standard), box-shadow var(--m3e-duration-medium) var(--m3e-easing-standard)

	&__drawer-inner
		display: flex
		flex-direction: column
		gap: 1.25rem

	&__mobile-header
		display: flex
		align-items: center
		gap: 0.75rem
		margin-bottom: 1.25rem

		@media (min-width: 64rem)
			display: none

	&__mobile-header-content
		flex: 1
		min-width: 0

	&__mobile-trigger-bar
		display: flex
		justify-content: flex-end
		margin-bottom: 1rem

		@media (min-width: 64rem)
			display: none

	&__trigger
		position: relative
		display: inline-flex
		align-items: center
		justify-content: center
		width: 2.75rem
		height: 2.75rem
		flex-shrink: 0
		border: 1px solid var(--outline-variant)
		border-radius: var(--shape-corner-medium, 0.75rem)
		background: var(--surface-container-high)
		color: var(--on-surface)
		cursor: pointer
		-webkit-tap-highlight-color: transparent
		transition:
			background-color var(--m3e-duration-short) var(--m3e-easing-standard),
			border-color var(--m3e-duration-short) var(--m3e-easing-standard)

		&:hover
			background: var(--surface-container-highest)

		&--active
			background: unquote("color-mix(in oklab, var(--primary) 15%, var(--surface-container-highest))")
			border-color: var(--primary)
			color: var(--primary)

	&__trigger-pill
		position: relative
		display: inline-flex
		align-items: center
		gap: 0.5rem
		height: 2.5rem
		padding: 0 1rem
		border: 1px solid var(--outline-variant)
		border-radius: var(--shape-corner-medium, 0.75rem)
		background: var(--surface-container-high)
		color: var(--on-surface)
		font: var(--m3e-type-label-large)
		font-weight: 500
		cursor: pointer
		-webkit-tap-highlight-color: transparent
		transition:
			background-color var(--m3e-duration-short) var(--m3e-easing-standard),
			border-color var(--m3e-duration-short) var(--m3e-easing-standard)

		&:hover
			background: var(--surface-container-highest)

		&--active
			background: unquote("color-mix(in oklab, var(--primary) 15%, var(--surface-container-highest))")
			border-color: var(--primary)
			color: var(--primary)

	&__badge
		position: absolute
		top: 0.5rem
		right: 0.5rem
		width: 0.5rem
		height: 0.5rem
		border-radius: 50%
		background: var(--primary)
		box-shadow: 0 0 0 2px var(--surface-container-high)
</style>
