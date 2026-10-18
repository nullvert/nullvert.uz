<script lang="ts">
import type { Snippet } from "svelte";

let {
	ariaLabel = "Список медиа",
	columns = 4,
	children,
}: {
	ariaLabel?: string;
	columns?: number;
	children?: Snippet;
} = $props();
</script>

<div
	class="media-card-grid media-card-grid--cols-{columns}"
	role="list"
	aria-label={ariaLabel}
>
	{@render children?.()}
</div>

<style lang="stylus">
.media-card-grid
	display: grid
	align-items: start
	/* По умолчанию 4 колонки, либо 3 если передано columns=3 */
	grid-template-columns: repeat(4, minmax(0, 1fr))
	gap: 1.5rem
	padding: 4px
	box-sizing: border-box

	&--cols-3
		grid-template-columns: repeat(3, minmax(0, 1fr))
		gap: 1rem

	&--cols-2
		grid-template-columns: repeat(2, minmax(0, 1fr))
		gap: 1.25rem

	@media (max-width: 64rem) // < 1024px (Mobile / Tablet catalog shell)
		grid-template-columns: repeat(3, minmax(0, 1fr))
		gap: 0.875rem

		&.media-card-grid--cols-2
			grid-template-columns: repeat(2, minmax(0, 1fr))

	@media (max-width: 48rem) // < 768px
		grid-template-columns: repeat(2, minmax(0, 1fr))
		gap: 0.75rem

		&.media-card-grid--cols-3
			grid-template-columns: repeat(2, minmax(0, 1fr))
			gap: 0.75rem

	@media (max-width: 32rem) // < 512px
		grid-template-columns: repeat(2, minmax(0, 1fr))
		gap: 0.625rem

		&.media-card-grid--cols-3
			grid-template-columns: 1fr
			gap: 0.75rem

		&.media-card-grid--cols-2
			grid-template-columns: 1fr
			gap: 0.875rem

	& > [role="listitem"]
		min-width: 0
		width: 100%
		contain: layout
</style>
