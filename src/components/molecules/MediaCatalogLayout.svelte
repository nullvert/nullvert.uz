<script lang="ts">
/**
 * MediaCatalogLayout — адаптивный каталожный слой для аниме, кино и игр,
 * построенный на базе универсального CatalogShell.
 * 
 * Вся геометрия и адаптивность (сайдбар справа / шторка на мобилке)
 * делегированы в CatalogShell. Здесь остаются только специфичные контролы
 * (поиск, фильтры статусов, переключатель источников, сортировка).
 */
import Card from "@components/atoms/display/Card.svelte";
import CatalogSearchInput from "./CatalogSearchInput.svelte";
import CatalogFilterItem from "./CatalogFilterItem.svelte";
import CatalogSegmented from "./CatalogSegmented.svelte";
import CatalogShell from "./CatalogShell.svelte";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import type { Snippet } from "svelte";
import { MEDIA_LABEL, mediaLabel } from "../../utils/media/labels";

export interface SourceOption {
	value: string;
	label: string;
	icon?: string;
}

export interface StatusFilterItem {
	value: string;
	label: string;
	icon?: string;
	count?: number;
	color?: string;
}

export interface SortOption {
	value: string;
	label: string;
	icon?: string;
	toggleDirection?: boolean;
}

let {
	sources = [] as SourceOption[],
	currentSource = $bindable(""),
	query = $bindable(""),
	statusItems = [] as StatusFilterItem[],
	selectedStatus = $bindable(""),
	sortOptions = [] as SortOption[],
	currentSort = $bindable(""),
	sortOrder = $bindable<"asc" | "desc">("desc"),
	listMode = $bindable<"grid" | "list">("grid"),
	totalAllCount = 0,
	totalFilteredCount = 0,
	countLabel = "",
	searchPlaceholder = mediaLabel(MEDIA_LABEL.searchPlaceholder, "Поиск..."),
	sourceLabel = mediaLabel(MEDIA_LABEL.source, "Источник"),
	onStatusChange = () => {},
	onSourceChange = () => {},
	onSortChange = () => {},
	onSortOrderChange = () => {},
	onLayoutChange = () => {},
	extraSidebar,
	extraStatusBottom,
	extraTopContent,
	children,
}: {
	sources?: SourceOption[];
	currentSource?: string;
	sourceLabel?: string;
	searchPlaceholder?: string;
	query?: string;
	statusItems?: StatusFilterItem[];
	selectedStatus?: string;
	sortOptions?: SortOption[];
	currentSort?: string;
	sortOrder?: "asc" | "desc";
	listMode?: "grid" | "list";
	totalAllCount?: number;
	totalFilteredCount?: number;
	countLabel?: string;
	onStatusChange?: (status: string) => void;
	onSourceChange?: (source: string) => void;
	onSortChange?: (sort: string) => void;
	onSortOrderChange?: (order: "asc" | "desc") => void;
	onLayoutChange?: (mode: "grid" | "list") => void;
	extraSidebar?: Snippet;
	extraStatusBottom?: Snippet;
	extraTopContent?: Snippet;
	children?: Snippet;
} = $props();

function handleSortClick(item: SortOption) {
	if (item.toggleDirection && currentSort === item.value) {
		const nextOrder = sortOrder === "desc" ? "asc" : "desc";
		sortOrder = nextOrder;
		onSortOrderChange(nextOrder);
	} else {
		currentSort = item.value;
		onSortChange(item.value);
	}
}
</script>

<CatalogShell
	drawerTitle="Параметры"
	hasActiveFilters={Boolean(selectedStatus || (currentSource && currentSource !== "all"))}
>
	<!-- Мобильная полоса быстрого поиска и скролла чипсов -->
	{#snippet mobileHeader()}
		<div class="media-controls__mobile-search">
			<CatalogSearchInput
				id="media-mobile-search-input"
				bind:value={query}
				placeholder={searchPlaceholder || i18n(I18nKey.search)}
			/>
		</div>
	{/snippet}

	<!-- Боковая панель фильтрации (вставляется в sticky-сайдбар и мобильную шторку) -->
	{#snippet sidebar()}
		<!-- Поле поиска для десктопа -->
		<CatalogSearchInput
			id="catalog-search-input"
			bind:value={query}
			placeholder={searchPlaceholder}
		/>

		<!-- Дополнительные виджеты страницы (например, Цели чтения в Книгах) -->
		{#if extraSidebar}
			{@render extraSidebar()}
		{/if}

		<!-- Источник данных (Shikimori / AniList / Тип) -->
		{#if sources.length > 1}
			<div class="media-controls__section">
				<span class="media-controls__label">{sourceLabel}</span>
				<CatalogSegmented
					options={sources}
					bind:value={currentSource}
					onchange={onSourceChange}
				/>
			</div>
		{/if}

		<!-- Фильтр по статусам -->
		<div class="media-controls__section">
			<span class="media-controls__label">Статус</span>

			<div class="media-controls__list-group">
				<CatalogFilterItem
					title="Все"
					count={totalAllCount}
					active={!selectedStatus}
					icon="material-symbols:apps-rounded"
					onclick={() => onStatusChange("")}
				/>

				{#each statusItems as item}
					{#if item.value === "planned" || item.icon === "material-symbols:bookmark-rounded"}
						<CatalogFilterItem
							title={item.label}
							count={item.count}
							active={selectedStatus === item.value}
							onclick={() => onStatusChange(item.value)}
						>
							{#snippet iconSnippet()}
								<svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
									<path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
								</svg>
							{/snippet}
						</CatalogFilterItem>
					{:else}
						<CatalogFilterItem
							title={item.label}
							count={item.count}
							active={selectedStatus === item.value}
							icon={item.icon}
							onclick={() => onStatusChange(item.value)}
						/>
					{/if}
				{/each}

				{#if extraStatusBottom}
					{@render extraStatusBottom()}
				{/if}
			</div>
		</div>

		<!-- Сортировка -->
		{#if sortOptions.length > 0}
			<div class="media-controls__section">
				<span class="media-controls__label">{mediaLabel(MEDIA_LABEL.sort, "Сортировка")}</span>
				<div class="media-controls__list-group">
					{#each sortOptions as sortItem}
						{#if sortItem.value === "default"}
							<CatalogFilterItem
								title={sortItem.label}
								active={currentSort === sortItem.value}
								showDirection={Boolean(sortItem.toggleDirection)}
								{sortOrder}
								onclick={() => handleSortClick(sortItem)}
							>
								{#snippet iconSnippet()}
									<svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
										<path d="M3 13.5v-1h3v1zm0-4v-1h3v1zm0-4v-1h3v1zm4 9v-2h14v2zm0-4v-2h14v2zm0-4V4.5h14v2z"/>
									</svg>
								{/snippet}
							</CatalogFilterItem>
						{:else if sortItem.value === "year"}
							<CatalogFilterItem
								title={sortItem.label}
								active={currentSort === sortItem.value}
								showDirection={Boolean(sortItem.toggleDirection)}
								{sortOrder}
								onclick={() => handleSortClick(sortItem)}
							>
								{#snippet iconSnippet()}
									<svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
										<path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z"/>
									</svg>
								{/snippet}
							</CatalogFilterItem>
						{:else if sortItem.value === "rating"}
							<CatalogFilterItem
								title={sortItem.label}
								active={currentSort === sortItem.value}
								showDirection={Boolean(sortItem.toggleDirection)}
								{sortOrder}
								onclick={() => handleSortClick(sortItem)}
							>
								{#snippet iconSnippet()}
									<svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
										<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
									</svg>
								{/snippet}
							</CatalogFilterItem>
						{:else if sortItem.value === "title"}
							<CatalogFilterItem
								title={sortItem.label}
								active={currentSort === sortItem.value}
								showDirection={Boolean(sortItem.toggleDirection)}
								{sortOrder}
								onclick={() => handleSortClick(sortItem)}
							>
								{#snippet iconSnippet()}
									<svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
										<path d="M9.25 5L5.75 14.5H7.35L8.15 12.2H11.85L12.65 14.5H14.25L10.75 5H9.25ZM8.65 10.8L10 6.95L11.35 10.8H8.65ZM18 6V16.17L19.59 14.59L20.71 15.71L17.21 19.21C17.1 19.32 16.9 19.32 16.79 19.21L13.29 15.71L14.41 14.59L16 16.17V6H18Z"/>
									</svg>
								{/snippet}
							</CatalogFilterItem>
						{:else if sortItem.value === "rank"}
							<CatalogFilterItem
								title={sortItem.label}
								active={currentSort === sortItem.value}
								showDirection={Boolean(sortItem.toggleDirection)}
								{sortOrder}
								onclick={() => handleSortClick(sortItem)}
							>
								{#snippet iconSnippet()}
									<svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
										<path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
									</svg>
								{/snippet}
							</CatalogFilterItem>
						{:else if sortItem.value === "price"}
							<CatalogFilterItem
								title={sortItem.label}
								active={currentSort === sortItem.value}
								showDirection={Boolean(sortItem.toggleDirection)}
								{sortOrder}
								onclick={() => handleSortClick(sortItem)}
							>
								{#snippet iconSnippet()}
									<svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
										<path d="M12.5 6.9c1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85z"/>
									</svg>
								{/snippet}
							</CatalogFilterItem>
						{:else}
							<CatalogFilterItem
								title={sortItem.label}
								active={currentSort === sortItem.value}
								showDirection={Boolean(sortItem.toggleDirection)}
								{sortOrder}
								icon={sortItem.icon}
								onclick={() => handleSortClick(sortItem)}
							/>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	{/snippet}

	<!-- Дополнительный контент сверху (например, виджет целей чтения) -->
	{#if extraTopContent}
		<div class="media-controls__top-content">
			{@render extraTopContent()}
		</div>
	{/if}

	<!-- Контент слева (карточки сетки, unboxed) -->
	<!-- Мобильные чипсы горизонтального скролла перед контентом -->
	<div class="media-controls__mobile-chips">
		<button
			type="button"
			class="media-controls__status-tab"
			class:media-controls__status-tab--active={!selectedStatus}
			onclick={() => onStatusChange("")}
		>
			<Icon icon="material-symbols:apps-rounded" aria-hidden="true" />
			<span>Все</span>
			<span class="media-controls__status-tab-count">{totalAllCount}</span>
		</button>
		{#each statusItems as item}
			<button
				type="button"
				class="media-controls__status-tab"
				class:media-controls__status-tab--active={selectedStatus === item.value}
				onclick={() => onStatusChange(item.value)}
			>
				{#if item.value === "planned" || item.icon === "material-symbols:bookmark-rounded"}
					<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
					</svg>
				{:else if item.icon}
					<Icon icon={item.icon} aria-hidden="true" />
				{/if}
				<span>{item.label}</span>
				{#if item.count !== undefined}
					<span class="media-controls__status-tab-count">{item.count}</span>
				{/if}
			</button>
		{/each}
	</div>

	{@render children?.()}
</CatalogShell>

<style lang="stylus">
.media-controls
	&__top-content
		margin-bottom: 1.25rem
		width: 100%

	&__mobile-search
		position: relative
		width: 100%

		:global(.m3-text-field)
			width: 100%

		:global(.m3-text-field input)
			outline: none !important
			box-shadow: none !important
			border: none !important
			-webkit-tap-highlight-color: transparent

	&__mobile-chips
		display: flex
		gap: 0.5rem
		margin-bottom: 1.25rem
		overflow-x: auto
		scrollbar-width: none
		padding-bottom: 0.25rem
		&::-webkit-scrollbar
			display: none

		@media (min-width: 64rem)
			display: none

	&__status-tab
		display: inline-flex
		align-items: center
		gap: 0.375rem
		height: 2.125rem
		padding: 0 0.75rem
		border-radius: var(--shape-corner-medium, 0.75rem)
		border: none
		background: var(--surface-container-high)
		color: var(--on-surface-variant)
		font: var(--m3e-type-label-medium)
		font-weight: 500
		white-space: nowrap
		cursor: pointer
		-webkit-tap-highlight-color: transparent
		user-select: none
		transition:
			background-color var(--m3e-duration-short) var(--m3e-easing-standard),
			color var(--m3e-duration-short) var(--m3e-easing-standard),
			box-shadow var(--m3e-duration-short) var(--m3e-easing-standard)

		&--active
			background: unquote("color-mix(in oklab, var(--primary) 15%, var(--surface-container-highest))")
			color: var(--on-surface)
			border: none
			font-weight: 600

			.media-controls__status-tab-count
				background: var(--primary)
				color: var(--on-primary)

	&__status-tab-count
		display: inline-flex
		align-items: center
		justify-content: center
		min-width: 1.25rem
		height: 1.125rem
		padding: 0 0.3125rem
		border-radius: var(--shape-corner-small, 0.5rem)
		background: unquote("color-mix(in oklab, var(--on-surface) 8%, transparent)")
		color: var(--on-surface-variant)
		font-size: 0.6875rem
		font-weight: 600
		font-variant-numeric: tabular-nums

	&__search-field-wrap
		position: relative
		width: 100%

	&__section
		display: flex
		flex-direction: column
		gap: 0.5rem

	&__label
		display: flex
		align-items: center
		color: var(--on-surface-variant)
		opacity: 0.8
		font: var(--m3e-type-label-small)
		font-size: 0.6875rem
		font-weight: 700
		text-transform: uppercase
		letter-spacing: 0.08em
		padding-left: 0.25rem

	&__list-group
		display: flex
		flex-direction: column
		gap: 0.25rem

	&__status-divider
		height: 1px
		width: 100%
		margin: 0.25rem 0
		background: var(--outline-variant, rgba(255, 255, 255, 0.12))
		opacity: 0.6
</style>
