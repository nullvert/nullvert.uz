import type { SeriesConfig } from "@/types/seriesConfig.ts";
import { withUserConfig } from "@/utils/config-overlay.ts";

export const seriesConfig: SeriesConfig = withUserConfig("series", {
	enable: true,
	title: "$t:series",
	// Пусто = динамическая сводка («х серий · у статей»)
	description: "",
	cardPosition: "top",
});
