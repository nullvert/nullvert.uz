<script lang="ts">
/**
 * M3E 博客原子 — ArchiveList 归档时间轴
 * Кастомный двухстрочный макет:
 * 1-я строка: Название поста (крупно, читаемо)
 * 2-я строка: Категория (с иконкой папки) + красивые аккуратные теги
 * Адаптивно для десктопа и смартфонов.
 */
import Icon from "@iconify/svelte";
import { collapse } from "@utils/motion";

export interface ArchiveItem {
	title: string;
	href: string;
	/** 展示日期（如 "08-13"） */
	date: string;
	category?: string;
	tags?: string[];
}
export interface ArchiveGroup {
	/** 折叠状态键（组内唯一）：年份 / 分类名 / 标签名 */
	id: string;
	/** 头部主文本：年份数字 / 分类名 / #标签名 */
	title: string;
	items: ArchiveItem[];
}

let {
	groups = [],
	/** 单复数文案回调，如 (n) => `${n} 篇` */
	countLabel = (count: number) => `${count} 篇`,
	/** none 全部展开 / firstExpanded 多于一排时仅首年展开 */
	collapsedByDefault = "firstExpanded" as "none" | "firstExpanded",
	/** 由上层持久化后恢复的折叠状态 */
	restoredCollapsed = undefined as Record<string, boolean> | undefined,
	onCollapsedChange = undefined as
		| ((collapsed: Record<string, boolean>) => void)
		| undefined,
	hideGroupHeader = false,
	class: className = "",
}: {
	groups?: ArchiveGroup[];
	countLabel?: (count: number) => string;
	collapsedByDefault?: "none" | "firstExpanded";
	restoredCollapsed?: Record<string, boolean>;
	onCollapsedChange?: (collapsed: Record<string, boolean>) => void;
	hideGroupHeader?: boolean;
	class?: string;
} = $props();

function createCollapsedState(nextGroups: ArchiveGroup[]) {
	const collapseAllButFirst =
		collapsedByDefault === "firstExpanded" && nextGroups.length > 1;
	const next: Record<string, boolean> = {};
	nextGroups.forEach((group, index) => {
		next[group.id] =
			restoredCollapsed?.[group.id] ?? (collapseAllButFirst && index > 0);
	});
	return next;
}

let collapsed = $state<Record<string, boolean>>(createCollapsedState(groups));
let previousGroups = groups;
let previousRestoredCollapsed = restoredCollapsed;
let animatedGroupId = $state<string | null>(null);

$effect(() => {
	if (
		groups === previousGroups &&
		restoredCollapsed === previousRestoredCollapsed
	) {
		return;
	}
	previousGroups = groups;
	previousRestoredCollapsed = restoredCollapsed;
	animatedGroupId = null;
	collapsed = createCollapsedState(groups);
});

function toggleGroup(id: string) {
	animatedGroupId = id;
	collapsed[id] = !collapsed[id];
	onCollapsedChange?.({ ...collapsed });
}
</script>

<div class="m3-blog-archive {className}">
	{#each groups as g (g.id)}
		<section class="m3-blog-archive__group">
			{#if !hideGroupHeader}
				<button
					type="button"
					class="m3-blog-archive__header m3-state-layer"
					aria-expanded={!collapsed[g.id]}
					onclick={() => toggleGroup(g.id)}
				>
					<span class="m3-blog-archive__group-title">{g.title}</span>
					<div class="m3-blog-archive__header-end">
						<span class="m3-blog-archive__count">{countLabel(g.items.length)}</span>
						<span
							class="m3-blog-archive__chevron"
							class:m3-blog-archive__chevron--open={!collapsed[g.id]}
							aria-hidden="true"
						>
							<Icon icon="material-symbols:keyboard-arrow-down" />
						</span>
					</div>
				</button>
			{/if}
			<div
				class="m3-blog-archive__body"
				use:collapse={{
					open: hideGroupHeader || !collapsed[g.id],
					animate: animatedGroupId === g.id,
					resetKey: groups,
				}}
			>
				<ul class="m3-blog-archive__list">
					{#each g.items as it (it.href)}
						<li>
							<a class="m3-blog-archive__item" href={it.href} aria-label={it.title}>
								<span class="m3-blog-archive__date">{it.date}</span>
								<div class="m3-blog-archive__track" aria-hidden="true">
									<span class="m3-blog-archive__line"></span>
									<span class="m3-blog-archive__node"></span>
								</div>
								<span class="m3-blog-archive__title-text">{it.title}</span>
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</section>
	{/each}
</div>

<style>
.m3-blog-archive__group + .m3-blog-archive__group {
	margin-top: 1.5rem;
}

.m3-blog-archive__header {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	width: 100%;
	height: 3.25rem;
	box-sizing: border-box;
	padding: 0 1rem;
	border: none;
	border-radius: var(--shape-corner-l, 16px);
	background: transparent;
	box-shadow: none;
	text-align: left;
	cursor: pointer;
	color: inherit;
	--m3e-state-color: var(--on-surface);
	transition: background-color var(--m3e-duration-short) var(--m3e-easing-standard);
}

.m3-blog-archive__header:hover {
	background: color-mix(in srgb, var(--on-surface) 5%, transparent);
}

.m3-blog-archive__group-title {
	flex: 0 0 auto;
	font: var(--m3e-type-title-large);
	font-weight: 800;
	color: var(--on-surface);
	letter-spacing: -0.01em;
}

.m3-blog-archive__dot {
	display: none;
}

.m3-blog-archive__header-end {
	display: inline-flex;
	align-items: center;
	gap: 0.75rem;
	margin-left: auto;
}

.m3-blog-archive__count {
	display: inline-block;
	color: var(--on-surface-variant);
	font: var(--m3e-type-label-medium);
	font-weight: 500;
	font-variant-numeric: tabular-nums;
	opacity: 0.8;
	background: transparent;
	border: none;
	padding: 0;
	transition: color var(--m3e-duration-short) var(--m3e-easing-standard),
	            opacity var(--m3e-duration-short) var(--m3e-easing-standard);
}

.m3-blog-archive__header:hover .m3-blog-archive__count {
	color: var(--primary);
	opacity: 1;
}

.m3-blog-archive__chevron {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	width: 2rem;
	height: 2rem;
	border-radius: var(--shape-corner-full, 9999px);
	background: color-mix(in srgb, var(--surface-container-highest) 70%, transparent);
	color: var(--on-surface-variant);
	border: none;
	transition: background-color var(--m3e-duration-short) var(--m3e-easing-standard),
	            color var(--m3e-duration-short) var(--m3e-easing-standard),
	            transform var(--m3e-duration-short) var(--m3e-easing-emphasized-decelerate);
}

.m3-blog-archive__chevron :global(svg) {
	width: 1.25rem;
	height: 1.25rem;
}

.m3-blog-archive__chevron--open {
	transform: rotate(180deg);
}

.m3-blog-archive__list {
	display: flex;
	flex-direction: column;
	list-style: none;
	margin: 0;
	padding: 0.5rem 0;
	gap: 0.25rem;
}

.m3-blog-archive__item {
	position: relative;
	z-index: 2;
	display: flex;
	align-items: center;
	width: 100%;
	min-height: 2.75rem;
	padding: 0.375rem 0.75rem;
	gap: 0.875rem;
	border-radius: var(--shape-corner-m, 12px);
	background: transparent;
	border: none;
	box-shadow: none;
	text-decoration: none;
	transition: background-color var(--m3e-duration-short) var(--m3e-easing-standard);
}

.m3-blog-archive__item:hover {
	background: color-mix(in srgb, var(--on-surface) 4%, transparent);
}

.m3-blog-archive__date {
	flex: 0 0 2.75rem;
	width: 2.75rem;
	font-family: var(--font-mono, monospace), var(--m3e-font-body);
	font-variant-numeric: tabular-nums;
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--on-surface-variant);
	opacity: 0.75;
	letter-spacing: 0.01em;
	transition: color var(--m3e-duration-short) var(--m3e-easing-standard);
}

.m3-blog-archive__item:hover .m3-blog-archive__date {
	color: var(--primary);
	opacity: 1;
}

.m3-blog-archive__track {
	position: relative;
	flex: 0 0 0.875rem;
	width: 0.875rem;
	height: 2.75rem;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0;
}

.m3-blog-archive__line {
	position: absolute;
	top: -2px;
	bottom: -2px;
	left: 50%;
	width: 2px;
	margin-left: -1px;
	background: color-mix(in srgb, var(--outline-variant) 60%, transparent);
	pointer-events: none;
	z-index: 1;
}

li:first-child .m3-blog-archive__line {
	top: 50%;
}

li:last-child .m3-blog-archive__line {
	bottom: 50%;
}

.m3-blog-archive__node {
	position: relative;
	z-index: 2;
	width: 0.45rem;
	height: 0.45rem;
	border-radius: var(--shape-corner-full, 9999px);
	background: var(--surface);
	border: 2px solid var(--outline-variant);
	box-shadow: 0 0 0 2px var(--surface);
	box-sizing: border-box;
	transition: transform var(--m3e-duration-short) var(--m3e-easing-standard),
	            background-color var(--m3e-duration-short) var(--m3e-easing-standard),
	            border-color var(--m3e-duration-short) var(--m3e-easing-standard),
	            box-shadow var(--m3e-duration-short) var(--m3e-easing-standard);
}

.m3-blog-archive__item:hover .m3-blog-archive__node {
	background: var(--primary);
	border-color: var(--primary);
	transform: scale(1.35);
	box-shadow: 0 0 0 2px var(--surface), 0 0 10px var(--primary);
}

.m3-blog-archive__title-text {
	flex: 1 1 auto;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font: var(--m3e-type-body-large);
	font-size: 0.9375rem;
	font-weight: 600;
	color: var(--on-surface);
	line-height: 1.4;
	transition: color var(--m3e-duration-short) var(--m3e-easing-standard);
}

.m3-blog-archive__item:hover .m3-blog-archive__title-text {
	color: var(--primary);
}

@media (max-width: 639px) {
	.m3-blog-archive__group + .m3-blog-archive__group {
		margin-top: 1rem;
	}
	.m3-blog-archive__header {
		height: 2.75rem;
		padding: 0 0.35rem;
	}
	.m3-blog-archive__group-title {
		font-size: 1.15rem;
	}
	.m3-blog-archive__item {
		padding: 0.15rem 0.25rem;
		gap: 0.375rem;
		min-height: 2rem;
	}
	.m3-blog-archive__track {
		height: 2rem;
	}
	.m3-blog-archive__date {
		flex: 0 0 2.25rem;
		width: 2.25rem;
		font-size: 0.75rem;
	}
	.m3-blog-archive__title-text {
		font-size: 0.8125rem;
	}
}
</style>
