import type { MediaDomain } from "../../../types/mediaCatalog";
import { MEDIA_LABEL, mediaLabel } from "../labels";
import { dedupeById } from "../catalogFilter";

export interface GameItem {
	id: string;
	title: string;
	slug?: string;
	cover?: string;
	banner?: string;
	link?: string;
	status: "playing" | "completed" | "planned" | "wishlist" | "onHold" | "dropped";
	rating?: number;
	hours?: number;
	platform?: string;
	year?: string;
	genres?: string[];
	developer?: string;
	description?: string;
	rank?: string;
	price?: string | null;
	discount?: number;
	isFree?: boolean;
}

const STATUS_PRIORITY: Record<string, number> = {
	completed: 6,
	playing: 5,
	onHold: 4,
	dropped: 3,
	planned: 2,
	wishlist: 1,
};

export const gamesDomain: MediaDomain<GameItem> = {
	key: "games",
	getId: (item) => item.id,
	toCard: (item) => {
		const meta = gamesDomain.statusMeta[item.status];
		const timeOrPlatform = item.hours && item.hours > 0
			? `${item.hours} ${mediaLabel(MEDIA_LABEL.gamesUnitHours, "ч.")}`
			: (item.platform || "PC");

		// Для вишлиста: порядковый номер (#1, #2) в левом углу вместо иконки статуса
		const isWishlist = item.status === "wishlist";
		const topAction = isWishlist ? (item.rank || "#") : undefined;

		// Для вишлиста: актуальная цена и процент скидки в аутентичном стиле Steam
		let topBadge: string | undefined = undefined;
		let topDiscount: string | undefined = undefined;
		const hasDiscount = Boolean(isWishlist && item.discount && item.discount > 0);
		if (isWishlist && item.price) {
			// Убираем USD, если есть знак валюты $
			const cleanPrice = item.price.replace(/\s*USD\b/gi, "").trim();
			topBadge = cleanPrice;
			if (hasDiscount) {
				topDiscount = `-${item.discount}%`;
			}
		}

		// Цвет рамки (hover) и статуса: для скидок — неоновый Steam Green (#a4d007), для обычного вишлиста — фирменный Steam Blue (#66c0f4)
		const wishlistColor = hasDiscount ? "#a4d007" : "#66c0f4";

		return {
			title: item.title,
			cover: item.cover || item.banner,
			link: item.link,
			rating: item.rating,
			status: item.status,
			statusLabel: meta?.label,
			statusColor: isWishlist ? wishlistColor : meta?.color,
			statusIcon: isWishlist ? undefined : meta?.icon,
			topAction,
			topBadge,
			topDiscount,
			year: item.year,
			authorOrStudio: timeOrPlatform,
			subMeta: isWishlist && item.price ? item.price : undefined,
			description: item.description,
			genres: item.genres,
		};
	},
	searchFields: (item) => [
		item.title,
		item.year,
		item.developer,
		item.platform,
		...(item.genres || []),
	],
	statusOrder: ["playing", "completed", "planned", "onHold", "dropped"],
	statusMeta: {
		playing: {
			label: mediaLabel(MEDIA_LABEL.statusPlaying, "Играю"),
			icon: "material-symbols:sports-esports-outline-rounded",
			color: "var(--primary)",
		},
		completed: {
			label: mediaLabel(MEDIA_LABEL.gamesStatusCompleted, "Пройдено"),
			icon: "material-symbols:check-rounded",
			color: "var(--tertiary)",
		},
		planned: {
			label: mediaLabel(MEDIA_LABEL.statusPlanned, "В планах"),
			icon: "material-symbols:bookmark-rounded",
			color: "var(--secondary)",
		},
		wishlist: {
			label: mediaLabel(MEDIA_LABEL.statusWishlist, "Список желаемого"),
			icon: "fa6-brands:steam",
			color: "var(--primary)",
		},
		onHold: {
			label: mediaLabel(MEDIA_LABEL.statusOnHold, "Отложено"),
			icon: "material-symbols:pause-rounded",
			color: "var(--on-surface-variant)",
		},
		dropped: {
			label: mediaLabel(MEDIA_LABEL.statusDropped, "Брошено"),
			icon: "material-symbols:close-rounded",
			color: "var(--error)",
		},
	},
	defaultStatus: "",
	sortOptions: [
		{ value: "title", label: mediaLabel(MEDIA_LABEL.sortTitle, "По алфавиту"), icon: "material-symbols:sort-by-alpha-rounded", toggleDirection: true },
		{ value: "rating", label: mediaLabel(MEDIA_LABEL.sortRating, "По оценке"), icon: "material-symbols:star-rounded", toggleDirection: true },
	],
	getSortOptions: (status: string) => {
		if (status === "wishlist") {
			return [
				{ value: "rank", label: "По приоритету", icon: "material-symbols:format-list-numbered-rounded", toggleDirection: true },
				{ value: "price", label: "По цене", icon: "material-symbols:attach-money-rounded", toggleDirection: true },
			];
		}
		return [
			{ value: "title", label: mediaLabel(MEDIA_LABEL.sortTitle, "По алфавиту"), icon: "material-symbols:sort-by-alpha-rounded", toggleDirection: true },
			{ value: "rating", label: mediaLabel(MEDIA_LABEL.sortRating, "По оценке"), icon: "material-symbols:star-rounded", toggleDirection: true },
		];
	},
	defaultSort: "title",
	defaultSortOrder: "asc",
	sort: (items, currentSort, sortOrder) => {
		const isAsc = sortOrder === "asc";
		if (currentSort === "rank") {
			return [...items].sort((a, b) => {
				const rankA = parseInt(String(a.rank || "").replace(/\D/g, ""), 10) || 9999;
				const rankB = parseInt(String(b.rank || "").replace(/\D/g, ""), 10) || 9999;
				return isAsc ? rankA - rankB : rankB - rankA;
			});
		}
		if (currentSort === "price") {
			return [...items].sort((a, b) => {
				// Извлекаем числовое значение цены: "$17.99" -> 17.99, "Бесплатно" -> 0
				const parsePrice = (item: GameItem) => {
					if (item.isFree || item.price === "Бесплатно") return 0;
					if (!item.price) return 999999;
					const match = item.price.match(/[\d.,]+/);
					if (!match) return 999999;
					return parseFloat(match[0].replace(",", "."));
				};
				const priceA = parsePrice(a);
				const priceB = parsePrice(b);
				return isAsc ? priceA - priceB : priceB - priceA;
			});
		}
		if (currentSort === "rating") {
			return [...items].sort((a, b) => {
				const ratingA = Number(a.rating ?? 0);
				const ratingB = Number(b.rating ?? 0);
				return isAsc ? ratingA - ratingB : ratingB - ratingA;
			});
		}
		if (currentSort === "title") {
			return [...items].sort((a, b) => {
				const cmp = a.title.localeCompare(b.title, "ru", { sensitivity: "base" });
				return isAsc ? cmp : -cmp;
			});
		}
		return items;
	},
	sourceLabel: mediaLabel(MEDIA_LABEL.gamesPlatformLabel, "Платформа"),
	searchPlaceholder: "Поиск...",
	countLabel: (count) => `${count} игр`,
	countAllItems: (items) => items.filter((i) => i.status !== "wishlist").length,
	prepare: (raw) => {
		const prepared = raw.map((i) => ({
			...i,
			platform: (i.platform === "Windows PC" || !i.platform) ? "PC" : i.platform,
		}));
		return dedupeById(prepared, (i) => i.id, (i) => STATUS_PRIORITY[i.status] ?? 0);
	},
	filterBySource: (item, source) => {
		const plat = item.platform === "Windows PC" ? "PC" : (item.platform || "PC");
		return source === "all" || plat === source;
	},
	cardProps: {
		aspect: "poster",
		maxNativeWidth: 340,
	},
	hooks: {
		onStatusChange: (newStatus, ctx) => {
			if (newStatus === "wishlist") {
				// В режиме вишлиста переключаем на сортировку по приоритету (#1, #2, #3...)
				if (ctx.currentSort !== "rank" && ctx.currentSort !== "price") {
					ctx.setSort("rank");
					ctx.setOrder("asc");
				}
			} else {
				// В обычной коллекции возвращаем алфавит или оценку
				if (ctx.currentSort === "rank" || ctx.currentSort === "price") {
					ctx.setSort("title");
					ctx.setOrder("asc");
				} else if (newStatus && ctx.currentSort === "rating") {
					ctx.setSort("title");
				}
			}
		},
		onSortChange: (newSort, ctx) => {
			if (newSort === "rating") {
				ctx.setOrder("desc");
				ctx.setStatus("");
			} else if (newSort === "title" || newSort === "rank" || newSort === "price") {
				ctx.setOrder("asc");
			}
		},
		preFilter: (item, ctx) => {
			// Если статус не выбран (фильтр «Все»), показываем только коллекцию пользователя (без вишлиста)
			if (!ctx.selectedStatus && item.status === "wishlist") {
				return false;
			}
			if (ctx.currentSort === "rating" && !ctx.selectedStatus && (item.rating == null || item.rating <= 0)) {
				return false;
			}
			return true;
		},
	},
};
