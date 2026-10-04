<script lang="ts">
import Switch from "@components/atoms/selection/Switch.svelte";
import type { Snippet } from "svelte";

interface Props {
	checked: boolean;
	title: string;
	icon: Snippet;
}

let { checked = $bindable(false), title, icon }: Props = $props();
</script>

<div
    class="m3e-switch-row"
    onclick={(e) => {
        if ((e.target as HTMLElement)?.closest('.m3-switch')) return;
        checked = !checked;
    }}
>
    <div class="m3e-switch-meta">
        <div class="m3e-switch-icon-wrap" aria-hidden="true">
            {@render icon()}
        </div>
        <span class="m3e-switch-title">{title}</span>
    </div>
    <Switch bind:checked label={title} icons />
</div>

<style lang="stylus">
    .m3e-switch-row
        display: flex
        align-items: center
        justify-content: space-between
        padding: 0.72rem 0.85rem
        cursor: pointer
        user-select: none
        border-radius: var(--shape-corner-s, 8px)
        transition: background-color var(--m3e-duration-short, 140ms) var(--m3e-easing-standard, ease)
        &:hover
            background: unquote("color-mix(in srgb, var(--on-surface) 4%, transparent)")

    .m3e-switch-meta
        display: flex
        align-items: center
        gap: 0.85rem
        min-width: 0

    .m3e-switch-icon-wrap
        width: 28px
        height: 28px
        border-radius: var(--shape-corner-full)
        background: var(--surface-container-high)
        display: flex
        align-items: center
        justify-content: center
        flex-shrink: 0

    .m3e-switch-title
        font-size: 0.8125rem
        font-weight: 500
        letter-spacing: 0.012em
        line-height: 1.4
        color: var(--on-surface)
</style>
