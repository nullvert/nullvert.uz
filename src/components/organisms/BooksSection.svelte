<script lang="ts">
/**
 * BooksSection — медиа-секция «Книги» на базе универсального MediaCatalog.
 * Данные поступают из локального снапшота Hardcover.
 */
import MediaCatalog from "./MediaCatalog.svelte";
import BookCard from "../molecules/BookCard.svelte";
import { booksDomain, type BookItem, type BooksSnapshot } from "../../utils/media/domains/books";
import hardcoverSnapshot from "../../../shirones/config/data/snapshots/hardcover.json";

let {
	title = "Книги",
}: {
	title?: string;
} = $props();

const snapshot = (hardcoverSnapshot as unknown as BooksSnapshot) || { items: [], goals: [] };
const allBooks: BookItem[] = snapshot.items || [];
</script>

{#snippet renderBookItem(item: BookItem)}
	<BookCard item={booksDomain.toCard(item)} />
{/snippet}

<MediaCatalog
	domain={booksDomain}
	items={allBooks}
	{title}
	itemSnippet={renderBookItem}
/>

