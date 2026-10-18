<script lang="ts">
/**
 * BooksSection — медиа-секция «Книги» на базе универсального MediaCatalog.
 * Данные поступают из локального снапшота Hardcover.
 */
import MediaCatalog from "./MediaCatalog.svelte";
import BookCard from "../molecules/BookCard.svelte";
import { booksDomain, type BookItem, type BooksSnapshot } from "../../utils/media/domains/books";
import hardcoverSnapshot from "../../data/snapshots/hardcover.json";
import { MEDIA_LABEL, mediaLabel } from "../../utils/media/labels";

let {
	title = mediaLabel(MEDIA_LABEL.booksAll, "Книги"),
}: {
	title?: string;
} = $props();

const snapshot = (hardcoverSnapshot as unknown as BooksSnapshot) || { items: [], goals: [] };
const allBooks: BookItem[] = snapshot.items || [];
</script>

<MediaCatalog
	domain={booksDomain}
	items={allBooks}
	{title}
>
	{#snippet itemSnippet(book)}
		<BookCard item={booksDomain.toCard(book)} />
	{/snippet}
</MediaCatalog>

