<script lang="ts">
/**
 * Переопределение SiteNavigationDrawer для блога (nv://blog).
 * - Добавлена кнопка закрытия меню (Close icon button).
 * - Полноценные Material Symbols иконки (включая Tags "material-symbols:label-outline-rounded").
 * - z-index поднят выше нижнего плеера (z-index: 120), чтобы мобильное меню открывалось поверх всего.
 */
import Icon from "@iconify/svelte";
import { addIcon } from "@iconify/svelte/dist/functions";
import { resolveNavBarLinks, resolvePageKey } from "@utils/nav-utils";
import { url } from "@utils/url-utils";
import { onMount, tick } from "svelte";
import { siteConfig } from "@/config";
import { navBarConfig } from "@/config/navBarConfig";

// Регистрация локальных иконок для меню в Iconify (не зависит от внешней сети/API)
try {
	addIcon("material-symbols:home-outline-rounded", {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="M6 19h3v-5q0-.425.288-.712T10 13h4q.425 0 .713.288T15 14v5h3v-9l-6-4.5L6 10zm-2 0v-9q0-.475.213-.9t.587-.7l6-4.5q.525-.4 1.2-.4t1.2.4l6 4.5q.375.275.588.7T20 10v9q0 .825-.588 1.413T18 21h-4q-.425 0-.712-.288T13 20v-5h-2v5q0 .425-.288.713T10 21H6q-.825 0-1.412-.587T4 19m8-6.75"/>',
	});
	addIcon("material-symbols:folder-outline-rounded", {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h5.175q.4 0 .763.15t.637.425L12 6h8q.825 0 1.413.588T22 8v10q0 .825-.587 1.413T20 20zm0-2h16V8h-8.825l-2-2H4zm0 0V6z"/>',
	});
	addIcon("material-symbols:label-outline-rounded", {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h11q.475 0 .9.213t.7.587l4.5 6q.4.525.4 1.2t-.4 1.2l-4.5 6q-.275.375-.7.588T15 20zm0-2h11l4.5-6L15 6H4zm7.75-6"/>',
	});
	addIcon("fa6-solid:torii-gate", {
		width: 512,
		height: 512,
		body: '<path fill="currentColor" d="M0 80c0 26.5 21.5 48 48 48h16v64h64v-64h96v64h64v-64h96v64h64v-64h16c26.5 0 48-21.5 48-48V13.4C512 6 506 0 498.6 0c-1.7 0-3.4.3-5 1l-49 19.6C425.7 28.1 405.5 32 385.2 32H126.8c-20.4 0-40.5-3.9-59.4-11.4L18.4 1c-1.6-.6-3.3-1-5-1C6 0 0 6 0 13.4zm64 208v192c0 17.7 14.3 32 32 32s32-14.3 32-32V288h256v192c0 17.7 14.3 32 32 32s32-14.3 32-32V288h32c17.7 0 32-14.3 32-32s-14.3-32-32-32H32c-17.7 0-32 14.3-32 32s14.3 32 32 32z"/>',
	});
	addIcon("material-symbols:movie-outline-rounded", {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="m4 4l1.625 3.25q.175.35.5.55t.7.2q.75 0 1.15-.638t.05-1.312L7 4h2l1.625 3.25q.175.35.5.55t.7.2q.75 0 1.15-.638t.05-1.312L12 4h2l1.625 3.25q.175.35.5.55t.7.2q.75 0 1.15-.638t.05-1.312L17 4h3q.825 0 1.413.587T22 6v12q0 .825-.587 1.413T20 20H4q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4m0 6v8h16v-8zm0 0v8z"/>',
	});
	addIcon("material-symbols:sports-esports-outline-rounded", {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="M4.55 19q-1.275 0-1.975-.888T2.05 15.95l1.05-7.5q.225-1.5 1.338-2.475T7.05 5h9.9q1.5 0 2.613.975T20.9 8.45l1.05 7.5q.175 1.275-.525 2.163T19.45 19q-.525 0-.975-.187t-.825-.563L15.4 16H8.6l-2.25 2.25q-.375.375-.825.563T4.55 19m.4-2.15L7.8 14h8.4l2.85 2.85q.05.05.4.15q.275 0 .438-.162T20 16.4l-1.1-7.7q-.1-.725-.65-1.212T16.95 7h-9.9q-.75 0-1.3.488T5.1 8.7L4 16.4q-.05.275.113.438T4.55 17q.05 0 .4-.15m12.763-4.137Q18 12.425 18 12t-.288-.712T17 11t-.712.288T16 12t.288.713T17 13t.713-.288m-2-3Q16 9.426 16 9t-.288-.712T15 8t-.712.288T14 9t.288.713T15 10t.713-.288M7.75 11.25v1q0 .325.213.538T8.5 13t.538-.213t.212-.537v-1h1q.325 0 .538-.213T11 10.5t-.213-.537t-.537-.213h-1v-1q0-.325-.213-.537T8.5 8t-.537.213t-.213.537v1h-1q-.325 0-.537.213T6 10.5t.213.538t.537.212z"/>',
	});
	addIcon("material-symbols:archive-outline-rounded", {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="M11.288 10.288Q11 10.575 11 11v3.2l-.9-.9q-.275-.275-.7-.275t-.7.275t-.275.7t.275.7l2.6 2.6q.3.3.7.3t.7-.3l2.6-2.6q.275-.275.275-.7t-.275-.7t-.7-.275t-.7.275l-.9.9V11q0-.425-.288-.712T12 10t-.712.288M5 8v11h14V8zm0 13q-.825 0-1.412-.587T3 19V6.525q0-.35.113-.675t.337-.6L4.7 3.725q.275-.35.687-.538T6.25 3h11.5q.45 0 .863.188t.687.537l1.25 1.525q.225.275.338.6t.112.675V19q0 .825-.587 1.413T19 21zm.4-15h13.2l-.85-1H6.25zm6.6 7.5"/>',
	});
	addIcon("material-symbols:info-outline-rounded", {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="M12.713 16.713Q13 16.425 13 16v-4q0-.425-.288-.712T12 11t-.712.288T11 12v4q0 .425.288.713T12 17t.713-.288m0-8Q13 8.425 13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9t.713-.288M12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/>',
	});
	addIcon("material-symbols:bookmarks-rounded", {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="M4 22V6q0-.825.588-1.412T6 4h12q.825 0 1.413.588T20 6v16l-8-3.5zm2-3.05l6-2.625l6 2.625V6H6zM4 4h16V2H4z"/>',
	});
	addIcon("material-symbols:menu-book-outline-rounded", {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="M6.5 17q1.125 0 2.2-.288T10.75 16q.925-.5 1.938-.775T14.625 15q1.125 0 2.2.288t2.05.862q.313.175.613.263t.612.087q.575 0 1.013-.288T20 18.15V6.1q0-.275-.137-.525T19.45 5.2q-1.175-.575-2.412-.888T14.5 4q-1.45 0-2.837.375T9 5.5q-1.275-.75-2.662-1.125T3.5 4q-1.3 0-2.538.313T1.55 5.2q-.275.125-.412.375T1 6.1v12.05q0 .575.488.875t1.012.025q.925-.5 1.938-.775T6.5 17M3 16.6V6.7q.875-.35 1.738-.525T6.5 6q1.1 0 2.175.3t2.175.9v9.85q-1.1-.525-2.212-.787T6.5 16q-.9 0-1.762.15T3 16.6m18 0q-.875-.35-1.737-.525T17.5 16q-1.1 0-2.212.788T13 17.05V7.2q1.025-.6 2.175-.9T17.5 6q.9 0 1.763.15T21 6.6zM14 9.9q.95-.225 1.825-.225t1.825.225q.6.225 1.213.338T20 10.6v-1.6q-.6-.225-1.225-.25T17.5 8.5q-.775 0-1.525.125t-1.45.375zm0 2.75q.95-.237 1.825-.237t1.825.237q.6.225 1.213.338T20 13.35v-1.6q-.6-.225-1.225-.25T17.5 11.25q-.775 0-1.525.125T14 11.75zm0 2.75q.95-.225 1.825-.225t1.825.225q.6.225 1.213.338T20 16.1v-1.6q-.6-.225-1.225-.25T17.5 14q-.775 0-1.525.125t-1.45.375z"/>',
	});
	addIcon("material-symbols:close-rounded", {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275t.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275z"/>',
	});
	addIcon("material-symbols:keyboard-arrow-down", {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="m12 15.4l-6-6L7.4 8l4.6 4.6L16.6 8L18 9.4z"/>',
	});
} catch {}

let open = $state(false);
let activePrimary = $state("");
const openGroups = $state<Record<string, boolean>>({});

const links = resolveNavBarLinks(navBarConfig.links);

const STATIC_ICONS: Record<string, { width: number; height: number; body: string }> = {
	"material-symbols:home-outline-rounded": {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="M6 19h3v-5q0-.425.288-.712T10 13h4q.425 0 .713.288T15 14v5h3v-9l-6-4.5L6 10zm-2 0v-9q0-.475.213-.9t.587-.7l6-4.5q.525-.4 1.2-.4t1.2.4l6 4.5q.375.275.588.7T20 10v9q0 .825-.588 1.413T18 21h-4q-.425 0-.712-.288T13 20v-5h-2v5q0 .425-.288.713T10 21H6q-.825 0-1.412-.587T4 19m8-6.75"/>',
	},
	"material-symbols:folder-outline-rounded": {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h5.175q.4 0 .763.15t.637.425L12 6h8q.825 0 1.413.588T22 8v10q0 .825-.587 1.413T20 20zm0-2h16V8h-8.825l-2-2H4zm0 0V6z"/>',
	},
	"material-symbols:label-outline-rounded": {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h11q.475 0 .9.213t.7.587l4.5 6q.4.525.4 1.2t-.4 1.2l-4.5 6q-.275.375-.7.588T15 20zm0-2h11l4.5-6L15 6H4zm7.75-6"/>',
	},
	"fa6-solid:torii-gate": {
		width: 512,
		height: 512,
		body: '<path fill="currentColor" d="M0 80c0 26.5 21.5 48 48 48h16v64h64v-64h96v64h64v-64h96v64h64v-64h16c26.5 0 48-21.5 48-48V13.4C512 6 506 0 498.6 0c-1.7 0-3.4.3-5 1l-49 19.6C425.7 28.1 405.5 32 385.2 32H126.8c-20.4 0-40.5-3.9-59.4-11.4L18.4 1c-1.6-.6-3.3-1-5-1C6 0 0 6 0 13.4zm64 208v192c0 17.7 14.3 32 32 32s32-14.3 32-32V288h256v192c0 17.7 14.3 32 32 32s32-14.3 32-32V288h32c17.7 0 32-14.3 32-32s-14.3-32-32-32H32c-17.7 0-32 14.3-32 32s14.3 32 32 32z"/>',
	},
	"material-symbols:movie-outline-rounded": {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="m4 4l1.625 3.25q.175.35.5.55t.7.2q.75 0 1.15-.638t.05-1.312L7 4h2l1.625 3.25q.175.35.5.55t.7.2q.75 0 1.15-.638t.05-1.312L12 4h2l1.625 3.25q.175.35.5.55t.7.2q.75 0 1.15-.638t.05-1.312L17 4h3q.825 0 1.413.587T22 6v12q0 .825-.587 1.413T20 20H4q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4m0 6v8h16v-8zm0 0v8z"/>',
	},
	"material-symbols:sports-esports-outline-rounded": {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="M4.55 19q-1.275 0-1.975-.888T2.05 15.95l1.05-7.5q.225-1.5 1.338-2.475T7.05 5h9.9q1.5 0 2.613.975T20.9 8.45l1.05 7.5q.175 1.275-.525 2.163T19.45 19q-.525 0-.975-.187t-.825-.563L15.4 16H8.6l-2.25 2.25q-.375.375-.825.563T4.55 19m.4-2.15L7.8 14h8.4l2.85 2.85q.05.05.4.15q.275 0 .438-.162T20 16.4l-1.1-7.7q-.1-.725-.65-1.212T16.95 7h-9.9q-.75 0-1.3.488T5.1 8.7L4 16.4q-.05.275.113.438T4.55 17q.05 0 .4-.15m12.763-4.137Q18 12.425 18 12t-.288-.712T17 11t-.712.288T16 12t.288.713T17 13t.713-.288m-2-3Q16 9.426 16 9t-.288-.712T15 8t-.712.288T14 9t.288.713T15 10t.713-.288M7.75 11.25v1q0 .325.213.538T8.5 13t.538-.213t.212-.537v-1h1q.325 0 .538-.213T11 10.5t-.213-.537t-.537-.213h-1v-1q0-.325-.213-.537T8.5 8t-.537.213t-.213.537v1h-1q-.325 0-.537.213T6 10.5t.213.538t.537.212z"/>',
	},
	"material-symbols:archive-outline-rounded": {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="M11.288 10.288Q11 10.575 11 11v3.2l-.9-.9q-.275-.275-.7-.275t-.7.275t-.275.7t.275.7l2.6 2.6q.3.3.7.3t.7-.3l2.6-2.6q.275-.275.275-.7t-.275-.7t-.7-.275t-.7.275l-.9.9V11q0-.425-.288-.712T12 10t-.712.288M5 8v11h14V8zm0 13q-.825 0-1.412-.587T3 19V6.525q0-.35.113-.675t.337-.6L4.7 3.725q.275-.35.687-.538T6.25 3h11.5q.45 0 .863.188t.687.537l1.25 1.525q.225.275.338.6t.112.675V19q0 .825-.587 1.413T19 21zm.4-15h13.2l-.85-1H6.25zm6.6 7.5"/>',
	},
	"material-symbols:info-outline-rounded": {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="M12.713 16.713Q13 16.425 13 16v-4q0-.425-.288-.712T12 11t-.712.288T11 12v4q0 .425.288.713T12 17t.713-.288m0-8Q13 8.425 13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9t.713-.288M12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/>',
	},
	"material-symbols:bookmarks-rounded": {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="M4 22V6q0-.825.588-1.412T6 4h12q.825 0 1.413.588T20 6v16l-8-3.5zm2-3.05l6-2.625l6 2.625V6H6zM4 4h16V2H4z"/>',
	},
	"material-symbols:menu-book-outline-rounded": {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="M6.5 17q1.125 0 2.2-.288T10.75 16q.925-.5 1.938-.775T14.625 15q1.125 0 2.2.288t2.05.862q.313.175.613.263t.612.087q.575 0 1.013-.288T20 18.15V6.1q0-.275-.137-.525T19.45 5.2q-1.175-.575-2.412-.888T14.5 4q-1.45 0-2.837.375T9 5.5q-1.275-.75-2.662-1.125T3.5 4q-1.3 0-2.538.313T1.55 5.2q-.275.125-.412.375T1 6.1v12.05q0 .575.488.875t1.012.025q.925-.5 1.938-.775T6.5 17M3 16.6V6.7q.875-.35 1.738-.525T6.5 6q1.1 0 2.175.3t2.175.9v9.85q-1.1-.525-2.212-.787T6.5 16q-.9 0-1.762.15T3 16.6m18 0q-.875-.35-1.737-.525T17.5 16q-1.1 0-2.212.788T13 17.05V7.2q1.025-.6 2.175-.9T17.5 6q.9 0 1.763.15T21 6.6zM14 9.9q.95-.225 1.825-.225t1.825.225q.6.225 1.213.338T20 10.6v-1.6q-.6-.225-1.225-.25T17.5 8.5q-.775 0-1.525.125t-1.45.375zm0 2.75q.95-.237 1.825-.237t1.825.237q.6.225 1.213.338T20 13.35v-1.6q-.6-.225-1.225-.25T17.5 11.25q-.775 0-1.525.125T14 11.75zm0 2.75q.95-.225 1.825-.225t1.825.225q.6.225 1.213.338T20 16.1v-1.6q-.6-.225-1.225-.25T17.5 14q-.775 0-1.525.125t-1.45.375z"/>',
	},
	"material-symbols:close-rounded": {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275t.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275z"/>',
	},
	"material-symbols:keyboard-arrow-down": {
		width: 24,
		height: 24,
		body: '<path fill="currentColor" d="m12 15.4l-6-6L7.4 8l4.6 4.6L16.6 8L18 9.4z"/>',
	},
};

function resolveItemIcon(name?: string) {
	if (!name) return undefined;
	return STATIC_ICONS[name] || name;
}

const primaryItems = links.map((link) => {
	const key = link.name.toLowerCase();
	let iconName = link.icon;
	if (link.pageKey === "tags" || key.includes("тег") || key.includes("tag") || link.url?.includes("/tags")) {
		iconName = link.icon || "material-symbols:label-outline-rounded";
	}

	return {
		value: key,
		label: link.name,
		icon: resolveItemIcon(iconName),
		href: link.url ? (link.external ? link.url : url(link.url)) : undefined,
		external: !!link.external,
		pageKey: link.pageKey ?? "",
		children: link.children?.map((child) => ({
			value: child.name.toLowerCase(),
			label: child.name,
			icon: resolveItemIcon(child.icon),
			href: child.url
				? child.external
					? child.url
					: url(child.url)
				: undefined,
			external: !!child.external,
			pageKey: child.pageKey ?? "",
		})),
	};
});

function syncFromRoute() {
	const currentUrl = new URL(window.location.href);
	const path = currentUrl.pathname.replace(/\/+$/, "") || "/";
	const containerPage = typeof document !== "undefined" ? document.getElementById("swup-container")?.getAttribute("data-current-page") : null;
	const segments = path.split("/").filter(Boolean);
	const pageKey = resolvePageKey(currentUrl) || containerPage || (segments.length === 1 ? segments[0] : "");
	activePrimary = "";
	for (const item of primaryItems) {
		if (item.pageKey && item.pageKey === pageKey) {
			activePrimary = item.value;
			break;
		}
		const activeChild = item.children?.find(
			(child) => child.pageKey && child.pageKey === pageKey,
		);
		if (activeChild) {
			activePrimary = activeChild.value;
			openGroups[item.value] = true;
			break;
		}
	}
}

function handleNavClick() {
	open = false;
}

function toggleGroup(group: string) {
	openGroups[group] = !openGroups[group];
}

onMount(() => {
	syncFromRoute();
	const onToggle = () => {
		open = !open;
		if (open) {
			tick().then(() => {
				drawerEl?.querySelector<HTMLElement>("a, button")?.focus();
			});
		}
	};
	const onKey = (e: KeyboardEvent) => {
		if (e.key === "Escape") open = false;
	};
	document.addEventListener("site-drawer:toggle", onToggle);
	document.addEventListener("swup:content:replace", syncFromRoute);
	window.addEventListener("keydown", onKey);
	return () => {
		document.removeEventListener("site-drawer:toggle", onToggle);
		document.removeEventListener("swup:content:replace", syncFromRoute);
		window.removeEventListener("keydown", onKey);
	};
});

let isDragging = $state(false);
let startX = 0;
let startY = 0;
let currentTranslateX = $state(0);
let isHorizontalGesture = false;
let gestureDecided = false;

function handleTouchStart(e: TouchEvent) {
	if (!open || e.touches.length !== 1) return;
	const touch = e.touches[0];
	startX = touch.clientX;
	startY = touch.clientY;
	isDragging = true;
	currentTranslateX = 0;
	isHorizontalGesture = false;
	gestureDecided = false;
}

function handleTouchMove(e: TouchEvent) {
	if (!isDragging || e.touches.length !== 1) return;
	const touch = e.touches[0];
	const deltaX = touch.clientX - startX;
	const deltaY = touch.clientY - startY;

	if (!gestureDecided) {
		if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
			gestureDecided = true;
			isHorizontalGesture = Math.abs(deltaX) > Math.abs(deltaY);
		}
	}

	if (isHorizontalGesture) {
		// Для левого меню закрывающий свайп направлен влево (deltaX < 0)
		if (deltaX < 0) {
			currentTranslateX = deltaX;
			if (e.cancelable) e.preventDefault();
		} else {
			// Эластичное сопротивление вправо
			currentTranslateX = deltaX * 0.15;
		}
	}
}

function handleTouchEnd() {
	if (!isDragging) return;
	isDragging = false;
	// Порог закрытия: если сдвинули влево более чем на 75px
	if (isHorizontalGesture && currentTranslateX < -75) {
		open = false;
	}
	currentTranslateX = 0;
	gestureDecided = false;
	isHorizontalGesture = false;
}

let drawerEl: HTMLElement | undefined = $state();
</script>

<div
	class="site-drawer"
	class:site-drawer--open={open}
>
	<div class="site-drawer__scrim" aria-hidden="true" onclick={() => (open = false)}></div>
	<aside
		bind:this={drawerEl}
		class="site-drawer__panel"
		role="dialog"
		aria-modal="true"
		aria-label={siteConfig.title}
		style={isDragging && currentTranslateX < 0 ? `transform: translateX(${currentTranslateX}px); transition: none;` : undefined}
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
		ontouchcancel={handleTouchEnd}
	>
		<div class="site-drawer__header">
			<div class="site-drawer__brand">
				<div class="site-drawer__title">{siteConfig.title}</div>
				{#if siteConfig.subtitle}
					<div class="site-drawer__subtitle">{siteConfig.subtitle}</div>
				{/if}
			</div>
			<button
				type="button"
				class="site-drawer__close-btn m3-state-layer"
				onclick={() => (open = false)}
				aria-label="Закрыть меню"
				title="Закрыть"
			>
				<Icon icon="material-symbols:close-rounded" />
			</button>
		</div>

		<nav class="site-drawer__nav" aria-label="Navigation drawer">
			{#each primaryItems as item (item.value)}
				{#if item.children}
					<div class="site-drawer__group">
						<button
							type="button"
							class="site-drawer__group-head"
							class:site-drawer__item--active={item.children.some((child) => activePrimary === child.value)}
							onclick={() => toggleGroup(item.value)}
							aria-expanded={openGroups[item.value] ?? false}
						>
							{#if item.icon}
								<span class="site-drawer__group-icon" aria-hidden="true">
									<Icon icon={item.icon} />
								</span>
							{/if}
							<span class="site-drawer__group-label">{item.label}</span>
							<Icon
								class={openGroups[item.value] ? "site-drawer__group-arrow site-drawer__group-arrow--open" : "site-drawer__group-arrow"}
								icon="material-symbols:keyboard-arrow-down"
							/>
						</button>
						{#if openGroups[item.value]}
							<div class="site-drawer__group-body">
								{#each item.children as child (child.value)}
									<a
										href={child.href}
										class="site-drawer__item site-drawer__item--child"
										class:site-drawer__item--active={activePrimary === child.value}
										aria-current={activePrimary === child.value ? "page" : undefined}
										target={child.external ? "_blank" : undefined}
										rel={child.external ? "noopener noreferrer" : undefined}
										onclick={handleNavClick}
									>
										{#if child.icon}
											<span class="site-drawer__item-icon" aria-hidden="true">
												<Icon icon={child.icon} />
											</span>
										{/if}
										<span class="site-drawer__item-label">{child.label}</span>
									</a>
								{/each}
							</div>
						{/if}
					</div>
				{:else if item.href}
					<a
						href={item.href}
						class="site-drawer__item"
						class:site-drawer__item--active={activePrimary === item.value}
						aria-current={activePrimary === item.value ? "page" : undefined}
						target={item.external ? "_blank" : undefined}
						rel={item.external ? "noopener noreferrer" : undefined}
						onclick={handleNavClick}
					>
						{#if item.icon}
							<span class="site-drawer__item-icon" aria-hidden="true">
								<Icon icon={item.icon} />
							</span>
						{/if}
						<span class="site-drawer__item-label">{item.label}</span>
					</a>
				{/if}
			{/each}
		</nav>
	</aside>
</div>

<style lang="stylus">
.site-drawer
	position: fixed
	inset: 0
	z-index: 120
	visibility: hidden
	pointer-events: none

	&--open
		visibility: visible
		pointer-events: auto

	&__scrim
		position: absolute
		inset: 0
		background: unquote("color-mix(in srgb, var(--scrim, #000) 65%, transparent)")
		backdrop-filter: blur(8px)
		-webkit-backdrop-filter: blur(8px)
		opacity: 0
		transition: opacity var(--m3e-duration-medium) var(--m3e-easing-standard)

	&--open &__scrim
		opacity: 1

	&__panel
		position: absolute
		top: 0
		bottom: 0
		left: 0
		display: flex
		flex-direction: column
		width: 320px
		max-width: 85vw
		box-sizing: border-box
		background: var(--surface-container-low)
		color: var(--on-surface)
		border-radius: 0 var(--shape-corner-xl, 28px) var(--shape-corner-xl, 28px) 0
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4)
		transform: translateX(-100%)
		transition: transform var(--m3e-duration-long) var(--m3e-easing-emphasized-decelerate)
		z-index: 1

	&--open &__panel
		transform: translateX(0)

	&__header
		display: flex
		align-items: center
		justify-content: space-between
		padding: var(--m3e-space-4) var(--m3e-space-4) var(--m3e-space-2) var(--m3e-space-5)
		flex: none

	&__brand
		flex: 1
		min-width: 0

	&__title
		font: var(--m3e-type-title-large)
		color: var(--on-surface)
		font-weight: 700

	&__subtitle
		margin-top: 2px
		font: var(--m3e-type-body-small)
		color: var(--on-surface-variant)

	&__close-btn
		display: flex
		align-items: center
		justify-content: center
		width: 40px
		height: 40px
		border: none
		border-radius: var(--shape-corner-full, 9999px)
		background: transparent
		color: var(--on-surface-variant)
		cursor: pointer
		transition: background-color var(--m3e-duration-short) ease, color var(--m3e-duration-short) ease

		&:hover
			background: unquote("color-mix(in oklab, var(--on-surface) 8%, transparent)")
			color: var(--on-surface)

		> :global(svg)
			width: 1.35rem
			height: 1.35rem

	&__nav
		flex: 1
		overflow-y: auto
		padding: var(--m3e-space-2) var(--m3e-space-3) var(--m3e-space-4)

	&__item
		display: flex
		align-items: center
		gap: var(--m3e-space-3)
		width: 100%
		min-height: 52px
		box-sizing: border-box
		padding: 0 var(--m3e-space-4)
		border-radius: var(--shape-corner-m, 12px)
		color: var(--on-surface-variant)
		text-decoration: none
		cursor: pointer
		transition:
			background-color var(--m3e-duration-short) var(--m3e-easing-standard),
			color var(--m3e-duration-short) var(--m3e-easing-standard)

		&:hover
			background: unquote("color-mix(in oklab, var(--on-surface) 8%, transparent)")
			color: var(--on-surface)

		&:focus-visible
			outline: 2px solid var(--secondary)
			outline-offset: -2px

		&--active
			background: var(--secondary-container)
			color: var(--on-secondary-container)
			font-weight: 600
			&:hover
				background: var(--secondary-container)

		&--child
			min-height: 44px
			padding-left: var(--m3e-space-8)

	&__item-icon
		display: flex
		flex: none
		color: var(--on-surface-variant)
		> :global(svg)
			width: 1.35rem
			height: 1.35rem

	&__item--active &__item-icon
		color: var(--on-secondary-container)

	&__item-label
		flex: 1
		min-width: 0
		font: var(--m3e-type-label-large)
		white-space: nowrap
		overflow: hidden
		text-overflow: ellipsis

	&__item--child &__item-label
		font: var(--m3e-type-body-medium)

	&__group
		margin-top: 4px

	&__group-head
		display: flex
		align-items: center
		gap: 12px
		width: 100%
		min-height: 52px
		box-sizing: border-box
		padding: 0 16px
		border: none
		border-radius: var(--shape-corner-m, 12px)
		background: none
		color: var(--on-surface-variant)
		cursor: pointer
		transition: background-color var(--m3e-duration-short) var(--m3e-easing-standard)
		&:hover
			background: unquote("color-mix(in oklab, var(--on-surface) 8%, transparent)")
		&:focus-visible
			outline: 2px solid var(--secondary)
			outline-offset: -2px

	&__group-icon
		display: flex
		flex: none
		> :global(svg)
			width: 1.35rem
			height: 1.35rem

	&__group-label
		flex: 1
		text-align: left
		font: var(--m3e-type-label-large)
		color: var(--on-surface-variant)

	&__group-arrow
		display: flex
		flex: none
		transition: transform var(--m3e-duration-short) var(--m3e-easing-standard)
		> :global(svg)
			width: 1.25rem
			height: 1.25rem

		&--open
			transform: rotate(180deg)

	&__group-body
		padding: 4px 0 8px
</style>
