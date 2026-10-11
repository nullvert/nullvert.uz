<script lang="ts">
/**
 * CinemaSection — медиа-секция «Кино и Сериалы» на базе универсального MediaCatalog.
 * Данные поступают из локального снапшота Simkl.
 */
import MediaCatalog from "./MediaCatalog.svelte";
import { cinemaDomain, type CinemaItem } from "../../utils/media/domains/cinema";
import simklSnapshot from "../../../shirones/config/data/cinema-snapshots/simkl.json";

let {
	title = "Кино",
}: {
	title?: string;
} = $props();

const allCinemaItems: CinemaItem[] = (simklSnapshot as unknown as CinemaItem[]) || [];
</script>

<MediaCatalog domain={cinemaDomain} items={allCinemaItems} {title} />
