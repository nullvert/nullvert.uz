<script lang="ts">
import type { Snippet } from "svelte";

let {
	ariaLabel = "Список медиа",
	children,
}: {
	ariaLabel?: string;
	children?: Snippet;
} = $props();
</script>

<div
	class="media-card-grid"
	role="list"
	aria-label={ariaLabel}
>
	{@render children?.()}
</div>

<style lang="stylus">
.media-card-grid
	display: grid
	grid-template-columns: repeat(4, minmax(0, 1fr))
	gap: 1.25rem
	padding-top: 0

	@media (max-width: 78rem) // < 1248px
		grid-template-columns: repeat(3, minmax(0, 1fr))
		gap: 1rem

	@media (max-width: 52rem) // < 832px
		grid-template-columns: repeat(3, minmax(0, 1fr))
		gap: 0.875rem

	@media (max-width: 36rem) // Mobile
		grid-template-columns: repeat(2, minmax(0, 1fr))
		gap: 0.75rem
</style>
