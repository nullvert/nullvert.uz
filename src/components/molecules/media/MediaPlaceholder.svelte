<script lang="ts">
	import Icon from "@iconify/svelte";

	let {
		aspect = "poster",
		title = "",
	}: {
		aspect?: "poster" | "landscape" | "game";
		title?: string;
	} = $props();
</script>

<div class="media-card__placeholder" aria-hidden="true">
	<div class="media-card__placeholder-glow"></div>
	<div class="media-card__placeholder-content">
		<Icon
			icon={aspect === "landscape"
				? "material-symbols:sports-esports-outline-rounded"
				: "material-symbols:movie-outline-rounded"}
			class="media-card__placeholder-icon"
		/>
		<span class="media-card__placeholder-title">{title}</span>
		<span class="media-card__placeholder-hint">Нет сети</span>
	</div>
</div>

<style lang="stylus">
.media-card__placeholder
	position: absolute
	inset: 0
	display: flex
	flex-direction: column
	align-items: center
	justify-content: center
	padding: 1rem
	box-sizing: border-box
	color: var(--on-surface-variant)
	background: radial-gradient(circle at 50% 30%, var(--surface-container-high) 0%, var(--surface-container-lowest) 100%)
	overflow: hidden
	user-select: none

.media-card__placeholder-glow
	position: absolute
	top: -20%
	left: 10%
	width: 80%
	height: 60%
	border-radius: 50%
	background: unquote("radial-gradient(circle, rgba(100, 150, 255, 0.12) 0%, transparent 70%)")
	filter: blur(20px)
	pointer-events: none

.media-card__placeholder-content
	position: relative
	z-index: 2
	display: flex
	flex-direction: column
	align-items: center
	text-align: center
	gap: 0.5rem
	width: 100%

:global(.media-card__placeholder-icon)
	width: 2.75rem
	height: 2.75rem
	opacity: 0.55
	color: var(--primary)

.media-card__placeholder-title
	font: var(--m3e-type-label-medium)
	font-weight: 700
	font-size: 0.8125rem
	line-height: 1.25
	color: var(--on-surface)
	display: -webkit-box
	-webkit-line-clamp: 2
	-webkit-box-orient: vertical
	overflow: hidden
	opacity: 0.85

.media-card__placeholder-hint
	font: var(--m3e-type-label-small)
	font-size: 0.6875rem
	font-weight: 500
	color: var(--on-surface-variant)
	opacity: 0.65
	padding: 0.125rem 0.5rem
	border-radius: var(--shape-corner-full, 999px)
	background: rgba(255, 255, 255, 0.06)
</style>
