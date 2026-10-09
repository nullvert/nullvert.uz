<script lang="ts">
/**
 * Переопределение SiteNavigationDrawer для блога (nv://blog).
 * - Добавлена кнопка закрытия меню (Close icon button).
 * - Полноценные Material Symbols иконки (включая Tags "material-symbols:label-outline-rounded").
 * - z-index поднят выше нижнего плеера (z-index: 120), чтобы мобильное меню открывалось поверх всего.
 */
import Icon from "@iconify/svelte";
import { addIcon } from "@iconify/svelte/dist/functions";
import { resolveNavBarLinks, resolvePageKey } from "@utils/nav-utils";
import { url } from "@utils/url-utils";
import { onMount, tick } from "svelte";
import { siteConfig } from "@/config";
import { navBarConfig } from "@/config/navBarConfig";

// Гарантируем регистрацию иконки тегов в Iconify
try {
	addIcon("material-symbols:label-outline-rounded", {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h11q.475 0 .9.213t.7.587l4.5 6q.4.525.4 1.2t-.4 1.2l-4.5 6q-.275.375-.7.588T15 20zm0-2h11l4.5-6L15 6H4zm7.75-6"/>',
	});
} catch {}

let open = $state(false);
let activePrimary = $state("");
const openGroups = $state<Record<string, boolean>>({});

const links = resolveNavBarLinks(navBarConfig.links);

const primaryItems = links.map((link) => {
	const key = link.name.toLowerCase();
	let iconName = link.icon;
	if (link.pageKey === "tags" || key.includes("тег") || key.includes("tag") || link.url?.includes("/tags")) {
		iconName = link.icon || "material-symbols:label-outline-rounded";
	}

	return {
		value: key,
		label: link.name,
		icon: iconName,
		href: link.url ? (link.external ? link.url : url(link.url)) : undefined,
		external: !!link.external,
		pageKey: link.pageKey ?? "",
		children: link.children?.map((child) => ({
			value: child.name.toLowerCase(),
			label: child.name,
			icon: child.icon,
			href: child.url
				? child.external
					? child.url
					: url(child.url)
				: undefined,
			external: !!child.external,
			pageKey: child.pageKey ?? "",
		})),
	};
});

function syncFromRoute() {
	const pageKey = resolvePageKey(new URL(window.location.href));
	activePrimary = "";
	for (const item of primaryItems) {
		if (item.pageKey && item.pageKey === pageKey) {
			activePrimary = item.value;
			break;
		}
		const activeChild = item.children?.find(
			(child) => child.pageKey && child.pageKey === pageKey,
		);
		if (activeChild) {
			activePrimary = activeChild.value;
			openGroups[item.value] = true;
			break;
		}
	}
}

function handleNavClick() {
	open = false;
}

function toggleGroup(group: string) {
	openGroups[group] = !openGroups[group];
}

onMount(() => {
	syncFromRoute();
	const onToggle = () => {
		open = !open;
		if (open) {
			tick().then(() => {
				drawerEl?.querySelector<HTMLElement>("a, button")?.focus();
			});
		}
	};
	const onKey = (e: KeyboardEvent) => {
		if (e.key === "Escape") open = false;
	};
	document.addEventListener("site-drawer:toggle", onToggle);
	document.addEventListener("swup:content:replace", syncFromRoute);
	window.addEventListener("keydown", onKey);
	return () => {
		document.removeEventListener("site-drawer:toggle", onToggle);
		document.removeEventListener("swup:content:replace", syncFromRoute);
		window.removeEventListener("keydown", onKey);
	};
});

let drawerEl: HTMLElement | undefined = $state();
</script>

<div
	class="site-drawer"
	class:site-drawer--open={open}
>
	<div class="site-drawer__scrim" aria-hidden="true" onclick={() => (open = false)}></div>
	<aside
		bind:this={drawerEl}
		class="site-drawer__panel"
		role="dialog"
		aria-modal="true"
		aria-label={siteConfig.title}
	>
		<div class="site-drawer__header">
			<div class="site-drawer__brand">
				<div class="site-drawer__title">{siteConfig.title}</div>
				{#if siteConfig.subtitle}
					<div class="site-drawer__subtitle">{siteConfig.subtitle}</div>
				{/if}
			</div>
			<button
				type="button"
				class="site-drawer__close-btn m3-state-layer"
				onclick={() => (open = false)}
				aria-label="Закрыть меню"
				title="Закрыть"
			>
				<Icon icon="material-symbols:close-rounded" />
			</button>
		</div>

		<nav class="site-drawer__nav" aria-label="Navigation drawer">
			{#each primaryItems as item (item.value)}
				{#if item.children}
					<div class="site-drawer__group">
						<button
							type="button"
							class="site-drawer__group-head"
							class:site-drawer__item--active={item.children.some((child) => activePrimary === child.value)}
							onclick={() => toggleGroup(item.value)}
							aria-expanded={openGroups[item.value] ?? false}
						>
							{#if item.icon}
								<span class="site-drawer__group-icon" aria-hidden="true">
									<Icon icon={item.icon} />
								</span>
							{/if}
							<span class="site-drawer__group-label">{item.label}</span>
							<Icon
								class={openGroups[item.value] ? "site-drawer__group-arrow site-drawer__group-arrow--open" : "site-drawer__group-arrow"}
								icon="material-symbols:keyboard-arrow-down"
							/>
						</button>
						{#if openGroups[item.value]}
							<div class="site-drawer__group-body">
								{#each item.children as child (child.value)}
									<a
										href={child.href}
										class="site-drawer__item site-drawer__item--child"
										class:site-drawer__item--active={activePrimary === child.value}
										aria-current={activePrimary === child.value ? "page" : undefined}
										target={child.external ? "_blank" : undefined}
										rel={child.external ? "noopener noreferrer" : undefined}
										onclick={handleNavClick}
									>
										{#if child.icon}
											<span class="site-drawer__item-icon" aria-hidden="true">
												<Icon icon={child.icon} />
											</span>
										{/if}
										<span class="site-drawer__item-label">{child.label}</span>
									</a>
								{/each}
							</div>
						{/if}
					</div>
				{:else if item.href}
					<a
						href={item.href}
						class="site-drawer__item"
						class:site-drawer__item--active={activePrimary === item.value}
						aria-current={activePrimary === item.value ? "page" : undefined}
						target={item.external ? "_blank" : undefined}
						rel={item.external ? "noopener noreferrer" : undefined}
						onclick={handleNavClick}
					>
						{#if item.icon === "material-symbols:label-outline-rounded"}
							<span class="site-drawer__item-icon" aria-hidden="true">
								<svg xmlns="http://www.w3.org/2000/svg" width="1.35rem" height="1.35rem" viewBox="0 0 24 24">
									<path fill="currentColor" d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h11q.475 0 .9.213t.7.587l4.5 6q.4.525.4 1.2t-.4 1.2l-4.5 6q-.275.375-.7.588T15 20zm0-2h11l4.5-6L15 6H4zm7.75-6"/>
								</svg>
							</span>
						{:else if item.icon}
							<span class="site-drawer__item-icon" aria-hidden="true">
								<Icon icon={item.icon} />
							</span>
						{/if}
						<span class="site-drawer__item-label">{item.label}</span>
					</a>
				{/if}
			{/each}
		</nav>
	</aside>
</div>

<style lang="stylus">
.site-drawer
	position: fixed
	inset: 0
	z-index: 120
	visibility: hidden
	pointer-events: none

	&--open
		visibility: visible
		pointer-events: auto

	&__scrim
		position: absolute
		inset: 0
		background: unquote("color-mix(in srgb, var(--scrim, #000) 65%, transparent)")
		backdrop-filter: blur(8px)
		-webkit-backdrop-filter: blur(8px)
		opacity: 0
		transition: opacity var(--m3e-duration-medium) var(--m3e-easing-standard)

	&--open &__scrim
		opacity: 1

	&__panel
		position: absolute
		top: 0
		bottom: 0
		left: 0
		display: flex
		flex-direction: column
		width: 320px
		max-width: 85vw
		box-sizing: border-box
		background: var(--surface-container-low)
		color: var(--on-surface)
		border-radius: 0 var(--shape-corner-xl, 28px) var(--shape-corner-xl, 28px) 0
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4)
		transform: translateX(-100%)
		transition: transform var(--m3e-duration-long) var(--m3e-easing-emphasized-decelerate)
		z-index: 1

	&--open &__panel
		transform: translateX(0)

	&__header
		display: flex
		align-items: center
		justify-content: space-between
		padding: var(--m3e-space-4) var(--m3e-space-4) var(--m3e-space-2) var(--m3e-space-5)
		flex: none

	&__brand
		flex: 1
		min-width: 0

	&__title
		font: var(--m3e-type-title-large)
		color: var(--on-surface)
		font-weight: 700

	&__subtitle
		margin-top: 2px
		font: var(--m3e-type-body-small)
		color: var(--on-surface-variant)

	&__close-btn
		display: flex
		align-items: center
		justify-content: center
		width: 40px
		height: 40px
		border: none
		border-radius: var(--shape-corner-full, 9999px)
		background: transparent
		color: var(--on-surface-variant)
		cursor: pointer
		transition: background-color var(--m3e-duration-short) ease, color var(--m3e-duration-short) ease

		&:hover
			background: unquote("color-mix(in oklab, var(--on-surface) 8%, transparent)")
			color: var(--on-surface)

		> :global(svg)
			width: 1.35rem
			height: 1.35rem

	&__nav
		flex: 1
		overflow-y: auto
		padding: var(--m3e-space-2) var(--m3e-space-3) var(--m3e-space-4)

	&__item
		display: flex
		align-items: center
		gap: var(--m3e-space-3)
		width: 100%
		min-height: 52px
		box-sizing: border-box
		padding: 0 var(--m3e-space-4)
		border-radius: var(--shape-corner-full, 9999px)
		color: var(--on-surface-variant)
		text-decoration: none
		cursor: pointer
		transition:
			background-color var(--m3e-duration-short) var(--m3e-easing-standard),
			color var(--m3e-duration-short) var(--m3e-easing-standard)

		&:hover
			background: unquote("color-mix(in oklab, var(--on-surface) 8%, transparent)")
			color: var(--on-surface)

		&:focus-visible
			outline: 2px solid var(--secondary)
			outline-offset: -2px

		&--active
			background: var(--secondary-container)
			color: var(--on-secondary-container)
			font-weight: 600
			&:hover
				background: var(--secondary-container)

		&--child
			min-height: 44px
			padding-left: var(--m3e-space-8)

	&__item-icon
		display: flex
		flex: none
		color: var(--on-surface-variant)
		> :global(svg)
			width: 1.35rem
			height: 1.35rem

	&__item--active &__item-icon
		color: var(--on-secondary-container)

	&__item-label
		flex: 1
		min-width: 0
		font: var(--m3e-type-label-large)
		white-space: nowrap
		overflow: hidden
		text-overflow: ellipsis

	&__item--child &__item-label
		font: var(--m3e-type-body-medium)

	&__group
		margin-top: 4px

	&__group-head
		display: flex
		align-items: center
		gap: 12px
		width: 100%
		min-height: 52px
		box-sizing: border-box
		padding: 0 16px
		border: none
		border-radius: var(--shape-corner-full, 9999px)
		background: none
		color: var(--on-surface-variant)
		cursor: pointer
		transition: background-color var(--m3e-duration-short) var(--m3e-easing-standard)
		&:hover
			background: unquote("color-mix(in oklab, var(--on-surface) 8%, transparent)")
		&:focus-visible
			outline: 2px solid var(--secondary)
			outline-offset: -2px

	&__group-icon
		display: flex
		flex: none
		> :global(svg)
			width: 1.35rem
			height: 1.35rem

	&__group-label
		flex: 1
		text-align: left
		font: var(--m3e-type-label-large)
		color: var(--on-surface-variant)

	&__group-arrow
		display: flex
		flex: none
		transition: transform var(--m3e-duration-short) var(--m3e-easing-standard)
		> :global(svg)
			width: 1.25rem
			height: 1.25rem

		&--open
			transform: rotate(180deg)

	&__group-body
		padding: 4px 0 8px
</style>
