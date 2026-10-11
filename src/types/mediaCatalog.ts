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
	key: "anime" | "cinema" | "games";
	getId(item: T): string;
	toCard(item: T): MediaItemData;
	searchFields(item: T): (string | number | undefined | null)[];
	statusOrder: string[];
	statusMeta: Record<string, StatusMetaItem>;
	defaultStatus: string;
	sortOptions: SortOptionItem[];
	defaultSort: string;
	defaultSortOrder?: "asc" | "desc";
	sources?: SourceOptionItem[];
	sourceLabel?: string;
	searchPlaceholder?: string;
	countLabel?(count: number): string;
	prepare?(raw: T[]): T[];
	filterBySource?(item: T, source: string): boolean;
	cardProps?: {
		showTitleOnPoster?: boolean;
	};
	hooks?: {
		onStatusChange?(newStatus: string, ctx: { currentSort: string; setSort: (s: string) => void }): void;
		onSortChange?(newSort: string, ctx: { selectedStatus: string; setStatus: (s: string) => void; setOrder: (o: "asc" | "desc") => void }): void;
		preFilter?(item: T, ctx: { selectedStatus: string; currentSort: string }): boolean;
	};
}
