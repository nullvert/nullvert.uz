/**
 * Чистая сортировка медиа-элементов
 */

export function sortMediaItems<T extends { title: string; rating?: number; year?: string | number }>(
	items: T[],
	currentSort: string,
	sortOrder: "asc" | "desc",
): T[] {
	if (currentSort === "default") {
		return items;
	}

	return [...items].sort((a, b) => {
		if (currentSort === "rating") {
			const ratingA = Number(a.rating ?? 0);
			const ratingB = Number(b.rating ?? 0);
			return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
		}
		if (currentSort === "year") {
			const yearA = parseInt(String(a.year ?? 0), 10) || 0;
			const yearB = parseInt(String(b.year ?? 0), 10) || 0;
			return sortOrder === "asc" ? yearA - yearB : yearB - yearA;
		}
		if (currentSort === "title") {
			const cmp = a.title.localeCompare(b.title, "ru", { sensitivity: "base" });
			return sortOrder === "asc" ? cmp : -cmp;
		}
		return 0;
	});
}
