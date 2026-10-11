<script lang="ts" generics="T">
import MediaCard from "../molecules/MediaCard.svelte";
import MediaCardGrid from "../molecules/MediaCardGrid.svelte";
import MediaEmptyState from "../molecules/MediaEmptyState.svelte";
import MediaCatalogLayout, { type StatusFilterItem, type SortOption, type SourceOption } from "../molecules/MediaCatalogLayout.svelte";
import type { MediaDomain } from "../../types/mediaCatalog";
import { tokenSearch } from "../../utils/media/catalogFilter";
import { sortMediaItems } from "../../utils/media/catalogSort";
import { getSafeStorageItem, setSafeStorageItem } from "../../utils/media/catalogStorage";
import { readCatalogUrlState, writeCatalogUrlState } from "../../utils/media/catalogUrl";
import { onMount, untrack } from "svelte";

let {
	domain,
	items = [],
	title = "",
}: {
	domain: MediaDomain<T>;
	items: T[];
	title?: string;
} = $props();

const getSortStorageKey = () => `shirone:${domain.key}-sort-type`;
const getSortOrderStorageKey = () => `shirone:${domain.key}-sort-order`;
const getSourceStorageKey = () => `shirone:${domain.key}-source-filter`;

let query = $state("");
let selectedStatus = $state(untrack(() => domain.defaultStatus));
let currentSort = $state(untrack(() => domain.defaultSort));
let sortOrder = $state<"asc" | "desc">(untrack(() => domain.defaultSortOrder || "desc"));
let currentSource = $state("all");
let initialized = false;

// Подготовка и дедупликация исходных элементов при необходимости
const preparedItems = $derived.by(() => {
	return domain.prepare ? domain.prepare(items) : items;
});

// Фильтрация по источнику (типу или платформе)
const itemsBySource = $derived.by(() => {
	if (!domain.filterBySource || currentSource === "all") {
		return preparedItems;
	}
	return preparedItems.filter((item) => domain.filterBySource!(item, currentSource));
});

// Вычисление доступных источников (если домен не передал фиксированный список)
const dynamicSources = $derived.by<SourceOption[]>(() => {
	if (domain.sources) return domain.sources;
	if (domain.key === "games") {
		const platforms = Array.from(
			new Set((preparedItems as any[]).map((item) => item.platform).filter(Boolean)),
		) as string[];
		if (platforms.length <= 1) return [];
		return [
			{ value: "all", label: "Все игры", icon: "material-symbols:sports-esports-outline-rounded" },
			...platforms.map((plat) => ({
				value: plat,
				label: plat === "Windows PC" ? "PC" : plat,
				icon: "material-symbols:desktop-windows-outline-rounded",
			})),
		];
	}
	return [];
});

// Статусы и их количество
const statusItems = $derived.by<StatusFilterItem[]>(() => {
	const countsByStatus = itemsBySource.reduce<Record<string, number>>((acc, item: any) => {
		acc[item.status] = (acc[item.status] || 0) + 1;
		return acc;
	}, {});

	return domain.statusOrder
		.filter((s) => (countsByStatus[s] ?? 0) > 0)
		.map((status) => {
			const meta = domain.statusMeta[status];
			return {
				value: status,
				label: meta?.label || status,
				icon: meta?.icon,
				color: meta?.color,
				count: countsByStatus[status] || 0,
			};
		});
});

// Фильтрация и сортировка
const filteredItems = $derived.by(() => {
	const rawQuery = query.trim().toLowerCase();
	const tokens = rawQuery ? rawQuery.split(/\s+/).filter(Boolean) : [];

	const matched = itemsBySource.filter((item) => {
		if (selectedStatus && (item as any).status !== selectedStatus) {
			return false;
		}

		if (domain.hooks?.preFilter) {
			if (!domain.hooks.preFilter(item, { selectedStatus, currentSort })) {
				return false;
			}
		}

		if (tokens.length === 0) return true;

		const searchable = domain
			.searchFields(item)
			.filter(Boolean)
			.join(" ")
			.toLowerCase();

		return tokenSearch(tokens, searchable);
	});

	return sortMediaItems(matched as any[], currentSort, sortOrder) as T[];
});

function onStatusChange(newStatus: string) {
	if (newStatus === selectedStatus) return;
	selectedStatus = newStatus;

	domain.hooks?.onStatusChange?.(newStatus, {
		currentSort,
		setSort: (s: string) => {
			currentSort = s;
			setSafeStorageItem(getSortStorageKey(), s);
		},
	});
}

function onSourceChange(src: string) {
	if (src === currentSource) return;
	currentSource = src;
	setSafeStorageItem(getSourceStorageKey(), src);
}

function onSortChange(sort: string) {
	currentSort = sort;
	setSafeStorageItem(getSortStorageKey(), sort);

	domain.hooks?.onSortChange?.(sort, {
		selectedStatus,
		setStatus: (s: string) => {
			selectedStatus = s;
		},
		setOrder: (o: "asc" | "desc") => {
			sortOrder = o;
			setSafeStorageItem(getSortOrderStorageKey(), o);
		},
	});
}

function onSortOrderChange(order: "asc" | "desc") {
	sortOrder = order;
	setSafeStorageItem(getSortOrderStorageKey(), order);
}

// URL-синхронизация
$effect(() => {
	const s = selectedStatus;
	const q = query;
	const srt = currentSort;
	const ord = sortOrder;
	const src = currentSource;
	if (!initialized) return;

	writeCatalogUrlState(
		{ status: s, q, sort: srt, order: ord, source: src },
		domain.defaultStatus,
		domain.defaultSort,
	);
});

onMount(() => {
	const urlState = readCatalogUrlState(domain.defaultStatus, domain.defaultSort, domain.defaultSortOrder || "desc");

	selectedStatus = urlState.status;
	query = urlState.q;

	const allowedSorts = domain.sortOptions.map((o) => o.value);
	if (allowedSorts.includes(urlState.sort)) {
		currentSort = urlState.sort;
	} else {
		currentSort = getSafeStorageItem(getSortStorageKey(), allowedSorts, domain.defaultSort);
	}

	sortOrder = urlState.order || getSafeStorageItem(getSortOrderStorageKey(), ["asc", "desc"], domain.defaultSortOrder || "desc");

	if (urlState.source) {
		currentSource = urlState.source;
	} else {
		currentSource = getSafeStorageItem(getSourceStorageKey(), ["all", "movie", "show", "Windows PC"], "all");
	}

	initialized = true;
});
</script>

<MediaCatalogLayout
	sources={dynamicSources}
	bind:currentSource
	sourceLabel={domain.sourceLabel}
	searchPlaceholder={domain.searchPlaceholder}
	bind:query
	{statusItems}
	bind:selectedStatus
	sortOptions={domain.sortOptions}
	bind:currentSort
	bind:sortOrder
	totalAllCount={itemsBySource.length}
	totalFilteredCount={filteredItems.length}
	countLabel={domain.countLabel ? domain.countLabel(filteredItems.length) : `${filteredItems.length}`}
	{onStatusChange}
	{onSourceChange}
	{onSortChange}
	{onSortOrderChange}
>
	{#if filteredItems.length > 0}
		<MediaCardGrid ariaLabel={title}>
			{#each filteredItems as item (domain.getId(item))}
				<div role="listitem">
					<MediaCard
						item={domain.toCard(item)}
						aspect="poster"
						showTitleOnPoster={domain.cardProps?.showTitleOnPoster}
					/>
				</div>
			{/each}
		</MediaCardGrid>
	{:else}
		<MediaEmptyState
			message="Ничего не найдено"
		/>
	{/if}
</MediaCatalogLayout>
