<script lang="ts">
/**
 * GamesSection — медиа-секция «Игры» на базе универсального MediaCatalog.
 * Данные поступают из локального снапшота Infinite Backlog.
 */
import MediaCatalog from "./MediaCatalog.svelte";
import { gamesDomain, type GameItem } from "../../utils/media/domains/games";
import infiniteBacklogSnapshot from "../../../shirones/config/data/snapshots/infinitebacklog.json";

import CatalogFilterItem from "../molecules/CatalogFilterItem.svelte";

let {
	title = "Игры",
}: {
	title?: string;
} = $props();

const allGameItems: GameItem[] = (infiniteBacklogSnapshot.items as unknown as GameItem[]) || [];

const wishlistItems = $derived(allGameItems.filter((i) => i.status === "wishlist"));
const wishlistCount = $derived(wishlistItems.length);
</script>

<MediaCatalog domain={gamesDomain} items={allGameItems} {title}>
	{#snippet extraStatusBottom(ctx)}
		{@const selectedStatus = ctx?.selectedStatus ?? ""}
		{@const onStatusChange = ctx?.onStatusChange ?? (() => {})}
		{#if wishlistCount > 0}
			<div class="games-section__wishlist-group">
				<CatalogFilterItem
					title="Список желаемого"
					count={wishlistCount}
					active={selectedStatus === "wishlist"}
					icon="fa6-brands:steam"
					onclick={() => onStatusChange(selectedStatus === "wishlist" ? "" : "wishlist")}
				/>
			</div>
		{/if}
	{/snippet}
</MediaCatalog>

<style lang="stylus">
.games-section
	&__wishlist-group
		display: flex
		flex-direction: column
		gap: 0.25rem
		width: 100%
</style>
