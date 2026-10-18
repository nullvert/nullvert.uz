<script lang="ts">
/**
 * CompassSection — раздел закладок и инструментов («Компас»),
 * переработанный под универсальный CatalogShell:
 * - Слева: чистый контент (unboxed карточки без лишних внутренних Card-рамок)
 * - Справа: sticky-сайдбар с поиском и списком категорий / полок
 * - На мобильных: плавная шторка RightSideDrawer
 */
import CatalogSearchInput from "../molecules/CatalogSearchInput.svelte";
import CatalogFilterItem from "../molecules/CatalogFilterItem.svelte";
import CompassTile from "../molecules/CompassTile.svelte";
import CatalogShell from "../molecules/CatalogShell.svelte";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import { onMount } from "svelte";
import type { CompassShelf, CompassEntry } from "../../types/compass";

let {
	shelves = [] as CompassShelf[],
	title = i18n(I18nKey.compass),
	subtitle = i18n(I18nKey.compassBanner),
}: {
	shelves?: CompassShelf[];
	title?: string;
	subtitle?: string;
} = $props();

let query = $state("");
let selectedGroup = $state("");
let initialized = false;

type FilterPhase = "idle" | "loading" | "out";
let phase = $state<FilterPhase>("idle");
let phaseTimers: ReturnType<typeof setTimeout>[] = [];

function hostOf(href: string): string {
	try {
		return new URL(href).hostname;
	} catch {
		return href;
	}
}

/** Фильтрация: группа + поиск (название, описание, хост) */
const filteredShelves = $derived.by(() => {
	const normalizedQuery = query.trim().toLowerCase();
	return shelves
		.filter((shelf) => !selectedGroup || shelf.key === selectedGroup)
		.map((shelf) => ({
			...shelf,
			entries: normalizedQuery
				? shelf.entries.filter((entry: CompassEntry) =>
						[entry.label, entry.note ?? "", hostOf(entry.href)]
							.join(" ")
							.toLowerCase()
							.includes(normalizedQuery),
					)
				: shelf.entries,
		}))
		.filter((shelf) => shelf.entries.length > 0);
});

const totalCount = $derived(
	filteredShelves.reduce((sum, shelf) => sum + shelf.entries.length, 0),
);

const allEntriesCount = $derived(
	shelves.reduce((sum, shelf) => sum + shelf.entries.length, 0),
);

function handleGroupSelect(groupKey: string) {
	if (selectedGroup === groupKey) {
		selectedGroup = "";
	} else {
		selectedGroup = groupKey;
	}
	phaseTimers.forEach(clearTimeout);
	phase = "loading";
	phaseTimers = [
		setTimeout(() => (phase = "out"), 200),
		setTimeout(() => (phase = "idle"), 200 + 120),
	];
}

$effect(() => {
	const q = query;
	const g = selectedGroup;
	if (!initialized) return;
	const params = new URLSearchParams(window.location.search);
	params.delete("q");
	params.delete("group");
	if (q) params.set("q", q);
	if (g) params.set("group", g);
	const qs = params.toString();
	history.replaceState(
		history.state,
		"",
		qs ? `?${qs}` : window.location.pathname,
	);
});

onMount(() => {
	const params = new URLSearchParams(window.location.search);
	query = params.get("q") || "";
	selectedGroup = params.get("group") || "";
	initialized = true;
	return () => phaseTimers.forEach(clearTimeout);
});
</script>

<CatalogShell
	drawerTitle="Разделы Компаса"
	hasActiveFilters={Boolean(selectedGroup || query)}
>
	<!-- Мобильная полоса быстрого поиска -->
	{#snippet mobileHeader()}
		<div class="compass-controls__mobile-search">
			<CatalogSearchInput
				id="compass-mobile-search-input"
				bind:value={query}
				placeholder={i18n(I18nKey.search)}
			/>
		</div>
	{/snippet}

	<!-- Боковая панель параметров / разделов -->
	{#snippet sidebar()}
		<!-- Десктопный поиск -->
		<!-- Поле поиска для десктопа -->
		<CatalogSearchInput
			id="compass-search-input"
			bind:value={query}
			placeholder={i18n(I18nKey.search)}
		/>

		<!-- Список разделов Компаса -->
		<div class="compass-controls__section">
			<span class="compass-controls__label">Разделы</span>
			<div class="compass-controls__list">
				<CatalogFilterItem
					title="Все разделы"
					count={allEntriesCount}
					active={!selectedGroup}
					onclick={() => handleGroupSelect("")}
				/>

				{#each shelves as shelf}
					<CatalogFilterItem
						title={shelf.name}
						count={shelf.entries.length}
						active={selectedGroup === shelf.key}
						onclick={() => handleGroupSelect(shelf.key)}
					/>
				{/each}
			</div>
		</div>
	{/snippet}

	<!-- Контент слева: карточки Компаса (unboxed, без лишних обёрток Card) -->
	<div class="compass-page-content">
		<!-- Мобильный скролл чипсов разделов -->
		{#if shelves.length > 1}
			<div class="compass-controls__mobile-chips">
				<button
					type="button"
					class="compass-controls__chip"
					class:compass-controls__chip--active={!selectedGroup}
					onclick={() => handleGroupSelect("")}
				>
					<span>Все</span>
					<span class="compass-controls__chip-count">{allEntriesCount}</span>
				</button>
				{#each shelves as shelf}
					<button
						type="button"
						class="compass-controls__chip"
						class:compass-controls__chip--active={selectedGroup === shelf.key}
						onclick={() => handleGroupSelect(shelf.key)}
					>
						<span>{shelf.name}</span>
						<span class="compass-controls__chip-count">{shelf.entries.length}</span>
					</button>
				{/each}
			</div>
		{/if}

		{#if phase !== "idle"}
			<div
				class="compass-section__loading"
				class:compass-section__loading--out={phase === "out"}
			>
				<div class="w-12 h-12 rounded-full border-3 border-[var(--primary)] border-t-transparent animate-spin"></div>
			</div>
		{:else if filteredShelves.length > 0}
			{#key `${selectedGroup}|${query}`}
				{#each filteredShelves as shelf (shelf.key)}
					<section class="compass-shelf" data-shelf={shelf.key}>
						<div class="compass-shelf__header mb-3">
							<div class="flex items-center gap-2.5">
								{#if shelf.icon}
									<span class="text-[var(--primary)] text-xl flex items-center shrink-0" aria-hidden="true">
										<Icon icon={shelf.icon} />
									</span>
								{/if}
								<h2 class="text-xl font-bold text-[var(--on-surface)] tracking-tight">{shelf.name}</h2>
							</div>
							{#if shelf.blurb}
								<p class="text-sm text-[var(--on-surface-variant)] mt-1">{shelf.blurb}</p>
							{/if}
						</div>
						<div class="compass-shelf__grid">
							{#each shelf.entries as entry, i (entry.href)}
								<CompassTile {entry} delay={Math.min(i, 7) * 45} />
							{/each}
						</div>
					</section>
				{/each}
			{/key}
		{:else}
			<div class="compass-section__empty">
				<Icon icon="material-symbols:search-off-outline-rounded" aria-hidden="true" />
				<span>{i18n(I18nKey.compassNoResults)}</span>
			</div>
		{/if}
	</div>
</CatalogShell>

<style lang="stylus">
.compass-page-content
	width: 100%

.compass-controls
	&__mobile-search
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

	&__list
		display: flex
		flex-direction: column
		gap: 0.25rem

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

	&__chip
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
			color var(--m3e-duration-short) var(--m3e-easing-standard)

		> :global(svg)
			width: 1rem
			height: 1rem
			color: currentColor

		&--active
			background: unquote("color-mix(in oklab, var(--primary) 15%, var(--surface-container-highest))")
			color: var(--on-surface)
			border: none
			font-weight: 600

			.compass-controls__chip-count
				background: var(--primary)
				color: var(--on-primary)

	&__chip-count
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

.compass-shelf
	margin-bottom: 2.25rem

	&:last-child
		margin-bottom: 0

	:global(.section-title)
		margin-bottom: 1rem

	:global(.section-title__title)
		color: var(--on-surface) !important
		font-size: 1.125rem !important
		font-weight: 700 !important
		letter-spacing: -0.01em

	:global(.section-title__icon)
		color: var(--primary) !important

	:global(.section-title__icon svg)
		width: 1.25rem
		height: 1.25rem

.compass-shelf__grid
	display: grid
	grid-template-columns: repeat(3, minmax(0, 1fr))
	gap: 1.25rem

	@media (max-width: 64rem)
		grid-template-columns: repeat(2, minmax(0, 1fr))
		gap: 1rem

	@media (max-width: 40rem)
		grid-template-columns: 1fr
		gap: 0.875rem

.compass-section__loading
	display: flex
	align-items: center
	justify-content: center
	min-height: 11rem
	padding-top: 1.5rem

	&--out
		animation: compass-loading-out var(--m3e-duration-short) var(--m3e-easing-emphasized-accelerate) both

.compass-section__empty
	display: flex
	flex-direction: column
	align-items: center
	justify-content: center
	gap: 0.75rem
	min-height: 11rem
	padding-top: 1.5rem
	color: var(--on-surface-variant)
	font: var(--m3e-type-body-large)
	> :global(svg)
		width: 2.5rem
		height: 2.5rem

@keyframes compass-loading-out
	from
		opacity: 1
		transform: none
	to
		opacity: 0
		transform: scale(0.96)
</style>
