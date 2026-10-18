<script lang="ts">
/**
 * CinemaSection — медиа-секция «Кино и Сериалы» на базе универсального MediaCatalog.
 * Данные поступают из локального снапшота Simkl.
 */
import MediaCatalog from "./MediaCatalog.svelte";
import { cinemaDomain, type CinemaItem } from "../../utils/media/domains/cinema";
import simklSnapshot from "../../data/snapshots/simkl.json";
import { MEDIA_LABEL, mediaLabel } from "../../utils/media/labels";

let {
	title = mediaLabel(MEDIA_LABEL.cinemaTypeAll, "Кино"),
}: {
	title?: string;
} = $props();

const allCinemaItems: CinemaItem[] = (simklSnapshot.items as unknown as CinemaItem[]) || [];
</script>

<MediaCatalog domain={cinemaDomain} items={allCinemaItems} {title} />
