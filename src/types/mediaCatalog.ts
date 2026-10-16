import type { MediaItemData } from "./media";

export interface StatusMetaItem {
	label: string;
	icon: string;
	color: string;
}

export interface SortOptionItem {
	value: string;
	label: string;
	icon?: string;
	toggleDirection?: boolean;
}

export interface SourceOptionItem {
	value: string;
	label: string;
	icon?: string;
}

export interface MediaDomain<T> {
	key: "anime" | "cinema" | "games" | "books";
	getId(item: T): string;
	toCard(item: T): MediaItemData;
	searchFields(item: T): (string | number | undefined | null)[];
	statusOrder: string[];
	statusMeta: Record<string, StatusMetaItem>;
	defaultStatus: string;
	sortOptions: SortOptionItem[];
	getSortOptions?(status: string): SortOptionItem[];
	defaultSort: string;
	defaultSortOrder?: "asc" | "desc";
	sources?: SourceOptionItem[];
	sourceLabel?: string;
	searchPlaceholder?: string;
	countLabel?(count: number): string;
	countAllItems?(items: T[]): number;
	prepare?(raw: T[]): T[];
	filterBySource?(item: T, source: string): boolean;
	sort?(items: T[], currentSort: string, sortOrder: "asc" | "desc"): T[];
	cardProps?: {
		showTitleOnPoster?: boolean;
		aspect?: "poster" | "landscape" | "game";
		maxNativeWidth?: number;
		columns?: number;
		bookSpine?: boolean;
	};
	hooks?: {
		onStatusChange?(newStatus: string, ctx: { currentSort: string; setSort: (s: string) => void; setOrder: (o: "asc" | "desc") => void }): void;
		onSortChange?(newSort: string, ctx: { selectedStatus: string; setStatus: (s: string) => void; setOrder: (o: "asc" | "desc") => void }): void;
		preFilter?(item: T, ctx: { selectedStatus: string; currentSort: string }): boolean;
	};
}
