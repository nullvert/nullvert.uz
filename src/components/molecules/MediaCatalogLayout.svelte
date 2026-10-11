<script lang="ts">
/**
 * MediaCatalogLayout — универсальный каталожный лейаут для медиа-секций
 * (Аниме, Фильмы, Сериалы, Книги, Игры).
 * 
 * Обновления:
 * - Убран лишний заголовок «Поиск» в сайдбаре (сразу поле ввода).
 * - Сайдбар выровнен точно по верхнему краю контента (`align-items: start`, `top: 5.5rem`).
 * - Кастомный вертикальный список фильтров по статусам с сохранением оригинальных иконок
 *   (без принудительной замены на галочку) и со счётчиками напротив каждого статуса.
 * - Опция "Все" со счётчиком для сброса фильтрации.
 */
import Card from "@components/atoms/display/Card.svelte";
import TextField from "@components/atoms/input/TextField.svelte";
import RightSideDrawer from "./RightSideDrawer.svelte";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import type { Snippet } from "svelte";

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
	searchPlaceholder = "Поиск...",
	sourceLabel = "Источник",
	onStatusChange = () => {},
	onSourceChange = () => {},
	onSortChange = () => {},
	onSortOrderChange = () => {},
	onLayoutChange = () => {},
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
	children?: Snippet;
} = $props();

let isMobileSheetOpen = $state(false);

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

<div class="media-catalog">
	<div class="media-catalog__layout">
		<!-- Основная контентная колонка -->
		<div class="media-catalog__main">
			<!-- Мобильная строка поиска и кнопка фильтров -->
			<div class="media-catalog__mobile-controls">
				<div class="media-catalog__mobile-search">
					<TextField
						type="text"
						bind:value={query}
						placeholder={i18n(I18nKey.search)}
						hideLabel
						variant="outlined"
						class="!rounded-(--shape-corner-full)"
					>
						<svg slot="leading" class="w-5 h-5 text-[var(--on-surface-variant)]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M9.5 3a6.5 6.5 0 0 1 5.25 10.33l4.96 4.96a1 1 0 0 1-1.42 1.42l-4.96-4.96A6.5 6.5 0 1 1 9.5 3m0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9"/>
						</svg>
					</TextField>
					{#if query}
						<button
							type="button"
							class="media-catalog__search-clear"
							aria-label={i18n(I18nKey.clear)}
							onclick={() => (query = "")}
						>
							<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path d="m12 13.4-4.9 4.9q-.275.275-.7.275t-.7-.275q-.275-.275-.275-.7t.275-.7l4.9-4.9-4.9-4.9q-.275-.275-.275-.7t.275-.7q.275-.275.7-.275t.7.275l4.9 4.9 4.9-4.9q.275-.275.7-.275t.7.275q.275.275.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7q-.275.275-.7.275t-.7-.275z"/>
							</svg>
						</button>
					{/if}
				</div>

				<button
					type="button"
					class="media-catalog__filter-trigger"
					class:media-catalog__filter-trigger--active={Boolean(selectedStatus)}
					onclick={() => (isMobileSheetOpen = true)}
					aria-label="Параметры и фильтры"
					title="Параметры и фильтры"
				>
					<svg class="media-catalog__filter-trigger-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h16q.825 0 1.413.588T22 6v12q0 .825-.587 1.413T20 20zm12-2h4V6h-4zm-2 0V6H4v12z"/>
					</svg>
					{#if selectedStatus}
						<span class="media-catalog__filter-badge" aria-hidden="true"></span>
					{/if}
				</button>
			</div>

			<!-- Мобильный скролл статусов -->
			<div class="media-catalog__mobile-chips">
				<button
					type="button"
					class="media-catalog__status-tab"
					class:media-catalog__status-tab--active={!selectedStatus}
					onclick={() => onStatusChange("")}
				>
					<Icon icon="material-symbols:apps-rounded" aria-hidden="true" />
					<span>Все</span>
					<span class="media-catalog__status-tab-count">{totalAllCount}</span>
				</button>
				{#each statusItems as item}
					<button
						type="button"
						class="media-catalog__status-tab"
						class:media-catalog__status-tab--active={selectedStatus === item.value}
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
							<span class="media-catalog__status-tab-count">{item.count}</span>
						{/if}
					</button>
				{/each}
			</div>

			<!-- Карточки контента -->
			<div class="media-catalog__content">
				{@render children?.()}
			</div>
		</div>

		<!-- Десктопный боковой сайдбар (>= 1024px) -->
		<aside class="media-catalog__sidebar" aria-label="Параметры каталога">
			<Card color="var(--card-bg)" radius="l" class="media-catalog__sidebar-card p-5">
				<div class="media-catalog__sidebar-inner">
					<!-- Поле поиска без дублирующего заголовка -->
					<div class="media-catalog__search-field-wrap">
						<TextField
							id="catalog-search-input"
							type="text"
							bind:value={query}
							placeholder={searchPlaceholder}
							hideLabel
							variant="outlined"
							class="rounded-full"
						>
							<svg slot="leading" class="w-5 h-5 text-[var(--on-surface-variant)]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path d="M9.5 3a6.5 6.5 0 0 1 5.25 10.33l4.96 4.96a1 1 0 0 1-1.42 1.42l-4.96-4.96A6.5 6.5 0 1 1 9.5 3m0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9"/>
							</svg>
						</TextField>
						{#if query}
							<button
								type="button"
								class="media-catalog__search-clear"
								aria-label={i18n(I18nKey.clear)}
								onclick={() => (query = "")}
							>
								<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
									<path d="m12 13.4-4.9 4.9q-.275.275-.7.275t-.7-.275q-.275-.275-.275-.7t.275-.7l4.9-4.9-4.9-4.9q-.275-.275-.275-.7t.275-.7q.275-.275.7-.275t.7.275l4.9 4.9 4.9-4.9q.275-.275.7-.275t.7.275q.275.275.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7q-.275.275-.7.275t-.7-.275z"/>
								</svg>
							</button>
						{/if}
					</div>

					<!-- Источник данных (Shikimori / AniList / Тип) -->
					{#if sources.length > 1}
						<div class="media-catalog__sidebar-section">
							<span class="media-catalog__sidebar-label">{sourceLabel}</span>
							<div class="media-catalog__segmented" role="group">
								{#each sources as src}
									<button
										type="button"
										class="media-catalog__segmented-btn"
										class:media-catalog__segmented-btn--active={currentSource === src.value}
										onclick={() => {
											currentSource = src.value;
											onSourceChange(src.value);
										}}
									>
										{#if src.icon}
											<Icon icon={src.icon} aria-hidden="true" />
										{/if}
										<span>{src.label}</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Фильтр по статусам: чистый вертикальный список в стиле M3 Navigation List -->
					<div class="media-catalog__sidebar-section">
						<span class="media-catalog__sidebar-label">Статус</span>

						<div class="media-catalog__list-group">
							<!-- Опция "Все" -->
							<button
								type="button"
								class="media-catalog__list-item"
								class:media-catalog__list-item--active={!selectedStatus}
								onclick={() => onStatusChange("")}
							>
								<span class="media-catalog__list-item-icon">
									<Icon icon="material-symbols:apps-rounded" aria-hidden="true" />
								</span>
								<span class="media-catalog__list-item-title">Все</span>
								<span class="media-catalog__list-item-badge">{totalAllCount}</span>
							</button>

							<!-- Статусы: Смотрю, Просмотрено, В планах, Отложено, Брошено -->
							{#each statusItems as item}
								<button
									type="button"
									class="media-catalog__list-item"
									class:media-catalog__list-item--active={selectedStatus === item.value}
									onclick={() => onStatusChange(item.value)}
								>
									<span class="media-catalog__list-item-icon">
										{#if item.value === "planned" || item.icon === "material-symbols:bookmark-rounded"}
											<svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
												<path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
											</svg>
										{:else if item.icon}
											<Icon icon={item.icon} aria-hidden="true" />
										{:else}
											<span class="media-catalog__status-dot" aria-hidden="true"></span>
										{/if}
									</span>
									<span class="media-catalog__list-item-title">{item.label}</span>
									{#if item.count !== undefined}
										<span class="media-catalog__list-item-badge">{item.count}</span>
									{/if}
								</button>
							{/each}
						</div>
					</div>

					<!-- Сортировка: в едином дизайне со статусами (M3 Navigation List) -->
					{#if sortOptions.length > 0}
						<div class="media-catalog__sidebar-section">
							<span class="media-catalog__sidebar-label">Сортировка</span>
							<div class="media-catalog__list-group">
								{#each sortOptions as sortItem}
									<button
										type="button"
										class="media-catalog__list-item"
										class:media-catalog__list-item--active={currentSort === sortItem.value}
										onclick={() => handleSortClick(sortItem)}
									>
										<span class="media-catalog__list-item-icon">
											{#if sortItem.value === "default"}
												<svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
													<path d="M3 13.5v-1h3v1zm0-4v-1h3v1zm0-4v-1h3v1zm4 9v-2h14v2zm0-4v-2h14v2zm0-4V4.5h14v2z"/>
												</svg>
											{:else if sortItem.value === "year"}
												<svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
													<path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z"/>
												</svg>
											{:else if sortItem.value === "rating"}
												<svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
													<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
												</svg>
											{:else if sortItem.value === "title"}
												<svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
													<!-- A-Z typography sort: буква 'A' + стрелка сортировки '↓' -->
													<path d="M9.25 5L5.75 14.5H7.35L8.15 12.2H11.85L12.65 14.5H14.25L10.75 5H9.25ZM8.65 10.8L10 6.95L11.35 10.8H8.65ZM18 6V16.17L19.59 14.59L20.71 15.71L17.21 19.21C17.1 19.32 16.9 19.32 16.79 19.21L13.29 15.71L14.41 14.59L16 16.17V6H18Z"/>
												</svg>
											{:else if sortItem.icon}
												<Icon icon={sortItem.icon} aria-hidden="true" />
											{:else}
												<Icon icon="material-symbols:sort-rounded" aria-hidden="true" />
											{/if}
										</span>
										<span class="media-catalog__list-item-title">{sortItem.label}</span>
										{#if sortItem.toggleDirection && currentSort === sortItem.value}
											<span class="media-catalog__list-item-action" class:media-catalog__list-item-action--asc={sortOrder === "asc"}>
												<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
													<path d="M12 20q-.425 0-.712-.288t-.288-.712V5.425l-4.9 4.9q-.275.275-.7.275t-.7-.275q-.275-.275-.275-.7t.275-.7l6.6-6.6q.3-.3.7-.3t.7.3l6.6 6.6q.275.275.275.7t-.275.7q-.275.275-.7.275t-.7-.275l-4.9-4.9V19q0 .425-.288.713T12 20"/>
												</svg>
											</span>
										{/if}
									</button>
								{/each}
							</div>
						</div>
					{/if}

				</div>
			</Card>
		</aside>
	</div>
</div>

<!-- Мобильное правое боковое меню (Right Navigation Drawer) -->
<RightSideDrawer bind:open={isMobileSheetOpen} title="Параметры" ariaLabel="Параметры и фильтры">
	{#if sources.length > 1}
		<div class="media-catalog__drawer-group">
			<span class="media-catalog__sidebar-label">{sourceLabel}</span>
			<div class="media-catalog__segmented" role="group">
				{#each sources as src}
					<button
						type="button"
						class="media-catalog__segmented-btn"
						class:media-catalog__segmented-btn--active={currentSource === src.value}
						onclick={() => {
							currentSource = src.value;
							onSourceChange(src.value);
						}}
					>
						{#if src.icon}
							<Icon icon={src.icon} aria-hidden="true" />
						{/if}
						<span>{src.label}</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<div class="media-catalog__drawer-group">
		<span class="media-catalog__sidebar-label">Статус</span>
		<div class="media-catalog__list-group">
			<button
				type="button"
				class="media-catalog__list-item"
				class:media-catalog__list-item--active={!selectedStatus}
				onclick={() => onStatusChange("")}
			>
				<span class="media-catalog__list-item-icon">
					<Icon icon="material-symbols:apps-rounded" aria-hidden="true" />
				</span>
				<span class="media-catalog__list-item-title">Все тайтлы</span>
				<span class="media-catalog__list-item-badge">{totalAllCount}</span>
			</button>

			{#each statusItems as item}
				<button
					type="button"
					class="media-catalog__list-item"
					class:media-catalog__list-item--active={selectedStatus === item.value}
					onclick={() => onStatusChange(item.value)}
				>
					<span class="media-catalog__list-item-icon">
						{#if item.value === "planned" || item.icon === "material-symbols:bookmark-rounded"}
							<svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
							</svg>
						{:else if item.icon}
							<Icon icon={item.icon} aria-hidden="true" />
						{:else}
							<span class="media-catalog__status-dot" aria-hidden="true"></span>
						{/if}
					</span>
					<span class="media-catalog__list-item-title">{item.label}</span>
					{#if item.count !== undefined}
						<span class="media-catalog__list-item-badge">{item.count}</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	{#if sortOptions.length > 0}
		<div class="media-catalog__drawer-group">
			<span class="media-catalog__sidebar-label">Сортировка</span>
			<div class="media-catalog__list-group">
				{#each sortOptions as sortItem}
					<button
						type="button"
						class="media-catalog__list-item"
						class:media-catalog__list-item--active={currentSort === sortItem.value}
						onclick={() => handleSortClick(sortItem)}
					>
						<span class="media-catalog__list-item-icon">
							{#if sortItem.value === "default"}
								<svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
									<path d="M3 13.5v-1h3v1zm0-4v-1h3v1zm0-4v-1h3v1zm4 9v-2h14v2zm0-4v-2h14v2zm0-4V4.5h14v2z"/>
								</svg>
							{:else if sortItem.value === "year"}
								<svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
									<path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z"/>
								</svg>
							{:else if sortItem.value === "rating"}
								<svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
									<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
								</svg>
							{:else if sortItem.value === "title"}
								<svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
									<!-- A-Z typography sort: буква 'A' + стрелка сортировки '↓' -->
									<path d="M9.25 5L5.75 14.5H7.35L8.15 12.2H11.85L12.65 14.5H14.25L10.75 5H9.25ZM8.65 10.8L10 6.95L11.35 10.8H8.65ZM18 6V16.17L19.59 14.59L20.71 15.71L17.21 19.21C17.1 19.32 16.9 19.32 16.79 19.21L13.29 15.71L14.41 14.59L16 16.17V6H18Z"/>
								</svg>
							{:else if sortItem.icon}
								<Icon icon={sortItem.icon} aria-hidden="true" />
							{:else}
								<Icon icon="material-symbols:sort-rounded" aria-hidden="true" />
							{/if}
						</span>
						<span class="media-catalog__list-item-title">{sortItem.label}</span>
						{#if sortItem.toggleDirection && currentSort === sortItem.value}
							<span class="media-catalog__list-item-action" class:media-catalog__list-item-action--asc={sortOrder === "asc"}>
								<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
									<path d="M12 20q-.425 0-.712-.288t-.288-.712V5.425l-4.9 4.9q-.275.275-.7.275t-.7-.275q-.275-.275-.275-.7t.275-.7l6.6-6.6q.3-.3.7-.3t.7.3l6.6 6.6q.275.275.275.7t-.275.7q-.275.275-.7.275t-.7-.275l-4.9-4.9V19q0 .425-.288.713T12 20"/>
								</svg>
							</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}

</RightSideDrawer>

<style lang="stylus">
.media-catalog
	width: 100%

	&__layout
		display: flex
		flex-direction: column
		gap: 1.5rem

		@media (min-width: 64rem) // 1024px (lg)
			display: grid
			grid-template-columns: minmax(0, 1fr) 20rem
			align-items: start

	&__main
		min-width: 0

	&__mobile-controls
		display: flex
		align-items: center
		gap: 0.75rem
		margin-bottom: 1rem

		@media (min-width: 64rem)
			display: none

	&__mobile-search
		position: relative
		flex: 1
		min-width: 0

		:global(.m3-text-field)
			width: 100%

		:global(.m3-text-field input)
			outline: none !important
			box-shadow: none !important
			border: none !important
			padding-right: 2.25rem !important
			-webkit-tap-highlight-color: transparent

			&:focus,
			&:focus-visible
				outline: none !important
				box-shadow: none !important
				border: none !important

			&::-webkit-search-decoration,
			&::-webkit-search-cancel-button,
			&::-webkit-search-results-button,
			&::-webkit-search-results-decoration
				-webkit-appearance: none !important
				display: none !important

			&::-ms-clear
				display: none !important
				width: 0 !important
				height: 0 !important

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
		border-radius: var(--shape-corner-full)
		border: 1px solid var(--outline-variant)
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
			border-color var(--m3e-duration-short) var(--m3e-easing-standard),
			color var(--m3e-duration-short) var(--m3e-easing-standard)

		> :global(svg)
			width: 1rem
			height: 1rem
			color: currentColor

		&--active
			background: unquote("color-mix(in oklab, var(--primary) 15%, var(--surface-container-highest))")
			color: var(--on-surface)
			border-color: var(--primary)
			font-weight: 600

			.media-catalog__status-tab-count
				background: var(--primary)
				color: var(--on-primary)

	&__status-tab-count
		display: inline-flex
		align-items: center
		justify-content: center
		min-width: 1.25rem
		height: 1.125rem
		padding: 0 0.3125rem
		border-radius: var(--shape-corner-full)
		background: unquote("color-mix(in oklab, var(--on-surface) 8%, transparent)")
		color: var(--on-surface-variant)
		font-size: 0.6875rem
		font-weight: 600
		font-variant-numeric: tabular-nums

	&__filter-trigger
		position: relative
		display: inline-flex
		align-items: center
		justify-content: center
		width: 3rem
		height: 3rem
		flex-shrink: 0
		border: 1px solid var(--outline-variant)
		border-radius: var(--shape-corner-full)
		background: var(--surface-container-high)
		color: var(--on-surface)
		cursor: pointer
		-webkit-tap-highlight-color: transparent
		transition:
			background-color var(--m3e-duration-short) var(--m3e-easing-standard),
			border-color var(--m3e-duration-short) var(--m3e-easing-standard)

		.media-catalog__filter-trigger-icon
			width: 1.375rem
			height: 1.375rem
			display: block
			fill: currentColor
			color: var(--on-surface)

		&:hover
			background: var(--surface-container-highest)
			color: var(--on-surface)

		&--active
			background: unquote("color-mix(in oklab, var(--primary) 15%, var(--surface-container-highest))")
			border-color: var(--primary)

			.media-catalog__filter-trigger-icon
				color: var(--primary)

	&__filter-badge
		position: absolute
		top: 0.5rem
		right: 0.5rem
		width: 0.5rem
		height: 0.5rem
		border-radius: 50%
		background: var(--primary)
		box-shadow: 0 0 0 2px var(--surface-container-high)

	/* ── Сайдбар на десктопе ── */
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
		gap: 1rem

	&__sidebar-section
		display: flex
		flex-direction: column
		gap: 0.45rem

		&--bottom
			margin-top: 0.125rem
			padding-top: 0.125rem

	&__sidebar-label
		display: flex
		align-items: center
		color: var(--on-surface-variant)
		font: var(--m3e-type-label-small)
		font-size: 0.6875rem
		font-weight: 700
		text-transform: uppercase
		letter-spacing: 0.05em

	&__search-field-wrap
		position: relative
		width: 100%

		:global(.m3-text-field)
			width: 100%

		:global(.m3-text-field input)
			outline: none !important
			box-shadow: none !important
			border: none !important
			padding-right: 2.25rem !important
			-webkit-tap-highlight-color: transparent

			&:focus,
			&:focus-visible
				outline: none !important
				box-shadow: none !important
				border: none !important

			&::-webkit-search-decoration,
			&::-webkit-search-cancel-button,
			&::-webkit-search-results-button,
			&::-webkit-search-results-decoration
				-webkit-appearance: none !important
				display: none !important

			&::-ms-clear
				display: none !important
				width: 0 !important
				height: 0 !important

	&__search-clear
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
			background: unquote("color-mix(in oklab, var(--on-surface) 10%, transparent)")
			color: var(--on-surface)

	/* ── Единый список элементов управления (M3 List Group) ── */
	&__list-group
		display: flex
		flex-direction: column
		gap: 0.25rem

	&__list-item
		display: flex
		align-items: center
		gap: 0.625rem
		width: 100%
		padding: 0.375rem 0.625rem
		border: 1px solid transparent
		border-radius: var(--shape-corner-m)
		background: transparent
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-small)
		font-size: 0.8125rem
		font-weight: 500
		cursor: pointer
		text-align: left
		user-select: none
		transition:
			background-color var(--m3e-duration-short) var(--m3e-easing-standard),
			border-color var(--m3e-duration-short) var(--m3e-easing-standard),
			color var(--m3e-duration-short) var(--m3e-easing-standard),
			transform var(--m3e-duration-short) var(--m3e-easing-standard)

		&:hover:not(&--active)
			background: var(--surface-container-high)
			color: var(--on-surface)
			transform: translateX(2px)

		&--active
			background: unquote("color-mix(in oklab, var(--primary) 12%, var(--surface-container-high))")
			border-color: unquote("color-mix(in oklab, var(--primary) 35%, transparent)")
			color: var(--on-surface)
			font-weight: 600

			.media-catalog__list-item-icon
				color: var(--primary)

			.media-catalog__list-item-badge
				background: var(--primary)
				color: var(--on-primary)

			.media-catalog__list-item-action
				color: var(--primary)

	&__list-item-icon
		display: inline-flex
		align-items: center
		justify-content: center
		width: 1.25rem
		height: 1.25rem
		flex-shrink: 0
		color: var(--on-surface-variant)

		> :global(svg)
			width: 1.125rem
			height: 1.125rem

	&__status-dot
		width: 0.5rem
		height: 0.5rem
		border-radius: 50%
		background: currentColor

	&__list-item-title
		flex: 1
		min-width: 0
		white-space: nowrap
		overflow: hidden
		text-overflow: ellipsis

	&__list-item-badge
		display: inline-flex
		align-items: center
		justify-content: center
		min-width: 1.5rem
		height: 1.375rem
		padding: 0 0.4375rem
		border-radius: var(--shape-corner-full)
		background: var(--surface-container-high)
		color: var(--on-surface-variant)
		font: var(--m3e-type-label-small)
		font-weight: 600
		font-variant-numeric: tabular-nums

	&__list-item-action
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

	/* ── Segmented Control ── */
	&__segmented
		display: flex
		width: 100%
		height: 2.75rem
		padding: 2px
		border-radius: var(--shape-corner-full)
		background: var(--surface-container-high)
		border: 1px solid var(--outline-variant)
		box-sizing: border-box

	&__segmented-btn
		flex: 1
		position: relative
		display: inline-flex
		align-items: center
		justify-content: center
		gap: 0.375rem
		padding: 0 0.75rem
		border: none
		border-radius: var(--shape-corner-full)
		background: transparent
		color: var(--on-surface-variant)
		font: var(--m3e-type-label-medium)
		font-weight: 500
		cursor: pointer
		user-select: none
		transition:
			background-color var(--m3e-duration-short) var(--m3e-easing-standard),
			color var(--m3e-duration-short) var(--m3e-easing-standard),
			box-shadow var(--m3e-duration-short) var(--m3e-easing-standard)

		> :global(svg)
			width: 1.125rem
			height: 1.125rem
			flex-shrink: 0

		&--icon
			flex: 0 0 2.5rem

		&:hover:not(&--active)
			color: var(--on-surface)
			background: unquote("color-mix(in oklab, var(--on-surface) 8%, transparent)")

		&--active
			background: var(--primary)
			color: var(--on-primary)
			font-weight: 600
			box-shadow: var(--m3e-elevation-1)

	&__view-switch-row
		display: flex
		align-items: center
		justify-content: space-between
		gap: 0.75rem

		.media-catalog__segmented
			width: auto

	&__count-pill
		display: inline-flex
		align-items: center
		gap: 0.375rem
		padding: 0.3125rem 0.625rem
		border-radius: var(--shape-corner-full)
		background: var(--surface-container-high)
		color: var(--on-surface-variant)
		font: var(--m3e-type-label-small)
		font-weight: 600
		white-space: nowrap

	&__count-dot
		width: 0.375rem
		height: 0.375rem
		border-radius: 50%
		background: var(--primary)

	&__drawer-group
		display: flex
		flex-direction: column
		gap: 0.625rem
</style>
