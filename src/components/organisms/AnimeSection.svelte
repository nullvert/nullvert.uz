<script lang="ts">
/**
 * AnimeSection — медиа-секция аниме на базе универсального MediaCatalog.
 * Данные поступают из локального снапшота AniList.
 */
import MediaCatalog from "./MediaCatalog.svelte";
import { animeDomain } from "../../utils/media/domains/anime";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import type { AnimeItem } from "shirones/src/data/anime.ts";
import anilistSnapshot from "../../../shirones/config/data/snapshots/anilist.json";

let {
	animes = [],
	title = i18n(I18nKey.anime),
	subtitle = i18n(I18nKey.animeBanner),
}: {
	animes?: AnimeItem[];
	title?: string;
	subtitle?: string;
} = $props();

const snapshotAnimes: AnimeItem[] = (anilistSnapshot.items as unknown as AnimeItem[]) || [];
const itemsToRender = $derived(animes.length > 0 ? animes : snapshotAnimes);
</script>

<MediaCatalog domain={animeDomain} items={itemsToRender} {title} />
