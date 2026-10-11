<script lang="ts">
/**
 * GamesSection — медиа-секция «Игры» на базе универсального MediaCatalog.
 * Данные поступают из локального снапшота Infinite Backlog.
 */
import MediaCatalog from "./MediaCatalog.svelte";
import { gamesDomain, type GameItem } from "../../utils/media/domains/games";
import infiniteBacklogSnapshot from "../../../shirones/config/data/games-snapshots/infinitebacklog.json";

let {
	title = "Игры",
}: {
	title?: string;
} = $props();

const allGameItems: GameItem[] = (infiniteBacklogSnapshot as unknown as GameItem[]) || [];
</script>

<MediaCatalog domain={gamesDomain} items={allGameItems} {title} />
