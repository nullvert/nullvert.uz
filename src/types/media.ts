export interface MediaProgress {
	watched: number;
	total: number;
	unit?: string;
}

export interface MediaItemData {
	title: string;
	originalTitle?: string;
	cover?: string;
	link?: string;
	rating?: number;
	status?: string;
	statusLabel?: string;
	statusColor?: string;
	statusIcon?: string;
	progress?: MediaProgress;
	year?: string | number;
	authorOrStudio?: string;
	description?: string;
	genres?: string[];
	badge?: string;
}
