/**
 * Конфигурация страницы поддержки автора (/support).
 */

export interface SupportConfig {
	enable: boolean;
	title: string;
	subtitle: string;
	description: string;

	taps: {
		enable: boolean;
		title: string;
		badge: string;
		methods: string;
		url: string;
	};

	tribute: {
		enable: boolean;
		title: string;
		badge: string;
		methods: string;
		url: string;
		apiKey: string;
	};

	wishlists?: Array<{
		title: string;
		subtitle: string;
		url: string;
		icon: "steam" | "steam-gift" | "followish" | "external";
	}>;

	freeWays?: Array<{
		title: string;
		subtitle: string;
		url?: string;
		action?: "copy" | "link";
		icon: "telegram" | "message" | "share" | "github";
	}>;
}

export const supportConfig: SupportConfig = {
	enable: true,
	title: "Поддержать автора",
	subtitle: "Tip Jar & Донаты",
	description:
		"Если вы хотите поддержать автора, сделать подарок или просто сказать спасибо, все инструменты собраны здесь. Никаких обязательств, только чистая добровольная поддержка.",

	taps: {
		enable: true,
		title: "Taps",
		badge: "Узбекистан",
		methods: "Payme • Click • Uzcard • Humo • Uzum",
		url: (import.meta.env.PUBLIC_SUPPORT_LOCAL_URL as string) || "https://taps.uz/",
	},

	tribute: {
		enable: true,
		title: "Tribute",
		badge: "Международно",
		methods: "Visa • Mastercard • Telegram • СБП",
		url: (import.meta.env.PUBLIC_TRIBUTE_URL as string) || "https://tribute.tg/",
		apiKey: (import.meta.env.TRIBUTE_API_KEY as string) || "",
	},

	wishlists: [
		{
			title: "Steam Wishlist",
			subtitle: "Список желаемых игр в Steam",
			url: (import.meta.env.PUBLIC_STEAM_WISHLIST_URL as string) || (import.meta.env.STEAM_WISHLIST_LINK as string) || "#",
			icon: "steam",
		},
		{
			title: "Followish",
			subtitle: "Список подарков и вещей",
			url:
				(import.meta.env.PUBLIC_FOLLOWISH_URL as string) ||
				(import.meta.env.PUBLIC_FOLLOWISH_LINK as string) ||
				(import.meta.env.FOLLOWISH_LINK as string) ||
				"#",
			icon: "followish",
		},
	],

	freeWays: [
		{
			title: "Поделиться блогом",
			subtitle: "Скопировать ссылку на сайт",
			action: "copy",
			icon: "share",
		},
		{
			title: "Написать в Telegram",
			subtitle: "Сказать спасибо или предложить идею",
			url: (import.meta.env.PUBLIC_TELEGRAM_URL as string) || (import.meta.env.PUBLIC_CHANNEL_DIRECT as string) || "#",
			action: "link",
			icon: "message",
		},
	],
};
