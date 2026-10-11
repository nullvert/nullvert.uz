/**
 * Синхронизация состояния каталога с адресной строкой (URLSearchParams)
 */

export interface CatalogUrlState {
	status: string;
	q: string;
	sort: string;
	order: "asc" | "desc";
	source?: string;
}

export function readCatalogUrlState(defaultStatus = "", defaultSort = "default", defaultOrder: "asc" | "desc" = "desc"): CatalogUrlState {
	if (typeof window === "undefined") {
		return { status: defaultStatus, q: "", sort: defaultSort, order: defaultOrder };
	}
	const params = new URLSearchParams(window.location.search);
	const status = params.has("status") ? (params.get("status") || "") : defaultStatus;
	const q = params.get("q") || "";
	const sort = params.get("sort") || defaultSort;
	const orderRaw = params.get("order");
	const order: "asc" | "desc" = orderRaw === "asc" || orderRaw === "desc" ? orderRaw : defaultOrder;
	const source = params.get("source") || undefined;

	return { status, q, sort, order, source };
}

export function writeCatalogUrlState(state: CatalogUrlState, defaultStatus = "", defaultSort = "default"): void {
	if (typeof window === "undefined") return;

	const params = new URLSearchParams(window.location.search);
	params.delete("status");
	params.delete("q");
	params.delete("sort");
	params.delete("order");
	params.delete("source");

	if (state.status && state.status !== defaultStatus) {
		params.set("status", state.status);
	}
	if (state.q.trim()) {
		params.set("q", state.q.trim());
	}
	if (state.sort && state.sort !== defaultSort) {
		params.set("sort", state.sort);
		params.set("order", state.order);
	}
	if (state.source && state.source !== "all") {
		params.set("source", state.source);
	}

	const qs = params.toString();
	const newUrl = qs ? `?${qs}` : window.location.pathname;
	if (window.location.search !== (qs ? `?${qs}` : "")) {
		history.replaceState(history.state, "", newUrl);
	}
}
