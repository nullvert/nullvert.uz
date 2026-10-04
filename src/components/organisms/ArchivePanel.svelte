<script lang="ts">
/**
 * 归档面板：分组切换（SegmentedButton，按年 / 按分类 / 按标签）+ 时间轴列表（组折叠见 ArchiveList 原子）。
 * URL 参数（?category= / ?tag= / ?uncategorized）是定向浏览视图：隐藏分组切换，
 * 顶部显示筛选头（面包屑）——索引页链接 › 当前筛选值，一键回溯到分类/标签索引页；
 * 无筛选时显示分组切换，可按年 / 按分类 / 按标签切换全量归档的分组。
 */
import ArchiveList from "@components/atoms/blog/ArchiveList.svelte";
import type {
	ArchiveGroup,
	ArchiveItem,
} from "@components/atoms/blog/ArchiveList.svelte";
import Card from "@components/atoms/display/Card.svelte";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import { formatCalendarDate } from "@utils/content-date";
import { getPostUrlBySlug, url } from "@utils/url-utils";
import { onMount } from "svelte";

interface Post {
	slug: string;
	url?: string;
	data: {
		title: string;
		tags: string[];
		category: string | null;
		published: Date;
	};
}

let { sortedPosts = [] as Post[] }: { sortedPosts?: Post[] } = $props();

let category = $state("");
let tag = $state("");
let uncategorized = $state(false);
/** 分组维度：year / category / tag */
let groupBy = $state<string>("year");
let restoredCollapsed = $state<Record<string, boolean> | undefined>(undefined);

const COLLAPSED_STORAGE_KEY = "shirone:archive-collapsed";

function collapsedViewKey() {
	if (uncategorized) return `${groupBy}:uncategorized`;
	if (category) return `${groupBy}:category:${category}`;
	if (tag) return `${groupBy}:tag:${tag}`;
	return groupBy;
}

function readCollapsedState() {
	try {
		const stored = JSON.parse(
			localStorage.getItem(COLLAPSED_STORAGE_KEY) ?? "{}",
		) as Record<string, Record<string, boolean>>;
		restoredCollapsed = stored[collapsedViewKey()];
	} catch {
		restoredCollapsed = undefined;
	}
}

function persistCollapsedState(next: Record<string, boolean>) {
	try {
		const stored = JSON.parse(
			localStorage.getItem(COLLAPSED_STORAGE_KEY) ?? "{}",
		) as Record<string, Record<string, boolean>>;
		stored[collapsedViewKey()] = next;
		localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(stored));
	} catch {
		// Storage can be unavailable in privacy-restricted contexts.
	}
}

/** 筛选头数据：类别（决定索引链接）+ 展示值；无筛选为 null */
const filterCrumb = $derived.by(() => {
	if (uncategorized) {
		return {
			type: "category",
			href: url("/categories/"),
			label: i18n(I18nKey.categories),
			value: i18n(I18nKey.uncategorized),
			icon: "material-symbols:folder-outline-rounded",
		};
	}
	if (category) {
		return {
			type: "category",
			href: url("/categories/"),
			label: i18n(I18nKey.categories),
			value: category,
			icon: "material-symbols:folder-outline-rounded",
		};
	}
	if (tag) {
		return {
			type: "tag",
			href: url("/tags/"),
			label: i18n(I18nKey.tags),
			value: `#${tag}`,
			icon: "material-symbols:tag-rounded",
		};
	}
	return null;
});

const groupOptions = [
	{ value: "year", label: i18n(I18nKey.archiveGroupYear) },
	{ value: "category", label: i18n(I18nKey.archiveGroupCategory) },
	{ value: "tag", label: i18n(I18nKey.archiveGroupTag) },
];

/** 筛选后的文章（分组维度与之正交，均在下方消费） */
const filtered = $derived(
	sortedPosts.filter((p) => {
		if (uncategorized && p.data.category) return false;
		if (category && p.data.category !== category) return false;
		if (tag && !p.data.tags.includes(tag)) return false;
		return true;
	}),
);

function formatDate(date: Date) {
	return formatCalendarDate(date).slice(5);
}

function toItem(post: Post): ArchiveItem {
	return {
		title: post.data.title,
		href: post.url ?? getPostUrlBySlug(post.slug),
		date: formatDate(post.data.published),
		category: post.data.category ?? undefined,
		tags: post.data.tags,
	};
}

function countLabel(count: number) {
	return `${count} ${i18n(count === 1 ? I18nKey.postCount : I18nKey.postsCount)}`;
}

/** 按当前分组维度构建组；组内保持筛选后顺序（时间倒序）。 */
const groups = $derived.by((): ArchiveGroup[] => {
	if (filtered.length === 0) return [];
	const buckets = new Map<string, ArchiveItem[]>();
	const add = (key: string, item: ArchiveItem) => {
		const list = buckets.get(key);
		if (list) list.push(item);
		else buckets.set(key, [item]);
	};
	if (groupBy === "category") {
		for (const p of filtered) {
			add(p.data.category ?? i18n(I18nKey.uncategorized), toItem(p));
		}
	} else if (groupBy === "tag") {
		for (const p of filtered) {
			for (const t of p.data.tags) add(`#${t}`, toItem(p));
		}
	} else {
		for (const p of filtered) {
			add(formatCalendarDate(p.data.published).slice(0, 4), toItem(p));
		}
	}
	const list = [...buckets.entries()].map(([id, items]) => ({
		id,
		title: id,
		items,
	}));
	if (groupBy === "year") {
		return list.sort((a, b) => Number(b.title) - Number(a.title));
	}
	return list.sort((a, b) =>
		a.title.toLowerCase().localeCompare(b.title.toLowerCase()),
	);
});

onMount(() => {
	const syncParams = () => {
		const params = new URLSearchParams(window.location.search);
		category = params.get("category") || "";
		tag = params.get("tag") || "";
		uncategorized = params.has("uncategorized");
		if (category || tag || uncategorized) {
			groupBy = "year";
		}
		readCollapsedState();
	};
	syncParams();
	document.addEventListener("swup:content:replace", syncParams);
	document.addEventListener("swup:page:view", syncParams);
	return () => {
		document.removeEventListener("swup:content:replace", syncParams);
		document.removeEventListener("swup:page:view", syncParams);
	};
});

$effect(() => {
	groupBy;
	category;
	tag;
	uncategorized;
	if (typeof window !== "undefined") readCollapsedState();
});
</script>

<Card color="var(--card-bg)" radius="l" class="archive-panel px-8 py-6">
	<!-- Активный фильтр в стиле M3E: чистый чип фильтра и кнопка сброса -->
	{#if filterCrumb}
		<div class="m3e-filter-header">
			<div class="m3e-filter-header__main">
				<div class="m3e-active-chip">
					<span class="m3e-active-chip__icon" aria-hidden="true">
						<Icon icon={filterCrumb.icon} />
					</span>
					<span class="m3e-active-chip__label">{filterCrumb.value}</span>
					<span class="m3e-active-chip__badge">{filtered.length}</span>
					<a
						href={url("/archive/")}
						class="m3e-active-chip__clear m3-state-layer"
						title="Сбросить фильтр"
						aria-label="Сбросить фильтр"
					>
						<Icon icon="material-symbols:close-rounded" />
					</a>
				</div>
			</div>
			<div class="m3e-filter-header__meta">
				<span class="m3e-filter-header__count">{countLabel(filtered.length)}</span>
			</div>
		</div>
	{:else}
		<!-- Переключатель группировки (Segmented Button в стиле M3E Capsule) показывается только когда фильтр не активен -->
		<div class="archive-panel__group-switch">
			<div class="m3-segmented" role="radiogroup" aria-label={i18n(I18nKey.archiveGroup)}>
				{#each groupOptions as opt (opt.value)}
					<button
						type="button"
						role="radio"
						aria-checked={groupBy === opt.value}
						class="m3-segmented__segment m3-state-layer"
						class:selected={groupBy === opt.value}
						onclick={() => (groupBy = opt.value)}
					>
						{#if groupBy === opt.value}
							<span class="m3-segmented__check" aria-hidden="true">
								<Icon icon="material-symbols:check-rounded" />
							</span>
						{/if}
						<span>{opt.label}</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if groups.length > 0}
		<ArchiveList
			{groups}
			{countLabel}
			{restoredCollapsed}
			onCollapsedChange={persistCollapsedState}
		/>
	{:else}
		<div class="archive-panel__empty">
			<span class="archive-panel__empty-icon">
				<Icon icon="material-symbols:inbox-outline-rounded" />
			</span>
			<span>{i18n(I18nKey.noData)}</span>
		</div>
	{/if}
</Card>

