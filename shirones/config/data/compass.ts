/**
 * 站点罗盘数据（Сгенерировано автоматически из Raindrop.io: scripts/compass-sync-raindrop.mjs）。
 * Запуск обновления: pnpm compass:sync
 */

export interface CompassEntry {
	label: string;
	href: string;
	note?: string;
	icon?: string;
	image?: string;
}

export interface CompassShelf {
	key: string;
	name: string;
	icon?: string;
	blurb?: string;
	entries: CompassEntry[];
}

export const compassData: CompassShelf[] = [
	{
		"key": "utility-i-soft",
		"name": "Утилиты и софт",
		"icon": "material-symbols:build-outline-rounded",
		"entries": [
			{
				"label": "ShareX",
				"href": "https://getsharex.com/",
				"note": "The best free and open source screenshot tool for Windows",
				"icon": "https://www.google.com/s2/favicons?domain=getsharex.com&sz=64"
			},
			{
				"label": "StoryPad",
				"href": "https://github.com/theachoem/storypad",
				"note": "An open source diary & journal app with over 100k downloads 🪴",
				"icon": "https://github.com/theachoem.png?size=64"
			},
			{
				"label": "Monekin",
				"href": "https://github.com/enrique-lozano/Monekin",
				"note": "Monekin is a fast, simple, offline-first personal finance app — 100% open source, zero ads, striking design.",
				"icon": "https://github.com/enrique-lozano.png?size=64"
			}
		]
	},
	{
		"key": "igry",
		"name": "Игры",
		"icon": "material-symbols:sports-esports-outline-rounded",
		"entries": [
			{
				"label": "SteamDB",
				"href": "https://steamdb.info/",
				"note": "Database of everything on Steam. Track player counts, price history, sales, and game updates.",
				"icon": "https://www.google.com/s2/favicons?domain=steamdb.info&sz=64"
			}
		]
	},
	{
		"key": "razrabotka-i-veb",
		"name": "Разработка и веб",
		"icon": "material-symbols:code-rounded",
		"entries": [
			{
				"label": "Современный учебник JavaScript",
				"href": "https://learn.javascript.ru/",
				"note": "начиная с основ, включающий в себя много тонкостей и фишек JavaScript/DOM.",
				"icon": "https://www.google.com/s2/favicons?domain=learn.javascript.ru&sz=64"
			}
		]
	}
];
