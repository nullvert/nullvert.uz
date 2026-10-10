import type { TrackDescriptor } from "@/types/musicConfig";

/**
 * Источник локальных треков для аудиоплеера.
 * Содержит только реальные аудиофайлы из /public/assets/music/.
 */
export const musicTracks: readonly TrackDescriptor[] = [
	{
		id: "defeat-the-night",
		title: "Defeat The Night",
		artist: "JPB, Ashley Apollodor",
		source: "/assets/music/url/248a910f7bbf.m4a",
		duration: 254,
	},
	{
		id: "vienna",
		title: "Vienna",
		artist: "James Mercy, PhiloSofie",
		source: "/assets/music/url/1e39df64f488.m4a",
		duration: 214,
	},
	{
		id: "akina",
		title: "akina",
		artist: "Ailow",
		source: "/assets/music/url/42207dd52ad5.m4a",
		duration: 176,
	},
	{
		id: "monodrama",
		title: "Monodrama",
		artist: "HOYO-MiX",
		source: "/assets/music/url/c67514fae328.m4a",
		duration: 119,
	},
	{
		id: "a-dramatic-irony",
		title: "A Dramatic Irony",
		artist: "HOYO-MiX",
		source: "/assets/music/url/f57fb20c1e8e.m4a",
		duration: 113,
	},
	{
		id: "rondo-across-countless-kalpas",
		title: "Rondo Across Countless Kalpas",
		artist: "HOYO-MiX",
		source: "/assets/music/url/76d2be06aaf0.m4a",
		duration: 195,
	},
	{
		id: "the-jepella-rebellion",
		title: "The Jepella Rebellion",
		artist: "HOYO-MiX",
		source: "/assets/music/url/a7d78b0caaaa.m4a",
		duration: 173,
	},
];
