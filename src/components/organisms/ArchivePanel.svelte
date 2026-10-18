<script lang="ts">
/**
 * 归档面板：分组切换（SegmentedButton，按年 / 按分类 / 按标签）+ 时间轴列表（组折叠见 ArchiveList 原子）。
 * URL 参数（?category= / ?tag= / ?uncategorized）是定向浏览视图：隐藏分组切换，
 * 顶部显示筛选头（面包屑）——索引页链接 › 当前筛选值，一键回溯到分类/标签索引页；
 * 无筛选时显示分组切换，可按年 / 按分类 / 按标签切换全量归档的分组。
 */
import ArchiveList from "../atoms/blog/ArchiveList.svelte";
import type {
	ArchiveGroup,
	ArchiveItem,
} from "../atoms/blog/ArchiveList.svelte";
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
			value: tag,
			icon: "material-symbols:tag-rounded",
		};
	}
	return null;
});

/** 筛选后的文章（учитывает URL параметры ?category= / ?tag= / ?uncategorized） */
const filtered = $derived(
	sortedPosts.filter((p) => {
		if (uncategorized && p.data.category) return false;
		if (category && p.data.category !== category) return false;
		if (tag && !p.data.tags.includes(tag)) return false;
		return true;
	}),
);

function formatDate(date: Date) {
	const cal = formatCalendarDate(date); // YYYY-MM-DD
	const parts = cal.split("-");
	if (parts.length === 3) {
		return `${parts[2]}.${parts[1]}`;
	}
	return cal.slice(5);
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

/** 
 * Группировка: для "По годам", а также для категорий и тегов группируем по годам!
 * Больше никаких 100 раскрывашек с 1 постом! Чипы фильтруют, а список идет единым чистым таймлайном.
 */
const groups = $derived.by((): ArchiveGroup[] => {
	if (filtered.length === 0) return [];
	const buckets = new Map<string, ArchiveItem[]>();
	const add = (key: string, item: ArchiveItem) => {
		const list = buckets.get(key);
		if (list) list.push(item);
		else buckets.set(key, [item]);
	};

	for (const p of filtered) {
		add(formatCalendarDate(p.data.published).slice(0, 4), toItem(p));
	}

	const list = [...buckets.entries()].map(([id, items]) => ({
		id,
		title: id,
		items,
	}));
	return list.sort((a, b) => Number(b.title) - Number(a.title));
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

<div class="archive-panel px-5 py-6 sm:px-10 sm:py-8 rounded-[var(--shape-corner-l,16px)]">
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
						title={i18n(I18nKey.clear)}
						aria-label={i18n(I18nKey.clear)}
					>
						<Icon icon="material-symbols:close-rounded" />
					</a>
				</div>
			</div>
			<div class="m3e-filter-header__meta">
				<span class="m3e-filter-header__count">{countLabel(filtered.length)}</span>
			</div>
		</div>
	{/if}
	{#if groups.length > 0}
		<ArchiveList
			{groups}
			{countLabel}
			{restoredCollapsed}
			hideGroupHeader={!!filterCrumb}
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
</div>

