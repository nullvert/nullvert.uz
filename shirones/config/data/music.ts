import type { TrackDescriptor } from "@/types/musicConfig";

/**
 * Источник локальных треков для аудиоплеера.
 * Содержит только реальные аудиофайлы из /public/assets/music/.
 */
export const musicTracks: readonly TrackDescriptor[] = [
	{
		id: "get-jinxed",
		title: "Get Jinxed",
		artist: "League of Legends",
		source: "/assets/music/url/get-jinxed.opus",
		duration: 154,
	},
	{
		id: "defeat-the-night",
		title: "Defeat The Night",
		artist: "JPB, Ashley Apollodor",
		source: "/assets/music/url/defeat-the-night.opus",
		duration: 254,
	},
	{
		id: "royalty",
		title: "Royalty",
		artist: "Maestro Chives, Egzod, Neoni",
		source: "/assets/music/url/royalty.opus",
		duration: 223,
	},
	{
		id: "vienna",
		title: "Vienna",
		artist: "James Mercy, PhiloSofie",
		source: "/assets/music/url/vienna.opus",
		duration: 214,
	},
	{
		id: "cradles",
		title: "Cradles",
		artist: "Sub Urban",
		source: "/assets/music/url/cradles.opus",
		duration: 209,
	},
	{
		id: "akina",
		title: "akina",
		artist: "Ailow",
		source: "/assets/music/url/akina.opus",
		duration: 176,
	},
	{
		id: "monodrama",
		title: "Monodrama",
		artist: "HOYO-MiX",
		source: "/assets/music/url/monodrama.opus",
		duration: 119,
		isNew: true,
	},
	{
		id: "a-dramatic-irony",
		title: "A Dramatic Irony",
		artist: "HOYO-MiX",
		source: "/assets/music/url/a-dramatic-irony.opus",
		duration: 113,
		isNew: true,
	},
	{
		id: "rondo-across-countless-kalpas",
		title: "Rondo Across Countless Kalpas",
		artist: "HOYO-MiX",
		source: "/assets/music/url/rondo-across-countless-kalpas.opus",
		duration: 195,
		isNew: true,
	},
	{
		id: "the-jepella-rebellion",
		title: "The Jepella Rebellion",
		artist: "HOYO-MiX",
		source: "/assets/music/url/the-jepella-rebellion.opus",
		duration: 173,
		isNew: true,
	},
];
