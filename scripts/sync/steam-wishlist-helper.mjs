import { delay, fetchJson, mapConcurrent, shouldRefresh } from "./sync-common.mjs";

/**
 * Fetch and enrich Steam Wishlist items, falling back to InfiniteBacklog for missing vertical covers.
 *
 * @param {Object} options
 * @param {string} options.steamApiKey
 * @param {string} options.steamId64
 * @param {string} [options.steamWishlistLink]
 * @param {Map<string, any>} options.cache
 * @param {Set<string>} options.existingTitles Lowercase titles already present in the collection
 * @param {Function} options.normalizeGenre Genre normalization callback
 * @param {boolean} [options.forceRefresh=false]
 * @returns {Promise<Array<Object>>}
 */
export async function fetchSteamWishlist({
	steamApiKey,
	steamId64,
	steamWishlistLink,
	cache,
	existingTitles,
	normalizeGenre,
	forceRefresh = false,
}) {
	if (!steamApiKey || !steamId64) {
		return [];
	}

	console.log(`[Steam] Fetching wishlist for ${steamId64}...`);
	try {
		const wishlistUrl = `https://api.steampowered.com/IWishlistService/GetWishlist/v1/?key=${encodeURIComponent(steamApiKey)}&steamid=${encodeURIComponent(steamId64)}`;
		const wishlistRes = await fetchJson(wishlistUrl, {}, { label: "Steam Wishlist" });
		const wishlistItems = wishlistRes?.response?.items || [];
		console.log(`[Steam] Found ${wishlistItems.length} wishlist entries.`);

		const steamNormalized = await mapConcurrent(wishlistItems, 2, async (wItem, idx) => {
			const appid = wItem.appid;
			if (!appid) return null;

			const steamId = `steam_${appid}`;
			const cached = cache.get(steamId);
			let title = cached?.title || "";
			let description = cached?.description || "";
			let genres = cached?.genres || [];
			let developer = cached?.developer || "";
			let year = cached?.year || "";
			let headerImage = cached?.headerImage || "";
			let price = cached?.price || null;
			let discount = cached?.discount || 0;
			let isFree = cached?.isFree || false;
			let fetchedAt = cached?._fetchedAt;

			const needsRefresh = shouldRefresh(cached, {
				requiredFields: ["description", "headerImage"],
				maxAgeDays: 14,
				force: forceRefresh,
			}) || !title;

			if (needsRefresh) {
				try {
					const storeUrl = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=us&l=russian`;
					const storeData = await fetchJson(storeUrl, {}, { label: `Steam app ${appid}` });
					const data = storeData?.[String(appid)]?.data;
					if (data) {
						title = data.name || title;
						description = data.short_description || "";
						headerImage = data.header_image || headerImage;
						if (Array.isArray(data.genres)) {
							genres = data.genres.map((g) => normalizeGenre(g.description)).filter(Boolean);
						}
						if (Array.isArray(data.developers) && data.developers.length > 0) {
							developer = data.developers.join(", ");
						}
						if (data.release_date?.date) {
							const match = data.release_date.date.match(/\b(19\d\d|20\d\d)\b/);
							if (match) year = match[1];
						}
						isFree = Boolean(data.is_free);
						if (data.price_overview) {
							let p = data.price_overview.final_formatted || "";
							p = p.replace(/\s*(USD|EUR|RUB|UAH)\b/gi, "").trim();
							price = p || null;
							discount = Number(data.price_overview.discount_percent || 0);
						} else if (Array.isArray(data.package_groups) && data.package_groups.length > 0) {
							const defaultGroup = data.package_groups.find((g) => g.name === "default") || data.package_groups[0];
							const sub = defaultGroup?.subs?.[0];
							if (sub && sub.price_in_cents_with_discount !== undefined) {
								const rawPrice = (sub.price_in_cents_with_discount / 100).toFixed(2);
								price = `$${rawPrice}`;
								const savings = String(sub.percent_savings_text || "").match(/(\d+)/);
								discount = savings ? Number(savings[1]) : (sub.percent_savings || 0);
							}
						} else if (isFree) {
							price = "Бесплатно";
							discount = 0;
						}
						fetchedAt = new Date().toISOString();
					}
					await delay(200);
				} catch (e) {
					console.warn(`[Steam] Warning fetching details for appid ${appid}: ${e.message}`);
				}
			}

			if (!title) return null;
			// Skip if already in played/collection list
			if (existingTitles.has(title.toLowerCase().trim())) {
				return null;
			}

			const defaultCover = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/library_600x900.jpg`;
			const banner = headerImage || `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;

			const cover = await resolveWishlistCover({
				title,
				defaultCover,
				banner,
			});

			const rank = wItem.priority && wItem.priority > 0 ? `#${wItem.priority}` : `#${idx + 1}`;

			return {
				id: steamId,
				title,
				cover,
				banner,
				link: steamWishlistLink || `https://store.steampowered.com/app/${appid}/`,
				status: "wishlist",
				rating: undefined,
				hours: 0,
				platform: "PC",
				year: year || "",
				genres,
				developer,
				description,
				rank,
				price,
				discount,
				isFree,
				_fetchedAt: fetchedAt,
			};
		});

		const filtered = steamNormalized.filter(Boolean);
		console.log(`[Steam] Added ${filtered.length} new wishlist games from Steam.`);
		return filtered;
	} catch (err) {
		console.warn(`[Steam] Failed to sync Steam wishlist: ${err.message}`);
		return [];
	}
}

/**
 * Resolve vertical cover for a Steam wishlist item.
 * Tries Steam's library_600x900 asset; if missing, queries InfiniteBacklog (IGDB) by title similarity.
 */
async function resolveWishlistCover({ title, defaultCover, banner }) {
	let hasVerticalCover = false;
	try {
		const headRes = await fetch(defaultCover, { method: "HEAD" });
		if (headRes.ok) {
			hasVerticalCover = true;
		}
	} catch {}

	if (hasVerticalCover) {
		return defaultCover;
	}

	// Try lookup on InfiniteBacklog
	try {
		const cleanTitle = title.replace(/[™®:]/g, " ").replace(/\s+/g, " ").trim();
		const titleWords = cleanTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
		const searchQueries = [
			cleanTitle,
			cleanTitle.split(/[:\s-]+/)[0].trim(),
		].filter(Boolean);

		for (const q of searchQueries) {
			const ibResults = await fetchJson(`https://infinitebacklog.net/api/games?query=${encodeURIComponent(q)}`, {}, { label: "IGDB cover lookup" });
			if (!Array.isArray(ibResults) || ibResults.length === 0) continue;

			const targetLower = cleanTitle.toLowerCase();
			const match = ibResults.find((g) => {
				if (!g?.cover?.image_id && !g?.cover?.url) return false;
				const gName = (g.name || "").replace(/[™®:]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
				if (gName === targetLower) return true;
				if (gName.includes(targetLower) || targetLower.includes(gName)) return true;

				const gWords = gName.split(/\s+/).filter((w) => w.length > 2);
				if (titleWords.length > 0 && gWords.length > 0) {
					const intersection = titleWords.filter((w) => gWords.includes(w));
					if (intersection.length >= Math.ceil(titleWords.length * 0.6)) {
						return true;
					}
				}
				return false;
			});

			if (match) {
				const imgId = match.cover?.image_id || (match.cover?.url ? match.cover.url.replace(/\.[^.]+$/, "") : null);
				if (imgId) {
					console.log(`[Steam -> InfiniteBacklog] Found cover for "${title}": ${match.name} (${imgId})`);
					return `https://images.igdb.com/igdb/image/upload/t_1080p/${imgId}.jpg`;
				}
			}
		}
	} catch (e) {
		console.warn(`[Steam] InfiniteBacklog cover lookup failed for "${title}": ${e.message}`);
	}

	return banner;
}
