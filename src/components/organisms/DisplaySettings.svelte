<script lang="ts">
import Slider from "@components/atoms/selection/Slider.svelte";
import SettingSwitchRow from "./display-settings/SettingSwitchRow.svelte";
import RightSideDrawer from "../molecules/RightSideDrawer.svelte";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { DISPLAY_LABEL, localLabel } from "./display-settings/labels";
import Icon from "@iconify/svelte";
import {
	defaultMode,
	flipToMode,
	getStoredMode,
	LAYOUT_MODE_CHANGE_EVENT,
	storeMode,
} from "@utils/layout-mode";
import {
	type McSpec,
	type McStyle,
	resolveScheme,
} from "@utils/mc-utils";
import {
	getDefaultHue,
	getDefaultTextureOpacity,
	getDefaultTexturePreset,
	getHue,
	getMotionPreference,
	getStoredTextureOpacity,
	getStoredTexturePreset,
	setHue,
	setMotionPreference,
	setTextureOpacity,
	setTexturePreset,
	setWallpaperMode,
} from "@utils/setting-utils";
import { getStyle, setSpec, setStyle } from "@utils/theme-utils";
import { onMount } from "svelte";
import { getDefaultStyle, postListConfig } from "@/config";
import type { PostListMode } from "@/types/postListConfig";
import type { TexturePreset } from "@/types/textureConfig";

let { class: className = "" }: { class?: string } = $props();

const defaultHue = getDefaultHue();
const ALLOWED_STYLES: readonly McStyle[] = ["tonalSpot", "vibrant", "neutral"] as const;
const defaultStyle = (ALLOWED_STYLES.includes(getDefaultStyle() as McStyle)
	? getDefaultStyle()
	: "tonalSpot") as McStyle;
const spec: McSpec = "2025";

let hue = $state(getHue());
let style = $state<McStyle>(
	ALLOWED_STYLES.includes(getStyle()) ? getStyle() : defaultStyle,
);
let dark = $state(
	typeof document !== "undefined" &&
		document.documentElement.classList.contains("dark"),
);

let motionReduced = $state(false);
let isMobile = $state(false);
let isDrawerOpen = $state(false);

// Вид списка статей (list / grid)
const defaultLayoutMode = postListConfig?.layout?.mode || defaultMode();
let postListMode = $state<PostListMode>(getStoredMode());
let lastAppliedMode = postListMode;
let isHomePage = $state(
	typeof window !== "undefined"
		? window.location.pathname === "/" || window.location.pathname === ""
		: true,
);

// Текстура фона (3 варианта: none / starlight / sakura)
const defaultTexturePreset = getDefaultTexturePreset();
const defaultTextureOpacity = getDefaultTextureOpacity();
const ALLOWED_TEXTURES: readonly TexturePreset[] = ["none", "starlight", "sakura"] as const;
let texturePreset = $state<TexturePreset>(
	ALLOWED_TEXTURES.includes(getStoredTexturePreset())
		? getStoredTexturePreset()
		: (ALLOWED_TEXTURES.includes(defaultTexturePreset) ? defaultTexturePreset : "none"),
);
let lastAppliedTexturePreset = texturePreset;
let textureOpacity = $state<number>(getStoredTextureOpacity());



const textureOptions: {
	value: TexturePreset;
	labelKey: I18nKey;
}[] = [
	{
		value: "none",
		labelKey: I18nKey.texturePresetNone,
	},
	{
		value: "starlight",
		labelKey: I18nKey.texturePresetStarlight,
	},
	{
		value: "sakura",
		labelKey: I18nKey.texturePresetSakura,
	},
];

onMount(() => {
	const observer = new MutationObserver(() => {
		dark = document.documentElement.classList.contains("dark");
	});
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});
	motionReduced = getMotionPreference();

	// Фон всегда сплошной, спецификация M3E 2025
	setWallpaperMode("none");
	setSpec("2025");

	if (typeof window !== "undefined") {


		const storedMode = localStorage.getItem("post-list-mode");
		if (storedMode === "list" || storedMode === "grid") {
			postListMode = storedMode;
		} else {
			postListMode = defaultLayoutMode;
		}
	}

	const mql = window.matchMedia("(max-width: 1023px)");
	isMobile = mql.matches;
	const onResize = (e: MediaQueryListEvent) => {
		isMobile = e.matches;
		if (!isMobile) {
			isDrawerOpen = false;
		}
	};
	mql.addEventListener("change", onResize);

	const onToggleSettings = (e: Event) => {
		if (isMobile) {
			isDrawerOpen = !isDrawerOpen;
		} else {
			const panel = document.getElementById("display-setting");
			panel?.classList.toggle("float-panel-closed");
		}
	};
	document.addEventListener("display-settings:toggle", onToggleSettings);

	const syncHomePage = () => {
		const swupContainer = document.getElementById("swup-container");
		const pageAttr = swupContainer?.getAttribute("data-current-page") || document.body.dataset.currentPage;
		if (pageAttr) {
			isHomePage = pageAttr === "home";
		} else {
			const path = window.location.pathname.replace(/\/+$/, "") || "/";
			isHomePage = path === "/";
		}
	};
	syncHomePage();

	document.addEventListener("swup:page:view", syncHomePage);
	document.addEventListener("swup:content:replace", syncHomePage);
	window.addEventListener("popstate", syncHomePage);

	return () => {
		observer.disconnect();
		mql.removeEventListener("change", onResize);
		document.removeEventListener("display-settings:toggle", onToggleSettings);
		document.removeEventListener("swup:page:view", syncHomePage);
		document.removeEventListener("swup:content:replace", syncHomePage);
		window.removeEventListener("popstate", syncHomePage);
	};
});

/** Сброс к умолчаниям */
function confirmReset() {
	hue = defaultHue;
	style = defaultStyle;
	postListMode = defaultLayoutMode;
	texturePreset = defaultTexturePreset;
	textureOpacity = defaultTextureOpacity;
	setSpec("2025");
}

/** Есть ли изменённые параметры */
const isDirty = $derived(
	hue !== defaultHue ||
		style !== defaultStyle ||
		postListMode !== defaultLayoutMode ||
		texturePreset !== defaultTexturePreset ||
		textureOpacity !== defaultTextureOpacity,
);

$effect(() => {
	if (hue || hue === 0) setHue(hue);
});
$effect(() => {
	setStyle(style);
});
$effect(() => {
	setMotionPreference(motionReduced);
});
$effect(() => {
	if (texturePreset === lastAppliedTexturePreset) return;
	lastAppliedTexturePreset = texturePreset;
	setTexturePreset(texturePreset);
});
$effect(() => {
	setTextureOpacity(textureOpacity);
});
$effect(() => {
	if (postListMode === lastAppliedMode) return;
	lastAppliedMode = postListMode;
	storeMode(postListMode);
	window.dispatchEvent(
		new CustomEvent(LAYOUT_MODE_CHANGE_EVENT, {
			detail: { layout: postListMode },
		}),
	);
	const container = document.getElementById("post-list");
	if (container) flipToMode(container, postListMode);
});




function styleKey(s: McStyle): I18nKey {
	switch (s) {
		case "tonalSpot":
			return I18nKey.styleTonalSpot;
		case "vibrant":
			return I18nKey.styleVibrant;
		case "neutral":
			return I18nKey.styleNeutral;
		default:
			return I18nKey.styleTonalSpot;
	}
}

function styleColors(s: McStyle, h: number, d: boolean, sp: McSpec) {
	const scheme = resolveScheme(h, d, s, sp);
	return {
		primary: scheme.primary ?? "#888",
		secondary: scheme.secondary ?? "#888",
		tertiary: scheme.tertiary ?? "#888",
	};
}

const currentColor = $derived(styleColors(style, hue, dark, spec).primary);

const stylePreviews = $derived(
	ALLOWED_STYLES.map((s) => ({
		style: s,
		label: i18n(styleKey(s)),
		colors: styleColors(s, hue, dark, spec),
	})),
);
</script>

{#snippet settingsContent()}
    <!-- 1. Заголовок и оттенок темы (Hue) -->
    <div class="flex flex-col gap-2">
        <div class="flex flex-row gap-2 items-center justify-between">
            <div class="flex items-center gap-2 font-medium text-sm tracking-[0.015em] text-[var(--on-surface)]">
                <span>{i18n(I18nKey.themeColor)}</span>
                <button aria-label={localLabel(DISPLAY_LABEL.resetDefault, "Reset to default")} class="float-control w-6 h-6 rounded-md active:scale-90 will-change-transform flex items-center justify-center text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors"
                        class:opacity-0={!isDirty} class:pointer-events-none={!isDirty} onclick={confirmReset}>
                    <Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.75rem]"></Icon>
                </button>
            </div>
            <div class="m3e-value-badge" title={i18n(I18nKey.themeColor)}>
                <span class="m3e-color-swatch" style={`background: ${currentColor};`}></span>
                <span class="m3e-value-text">{hue}°</span>
            </div>
        </div>
        <Slider bind:value={hue} min={0} max={360} step={5} label={i18n(I18nKey.themeColor)} />
    </div>

    <!-- 2. Текстура фона (M3 Secondary Tabs: Без узора, Звёзды, Снежинки) — поднято выше -->
    <div class="flex flex-col gap-1.5">
        <span class="display-settings__section-label">{i18n(I18nKey.texturePreset)}</span>
        <div class="m3e-segmented-group" role="tablist" aria-label={i18n(I18nKey.texturePreset)}>
            {#each textureOptions as opt (opt.value)}
                <button
                    type="button"
                    role="tab"
                    aria-selected={texturePreset === opt.value}
                    tabindex={texturePreset === opt.value ? 0 : -1}
                    title={i18n(opt.labelKey)}
                    aria-label={i18n(opt.labelKey)}
                    class="m3e-segment"
                    class:selected={texturePreset === opt.value}
                    onclick={() => (texturePreset = opt.value)}
                >
                    {#if opt.value === "none"}
                        <svg viewBox="0 0 24 24" class="w-4 h-4 flex-shrink-0" fill="currentColor" aria-hidden="true">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c1.93 0 3.68.68 5.06 1.81L5.81 17.06C4.68 15.68 4 13.93 4 12c0-4.42 3.58-8 8-8zm0 16c-1.93 0-3.68-.68-5.06-1.81L18.19 6.94C19.32 8.32 20 10.07 20 12c0 4.42-3.58 8-8 8z"/>
                        </svg>
                    {:else if opt.value === "starlight"}
                        <svg viewBox="0 0 24 24" class="w-4 h-4 flex-shrink-0" fill="currentColor" aria-hidden="true">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-4h4v4zm0-6H4v-4h4v4zm0-6H4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4z"/>
                        </svg>
                    {:else}
                        <svg viewBox="0 0 24 24" class="w-4 h-4 flex-shrink-0" fill="currentColor" aria-hidden="true">
                            <path d="M11 22v-4.15l-3.25 3.2l-1.4-1.4L11 15v-2H9l-4.65 4.65l-1.4-1.4L6.15 13H2v-2h4.15l-3.2-3.25l1.4-1.4L9 11h2V9L6.35 4.35l1.4-1.4L11 6.15V2h2v4.15l3.25-3.2l1.4 1.4L13 9v2h2l4.65-4.65l1.4 1.4l-3.2 3.25H22v2h-4.15l3.2 3.25l-1.4 1.4L15 13h-2v2l4.65 4.65l-1.4 1.4l-3.25-3.2V22z"/>
                        </svg>
                    {/if}
                    <span class="m3e-segment-label">{i18n(opt.labelKey)}</span>
                </button>
            {/each}
        </div>
    </div>

    <!-- 3. Палитра (M3 Secondary Tabs: Тональный, Яркий, Нейтрал) -->
    <div class="flex flex-col gap-1.5">
        <span class="display-settings__section-label">{i18n(I18nKey.colorStyle)}</span>
        <div class="m3e-segmented-group" role="tablist" aria-label={i18n(I18nKey.colorStyle)}>
            {#each stylePreviews as p (p.style)}
                <button
                    type="button"
                    role="tab"
                    aria-selected={style === p.style}
                    tabindex={style === p.style ? 0 : -1}
                    title={p.label}
                    class="m3e-segment"
                    class:selected={style === p.style}
                    onclick={() => (style = p.style)}
                >
                    <span class="m3e-palette-disc" aria-hidden="true"
                          style={`background: conic-gradient(${p.colors.primary} 0deg 120deg, ${p.colors.secondary} 120deg 240deg, ${p.colors.tertiary} 240deg 360deg);`}></span>
                    <span class="m3e-segment-label">{p.label}</span>
                </button>
            {/each}
        </div>
    </div>

    <!-- 4. Вид списка статей (M3 Secondary Tabs: Список / Сетка) — только для главной страницы -->
    {#if isHomePage}
        <div class="flex flex-col gap-1.5">
            <span class="display-settings__section-label">{i18n(I18nKey.layoutMode)}</span>
            <div class="m3e-segmented-group" role="tablist" aria-label={i18n(I18nKey.layoutMode)}>
                <button
                    type="button"
                    role="tab"
                    aria-selected={postListMode === "list"}
                    tabindex={postListMode === "list" ? 0 : -1}
                    class="m3e-segment"
                    class:selected={postListMode === "list"}
                    onclick={() => (postListMode = "list")}
                >
                    <svg viewBox="0 0 24 24" class="w-4 h-4 flex-shrink-0" fill="currentColor" aria-hidden="true">
                        <path d="M4 9q-.425 0-.712-.288T3 8V6q0-.425.288-.712T4 5h2q.425 0 .713.288T7 6v2q0 .425-.288.713T6 9zm5 0q-.425 0-.712-.288T8 8V6q0-.425.288-.712T9 5h11q.425 0 .713.288T21 6v2q0 .425-.288.713T20 9zm0 5q-.425 0-.712-.288T8 13v-2q0-.425.288-.712T9 10h11q.425 0 .713.288T21 11v2q0 .425-.288.713T20 14zm0 5q-.425 0-.712-.288T8 18v-2q0-.425.288-.712T9 15h11q.425 0 .713.288T21 16v2q0 .425-.288.713T20 19zm-5 0q-.425 0-.712-.288T3 18v-2q0-.425.288-.712T4 15h2q.425 0 .713.288T7 16v2q0 .425-.288.713T6 19zm0-5q-.425 0-.712-.288T3 13v-2q0-.425.288-.712T4 10h2q.425 0 .713.288T7 11v2q0 .425-.288.713T6 14z"/>
                    </svg>
                    <span class="m3e-segment-label">{i18n(I18nKey.layoutList)}</span>
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={postListMode === "grid"}
                    tabindex={postListMode === "grid" ? 0 : -1}
                    class="m3e-segment"
                    class:selected={postListMode === "grid"}
                    onclick={() => (postListMode = "grid")}
                >
                    <svg viewBox="0 0 24 24" class="w-4 h-4 flex-shrink-0" fill="currentColor" aria-hidden="true">
                        <path d="M5 11q-.825 0-1.412-.587T3 9V5q0-.825.588-1.412T5 3h4q.825 0 1.413.588T11 5v4q0 .825-.587 1.413T9 11zm0 10q-.825 0-1.412-.587T3 19v-4q0-.825.588-1.412T5 13h4q.825 0 1.413.588T11 15v4q0 .825-.587 1.413T9 21zm10-10q-.825 0-1.412-.587T13 9V5q0-.825.588-1.412T15 3h4q.825 0 1.413.588T21 5v4q0 .825-.587 1.413T19 11zm0 10q-.825 0-1.412-.587T13 19v-4q0-.825.588-1.412T15 13h4q.825 0 1.413.588T21 15v4q0 .825-.587 1.413T19 21z"/>
                    </svg>
                    <span class="m3e-segment-label">{i18n(I18nKey.layoutGrid)}</span>
                </button>
            </div>
        </div>
    {/if}

    <!-- 5. Переключатели: Уменьшение движения и Аудиоплеер (в единой элегантной карточке) -->
    <div class="m3e-switches-card">
        <SettingSwitchRow bind:checked={motionReduced} title={i18n(I18nKey.reduceMotion)}>
            {#snippet icon()}
                <svg viewBox="0 0 24 24" class="w-4 h-4 text-[var(--primary)]" fill="currentColor">
                    <path d="m10.65 15.75l4.875-3.125q.35-.225.35-.625t-.35-.625L10.65 8.25q-.375-.25-.763-.038t-.387.663v6.25q0 .45.388.663t.762-.038M3.025 13q.425 0 .763.275t.462.7q.15.575.363 1.088t.487 1.012q.225.375.188.8t-.338.725q-.275.275-.675.25t-.625-.35q-.55-.775-.925-1.662T2.15 14q-.075-.4.188-.7t.687-.3M4.95 6.4q.3.3.325.725T5.1 7.9q-.275.5-.487 1.025t-.363 1.1q-.125.425-.462.7T3.025 11t-.687-.312t-.163-.713q.2-.95.575-1.837t.9-1.663q.225-.325.625-.337t.675.262m1.4 12.625q.3-.325.738-.35t.812.2q.5.275 1.013.5t1.062.375q.425.125.7.45t.275.75t-.312.675t-.713.175q-.95-.2-1.788-.575T6.5 20.35q-.35-.225-.387-.625t.237-.7M11 3.05q0 .425-.262.75t-.688.45q-.575.15-1.1.363t-1.025.512q-.375.225-.812.188t-.738-.338t-.262-.712t.387-.638q.8-.5 1.663-.862T9.974 2.2q.4-.075.713.175T11 3.05M20 12q0-2.825-1.737-4.988T13.825 4.2q-.375-.1-.6-.425T13 3.05t.275-.662t.625-.188q3.5.7 5.8 3.425T22 12t-2.3 6.375t-5.8 3.425q-.35.075-.625-.187T13 20.95t.225-.725t.6-.425q2.7-.65 4.438-2.812T20 12"/>
                </svg>
            {/snippet}
        </SettingSwitchRow>
    </div>
{/snippet}

<!-- Десктопная панель: выпадающий float-panel сверху (>= 1024px) -->
<div id="display-setting" class="float-panel float-panel-closed absolute transition-all w-96 max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain m3-scroll-contain hidden lg:block {className}">
    <div class="p-4 flex flex-col gap-4">
        {@render settingsContent()}
    </div>
</div>

<!-- Мобильная шторка: RightSideDrawer справа (< 1024px) -->
<RightSideDrawer
    bind:open={isDrawerOpen}
    title={i18n(I18nKey.themeColor)}
    ariaLabel={i18n(I18nKey.themeColor)}
>
    {#snippet headerIcon()}
        <svg class="w-6 h-6 shrink-0 text-[var(--primary)]" style="width: 1.5rem; height: 1.5rem;" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
    {/snippet}
    <div class="flex flex-col gap-5">
        {@render settingsContent()}
    </div>

    {#snippet footer()}
        <div class="m3-drawer-footer">
            <details class="m3-drawer-footer__details group">
                <summary class="m3-drawer-footer__summary" aria-label="Подробнее" title="Подробнее">
                    <span class="m3-drawer-footer__copyright">
                        &copy; All Rights Reserved
                    </span>
                    <svg class="m3-drawer-footer__chevron" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                    </svg>
                </summary>

                <div class="m3-drawer-footer__content">
                    <div class="m3-drawer-footer__links">
                        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer" class="hover:text-[var(--primary)] transition-colors">CC BY-NC-SA 4.0</a>
                        <span class="opacity-40">·</span>
                        <a href="/rss/" class="hover:text-[var(--primary)] transition-colors">RSS</a>
                        <span class="opacity-40">·</span>
                        <a href="/atom/" class="hover:text-[var(--primary)] transition-colors">Atom</a>
                        <span class="opacity-40">·</span>
                        <a href="/sitemap-index.xml" target="_blank" rel="noopener noreferrer" class="hover:text-[var(--primary)] transition-colors">Sitemap</a>
                    </div>
                    <div class="m3-drawer-footer__powered">
                        Powered by <a href="https://astro.build" target="_blank" rel="noopener noreferrer" class="hover:text-[var(--primary)] transition-colors">Astro</a> &amp; <a href="https://github.com/LyraVoid/Shirone" target="_blank" rel="noopener noreferrer" class="hover:text-[var(--primary)] transition-colors">Shirone</a> <span class="opacity-40">·</span> v0.1.5
                    </div>
                </div>
            </details>
        </div>
    {/snippet}
</RightSideDrawer>

<style lang="stylus">
    /* ── Футер внутри шторки параметров ── */
    .m3-drawer-footer
        width: 100%
        display: flex
        flex-direction: column
        align-items: center

    .m3-drawer-footer__details
        width: 100%
        cursor: pointer

    .m3-drawer-footer__summary
        display: flex
        align-items: center
        justify-content: center
        gap: 0.35rem
        list-style: none
        user-select: none
        outline: none
        color: var(--on-surface-variant)
        opacity: 0.75
        transition: opacity var(--m3e-duration-short) ease, color var(--m3e-duration-short) ease

        &::-webkit-details-marker
            display: none

        &:hover
            opacity: 1
            color: var(--on-surface)

    .m3-drawer-footer__copyright
        font: var(--m3e-type-label-medium)
        font-size: 0.75rem
        letter-spacing: 0.02em

    .m3-drawer-footer__chevron
        width: 1.1rem
        height: 1.1rem
        transition: transform var(--m3e-duration-medium) var(--m3e-easing-standard)

    .m3-drawer-footer__details[open] .m3-drawer-footer__chevron
        transform: rotate(180deg)

    .m3-drawer-footer__content
        display: flex
        flex-direction: column
        align-items: center
        gap: 0.35rem
        padding-top: 0.65rem
        font-size: 0.75rem
        color: var(--on-surface-variant)
        text-align: center

    .m3-drawer-footer__links
        display: flex
        flex-wrap: wrap
        align-items: center
        justify-content: center
        gap: 0.4rem

        a
            color: var(--on-surface-variant)
            text-decoration: none
            transition: color var(--m3e-duration-short) ease

    .m3-drawer-footer__powered
        font-size: 0.7rem
        opacity: 0.65
        margin-top: 0.15rem

        a
            color: inherit
            text-decoration: none
            border-bottom: 1px dotted currentColor

    .display-settings__section-label
        font-size: 0.8125rem
        font-weight: 600
        letter-spacing: 0.015em
        line-height: 1.4
        color: var(--on-surface-variant)
        margin-left: 0.25rem

    /* ── M3 Slider Value Indicator ── */
    .m3e-value-badge
        display: inline-flex
        align-items: center
        gap: 0.5rem
        height: 1.75rem
        padding: 0 0.65rem 0 0.45rem
        border-radius: var(--shape-corner-full)
        background: var(--surface-container-high)
        border: 1px solid unquote("color-mix(in srgb, var(--outline-variant) 30%, transparent)")

    .m3e-color-swatch
        width: 1rem
        height: 1rem
        border-radius: var(--shape-corner-full)
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.15)
        flex-shrink: 0

    .m3e-value-text
        font-size: 0.8125rem
        font-weight: 600
        font-variant-numeric: tabular-nums
        color: var(--on-surface)
        letter-spacing: 0.015em
        line-height: 1.4

    /* ── Единый стандарт M3E Segmented Controls для всех переключателей ── */
    .m3e-segmented-group
        display: flex
        align-items: stretch
        width: 100%
        height: 2.75rem
        padding: 4px
        gap: 4px
        border-radius: var(--shape-corner-m, 12px)
        background: var(--surface-container)
        border: 1px solid unquote("color-mix(in srgb, var(--outline-variant) 30%, transparent)")
        box-sizing: border-box

        @media (max-width: 639px)
            height: auto
            flex-direction: column
            padding: 4px
            gap: 4px

    .m3e-segment
        flex: 1 1 0
        min-width: 0
        height: 100%
        display: inline-flex
        align-items: center
        justify-content: center
        gap: 0.4rem
        padding: 0 0.35rem
        border: none
        border-radius: calc(var(--shape-corner-m, 12px) - 2px)
        background: transparent
        color: var(--on-surface-variant)
        font-size: 0.8125rem
        font-weight: 500
        letter-spacing: 0.01em
        line-height: 1.2
        cursor: pointer
        user-select: none
        white-space: nowrap
        transition: background-color var(--m3e-duration-short, 140ms) var(--m3e-easing-standard, ease),
                    color var(--m3e-duration-short, 140ms) var(--m3e-easing-standard, ease),
                    box-shadow var(--m3e-duration-short, 140ms) var(--m3e-easing-standard, ease)

        @media (max-width: 639px)
            width: 100%
            height: 2.625rem
            padding: 0 1rem
            justify-content: center

        &:hover:not(.selected)
            background: unquote("color-mix(in srgb, var(--on-surface) 6%, transparent)")
            color: var(--on-surface)

        &.selected
            background: var(--secondary-container)
            color: var(--on-secondary-container)
            font-weight: 600
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08)

    .m3e-segment-label
        flex-shrink: 0
        white-space: nowrap

    /* ── Компактный круговой диск цветов палитры (M3 Palette Disc) ── */
    .m3e-palette-disc
        width: 12px
        height: 12px
        border-radius: var(--shape-corner-full)
        box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.25)
        flex-shrink: 0

    /* ── Единая карточка переключателей (Switch Card) ── */
    .m3e-switches-card
        display: flex
        flex-direction: column
        border-radius: var(--shape-corner-m, 12px)
        background: var(--surface-container)
        border: 1px solid unquote("color-mix(in srgb, var(--outline-variant) 30%, transparent)")
        overflow: hidden
        margin-top: 0.25rem

    .m3e-switch-divider
        height: 1px
        background: unquote("color-mix(in srgb, var(--outline-variant) 25%, transparent)")
        margin: 0 1rem

    :global(#display-setting.m3-scroll-contain)
        scrollbar-width: thin
        scrollbar-color: var(--scrollbar-bg) transparent
        -webkit-overflow-scrolling: touch
        &::-webkit-scrollbar
            width: 0.375rem
        &::-webkit-scrollbar-track
            background: transparent
        &::-webkit-scrollbar-thumb
            background: var(--scrollbar-bg)
            border-radius: var(--shape-corner-full)
            &:hover
                background: var(--scrollbar-bg-hover)
            &:active
                background: var(--scrollbar-bg-active)
</style>
