import "@/types/musicConfig";

declare module "@/types/musicConfig" {
	interface TrackDescriptor {
		/** Отметка новинки (отображает деликатный бейдж 'new' в плейлисте и фильтре) */
		readonly isNew?: boolean;
	}
}
