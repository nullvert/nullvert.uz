<script lang="ts">
import Icon from "@iconify/svelte";

let {
	icon = "material-symbols:inbox-outline-rounded",
	message = "Ничего не найдено",
}: {
	icon?: string;
	message?: string;
} = $props();
</script>

<div class="media-empty-state" role="status">
	<Icon {icon} aria-hidden="true" />
	<span>{message}</span>
</div>

<style lang="stylus">
.media-empty-state
	display: flex
	flex-direction: column
	align-items: center
	justify-content: center
	gap: 0.875rem
	min-height: 16rem
	padding: 3rem 1.5rem
	text-align: center
	color: var(--on-surface-variant)
	background: unquote("color-mix(in srgb, var(--surface-container-lowest) 50%, transparent)")
	border: 1px dashed var(--outline-variant)
	border-radius: var(--shape-corner-l)
	margin-top: 1rem

	:global(svg)
		width: 3rem
		height: 3rem
		opacity: 0.4
		color: var(--primary)

	span
		font: var(--m3e-type-body-large)
		color: var(--on-surface-variant)
		opacity: 0.85
</style>
