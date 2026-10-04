import type { ProfileConfig } from "@/types/config";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * Профиль автора: аватар / имя / описание / соцсети (используется в карточке профиля боковой панели, футере, RSS и т.д.).
 * Типы описаны в src/types/config.ts.
 */
export const profileConfig: ProfileConfig = withUserConfig("profile", {
	avatar: "/assets/images/logo/nullvert.webp",
	name: "nullvert",
	bio: "Черновики и заметки",
	links: [
		{
			name: "Канал",
			icon: "fa6-brands:telegram",
			url: "https://t.me/nullvert",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/nullvert",
		},
		// {
		// 	name: "Personal TG",
		// 	icon: "fa6-brands:telegram",
		// 	url: "https://t.me/glytsin",
		// },
		// {
		// 	name: "RSS",
		// 	icon: "fa6-solid:rss",
		// 	url: "/rss.xml",
		// },
	],
});
