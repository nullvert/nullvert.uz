/**
 * Чистые утилиты фильтрации медиа-каталога
 */

export function tokenSearch(tokens: string[], searchableText: string): boolean {
	if (tokens.length === 0) return true;
	const lower = searchableText.toLowerCase();
	return tokens.every((token) => lower.includes(token));
}

export function countByStatus<T extends { status: string }>(items: T[]): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const item of items) {
		counts[item.status] = (counts[item.status] || 0) + 1;
	}
	return counts;
}

export function dedupeById<T>(
	items: T[],
	getId: (item: T) => string,
	priority?: (item: T) => number,
): T[] {
	const map = new Map<string, T>();
	for (const item of items) {
		const id = getId(item);
		const existing = map.get(id);
		if (!existing) {
			map.set(id, item);
		} else if (priority) {
			if (priority(item) > priority(existing)) {
				map.set(id, item);
			}
		}
	}
	return [...map.values()];
}
