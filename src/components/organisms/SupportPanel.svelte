<script lang="ts">
/**
 * SupportPanel.svelte — M3 Expressive Bento сетка поддержки автора:
 * 1. Инлайн векторные иконки (100% надёжность без внешних зависимостей Iconify).
 * 2. Аутентичный фирменный логотип Steam, кошелёк, карточка, подарок, шаринг и Telegram.
 * 3. Единые пропорции и гармоничный контраст в светлой и тёмной темах.
 */
import { supportConfig } from "../../config/domains/supportConfig";

let copied = false;
let copyTimeout: ReturnType<typeof setTimeout> | undefined;

async function handleShare() {
	const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://nullvert.uz";
	try {
		if (navigator.clipboard) {
			await navigator.clipboard.writeText(shareUrl);
			copied = true;
			clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => {
				copied = false;
			}, 2500);
		}
	} catch {
		// Fallback
	}
}
</script>

<div class="support-panel flex flex-col gap-6 w-full">
	<div class="bento-grid grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 w-full">
		<!-- 1. Taps (50% — 6 колонок) -->
		{#if supportConfig.taps.enable}
			<a
				href={supportConfig.taps.url}
				target="_blank"
				rel="noopener noreferrer"
				class="support-card support-card--primary md:col-span-6 p-7 sm:p-8 rounded-[var(--shape-corner-xl,28px)] flex flex-col justify-between gap-8 transition-all group min-h-[13.5rem]"
			>
				<div class="flex items-start justify-between gap-4">
					<div class="flex items-center gap-3.5">
						<div class="support-icon-wrap support-icon-wrap--taps flex items-center justify-center shrink-0">
							<!-- Lucide style: Wallet (тонкий контур 1.8px) -->
							<svg viewBox="0 0 24 24" class="w-5.5 h-5.5 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round" aria-hidden="true">
								<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
								<path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
								<circle cx="17.5" cy="12.5" r=".5" fill="currentColor" />
							</svg>
						</div>
						<div class="flex flex-col">
							<span class="support-tag text-[11px] uppercase tracking-wider font-bold">
								{supportConfig.taps.badge}
							</span>
							<h2 class="text-2xl font-extrabold text-[var(--on-surface)] group-hover:text-[var(--primary)] transition-colors tracking-tight">
								{supportConfig.taps.title}
							</h2>
						</div>
					</div>

					<div class="card-arrow-badge flex items-center justify-center shrink-0">
						<svg viewBox="0 0 24 24" class="w-4.5 h-4.5 stroke-current fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true">
							<path d="M7 17L17 7M17 7H9M17 7V15" />
						</svg>
					</div>
				</div>

				<div class="flex flex-col gap-2 mt-auto">
					<p class="text-sm text-[var(--on-surface-variant)] leading-normal font-medium">
						{supportConfig.taps.methods}
					</p>
					<div class="text-xs text-[var(--on-surface-variant)] opacity-70 flex flex-wrap gap-x-2 font-medium">
						<span>Мин. 5 000 сум</span>
						<span>•</span>
						<span>Комиссия ~10%</span>
					</div>
				</div>
			</a>
		{/if}

		<!-- 2. Tribute (50% — 6 колонок) -->
		{#if supportConfig.tribute.enable}
			<a
				href={supportConfig.tribute.url}
				target="_blank"
				rel="noopener noreferrer"
				class="support-card support-card--secondary md:col-span-6 p-7 sm:p-8 rounded-[var(--shape-corner-xl,28px)] flex flex-col justify-between gap-8 transition-all group min-h-[13.5rem]"
			>
				<div class="flex items-start justify-between gap-4">
					<div class="flex items-center gap-3.5">
						<div class="support-icon-wrap support-icon-wrap--tribute flex items-center justify-center shrink-0">
							<!-- Lucide style: Credit Card (тонкий контур 1.8px) -->
							<svg viewBox="0 0 24 24" class="w-5.5 h-5.5 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round" aria-hidden="true">
								<rect width="20" height="14" x="2" y="5" rx="3" />
								<line x1="2" x2="22" y1="10" y2="10" />
								<line x1="6" x2="10" y1="15" y2="15" />
							</svg>
						</div>
						<div class="flex flex-col">
							<span class="support-tag text-[11px] uppercase tracking-wider font-bold">
								{supportConfig.tribute.badge}
							</span>
							<h2 class="text-2xl font-extrabold text-[var(--on-surface)] group-hover:text-[var(--primary)] transition-colors tracking-tight">
								{supportConfig.tribute.title}
							</h2>
						</div>
					</div>

					<div class="card-arrow-badge flex items-center justify-center shrink-0">
						<svg viewBox="0 0 24 24" class="w-4.5 h-4.5 stroke-current fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true">
							<path d="M7 17L17 7M17 7H9M17 7V15" />
						</svg>
					</div>
				</div>

				<div class="flex flex-col gap-2 mt-auto">
					<p class="text-sm text-[var(--on-surface-variant)] leading-normal font-medium">
						{supportConfig.tribute.methods}
					</p>
					<div class="text-xs text-[var(--on-surface-variant)] opacity-70 flex flex-wrap gap-x-2 font-medium">
						<span>Мин. 100 ₽</span>
						<span>•</span>
						<span>Комиссия сервиса</span>
					</div>
				</div>
			</a>
		{/if}

		<!-- 3. Steam Wishlist (6 колонок) -->
		{#if supportConfig.wishlists && supportConfig.wishlists[0]}
			{@const steam = supportConfig.wishlists[0]}
			<a
				href={steam.url}
				target="_blank"
				rel="noopener noreferrer"
				class="support-card support-card--row md:col-span-6 p-6 sm:p-6.5 rounded-[var(--shape-corner-xl,24px)] flex items-center justify-between gap-5 transition-all group min-h-[5.75rem]"
			>
				<div class="flex items-center gap-4.5 min-w-0">
					<div class="support-icon-wrap support-icon-wrap--steam flex items-center justify-center shrink-0">
						<!-- Lucide / Outline style Gamepad (изящный контур) -->
						<svg viewBox="0 0 24 24" class="w-5.5 h-5.5 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round" aria-hidden="true">
							<line x1="6" x2="10" y1="12" y2="12" />
							<line x1="8" x2="8" y1="10" y2="14" />
							<line x1="15" x2="15.01" y1="13" y2="13" stroke-width="2.5" />
							<line x1="18" x2="18.01" y1="11" y2="11" stroke-width="2.5" />
							<rect width="20" height="12" x="2" y="6" rx="6" />
						</svg>
					</div>
					<div class="flex flex-col gap-0.5 min-w-0">
						<span class="text-base font-bold text-[var(--on-surface)] group-hover:text-[var(--primary)] transition-colors leading-snug">
							{steam.title}
						</span>
						<span class="text-xs sm:text-sm text-[var(--on-surface-variant)] leading-normal">
							{steam.subtitle}
						</span>
					</div>
				</div>

				<div class="card-arrow-badge flex items-center justify-center shrink-0">
					<svg viewBox="0 0 24 24" class="w-4.5 h-4.5 stroke-current fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true">
						<path d="M7 17L17 7M17 7H9M17 7V15" />
					</svg>
				</div>
			</a>
		{/if}

		<!-- 4. Followish (6 колонок) -->
		{#if supportConfig.wishlists && supportConfig.wishlists[1]}
			{@const followish = supportConfig.wishlists[1]}
			<a
				href={followish.url}
				target="_blank"
				rel="noopener noreferrer"
				class="support-card support-card--row md:col-span-6 p-6 sm:p-6.5 rounded-[var(--shape-corner-xl,24px)] flex items-center justify-between gap-5 transition-all group min-h-[5.75rem]"
			>
				<div class="flex items-center gap-4.5 min-w-0">
					<div class="support-icon-wrap support-icon-wrap--followish flex items-center justify-center shrink-0">
						<!-- Lucide style: Gift (изящный контур 1.8px) -->
						<svg viewBox="0 0 24 24" class="w-5.5 h-5.5 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round" aria-hidden="true">
							<rect x="3" y="8" width="18" height="4" rx="1" />
							<path d="M12 8v13" />
							<path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
							<path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
						</svg>
					</div>
					<div class="flex flex-col gap-1 min-w-0">
						<span class="text-base sm:text-[1.0625rem] font-bold text-[var(--on-surface)] group-hover:text-[var(--primary)] transition-colors leading-snug">
							{followish.title}
						</span>
						<span class="text-xs sm:text-sm text-[var(--on-surface-variant)] leading-normal">
							{followish.subtitle}
						</span>
					</div>
				</div>

				<div class="card-arrow-badge flex items-center justify-center shrink-0">
					<svg viewBox="0 0 24 24" class="w-4.5 h-4.5 stroke-current fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true">
						<path d="M7 17L17 7M17 7H9M17 7V15" />
					</svg>
				</div>
			</a>
		{/if}

		<!-- 5. Поделиться блогом (6 колонок) -->
		{#if supportConfig.freeWays && supportConfig.freeWays[0]}
			{@const shareItem = supportConfig.freeWays[0]}
			<button
				type="button"
				on:click={handleShare}
				class="support-card support-card--row md:col-span-6 p-6 sm:p-6.5 rounded-[var(--shape-corner-xl,24px)] flex items-center justify-between gap-4 transition-all group cursor-pointer text-left w-full min-h-[5.75rem]"
			>
				<div class="flex items-center gap-4.5 min-w-0 flex-1 pr-2">
					<div class="support-icon-wrap support-icon-wrap--share flex items-center justify-center shrink-0">
						{#if copied}
							<!-- Lucide style: Check -->
							<svg viewBox="0 0 24 24" class="w-5.5 h-5.5 stroke-current fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round text-[var(--primary)]" aria-hidden="true">
								<polyline points="20 6 9 17 4 12" />
							</svg>
						{:else}
							<!-- Lucide style: Share2 -->
							<svg viewBox="0 0 24 24" class="w-5.5 h-5.5 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round" aria-hidden="true">
								<circle cx="18" cy="5" r="3" />
								<circle cx="6" cy="12" r="3" />
								<circle cx="18" cy="19" r="3" />
								<line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
								<line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
							</svg>
						{/if}
					</div>
					<div class="flex flex-col gap-1 min-w-0 flex-1">
						<span class="text-base sm:text-[1.0625rem] font-bold text-[var(--on-surface)] group-hover:text-[var(--primary)] transition-colors leading-snug">
							{copied ? "Ссылка скопирована!" : shareItem.title}
						</span>
						<span class="text-xs sm:text-sm text-[var(--on-surface-variant)] leading-normal truncate">
							{copied ? "Спасибо за вашу поддержку!" : shareItem.subtitle}
						</span>
					</div>
				</div>

				<div class="card-arrow-badge flex items-center justify-center shrink-0 ml-auto">
					{#if copied}
						<svg viewBox="0 0 24 24" class="w-4.5 h-4.5 stroke-current fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round text-[var(--primary)]" aria-hidden="true">
							<polyline points="20 6 9 17 4 12" />
						</svg>
					{:else}
						<!-- Lucide style: Copy -->
						<svg viewBox="0 0 24 24" class="w-4.5 h-4.5 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round transition-transform group-hover:scale-110" aria-hidden="true">
							<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
							<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
						</svg>
					{/if}
				</div>
			</button>
		{/if}

		<!-- 6. Сообщения канала (6 колонок) -->
		{#if supportConfig.freeWays && supportConfig.freeWays[1]}
			{@const chatItem = supportConfig.freeWays[1]}
			<a
				href={chatItem.url}
				target="_blank"
				rel="noopener noreferrer"
				class="support-card support-card--row md:col-span-6 p-6 sm:p-6.5 rounded-[var(--shape-corner-xl,24px)] flex items-center justify-between gap-4 transition-all group min-h-[5.75rem]"
			>
				<div class="flex items-center gap-4.5 min-w-0 flex-1 pr-2">
					<div class="support-icon-wrap support-icon-wrap--chat flex items-center justify-center shrink-0">
						<!-- Lucide style: Send / Paper plane (тонкий контур) -->
						<svg viewBox="0 0 24 24" class="w-5.5 h-5.5 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round" aria-hidden="true">
							<line x1="22" y1="2" x2="11" y2="13" />
							<polygon points="22 2 15 22 11 13 2 9 22 2" />
						</svg>
					</div>
					<div class="flex flex-col gap-1 min-w-0 flex-1">
						<span class="text-base sm:text-[1.0625rem] font-bold text-[var(--on-surface)] group-hover:text-[var(--primary)] transition-colors leading-snug">
							{chatItem.title}
						</span>
						<span class="text-xs sm:text-sm text-[var(--on-surface-variant)] leading-normal truncate">
							{chatItem.subtitle}
						</span>
					</div>
				</div>

				<div class="card-arrow-badge flex items-center justify-center shrink-0 ml-auto">
					<svg viewBox="0 0 24 24" class="w-4.5 h-4.5 stroke-current fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true">
						<path d="M7 17L17 7M17 7H9M17 7V15" />
					</svg>
				</div>
			</a>
		{/if}
	</div>
</div>

<style>
/* ── Карточки: Material 3 Expressive Container ── */
.support-card {
	position: relative;
	backdrop-filter: blur(16px);
	-webkit-backdrop-filter: blur(16px);
	transition:
		background var(--m3e-duration-medium) var(--m3e-easing-standard),
		border-color var(--m3e-duration-medium) var(--m3e-easing-standard),
		box-shadow var(--m3e-duration-medium) var(--m3e-easing-standard),
		transform var(--m3e-duration-medium) var(--m3e-easing-standard);
}

/* Светлая и тёмная тема: единый фон var(--shirone-card-bg) без теней и рамок */
.support-card {
	background: var(--shirone-card-bg) !important;
	backdrop-filter: var(--shirone-card-blur) !important;
	-webkit-backdrop-filter: var(--shirone-card-blur) !important;
	border: none !important;
	box-shadow: none !important;
}

.support-card:hover {
	background: var(--shirone-card-bg-hover) !important;
	border: none !important;
	box-shadow: none !important;
	transform: translateY(-2px);
}

/* Метки над заголовками */
.support-tag {
	color: var(--primary);
	opacity: 0.9;
}

/* ── Иконки в скругленных контейнерах ── */
.support-icon-wrap {
	width: 2.75rem;
	height: 2.75rem;
	border-radius: var(--shape-corner-medium, 14px);
	transition: transform var(--m3e-duration-short) var(--m3e-easing-standard);
}

.support-card:hover .support-icon-wrap {
	transform: scale(1.05);
}

/* Иконки в светлой теме: чистый акцентный тон */
:root:not(.dark) .support-icon-wrap--taps {
	background: color-mix(in srgb, var(--primary) 12%, var(--surface-container-high));
	color: var(--primary);
}
:root:not(.dark) .support-icon-wrap--tribute {
	background: color-mix(in srgb, var(--primary) 12%, var(--surface-container-high));
	color: var(--primary);
}
:root:not(.dark) .support-icon-wrap--steam {
	background: color-mix(in srgb, var(--primary) 12%, var(--surface-container-high));
	color: var(--primary);
}
:root:not(.dark) .support-icon-wrap--followish {
	background: color-mix(in srgb, var(--primary) 12%, var(--surface-container-high));
	color: var(--primary);
}
:root:not(.dark) .support-icon-wrap--share {
	background: color-mix(in srgb, var(--primary) 12%, var(--surface-container-high));
	color: var(--primary);
}
:root:not(.dark) .support-icon-wrap--chat {
	background: color-mix(in srgb, var(--primary) 12%, var(--surface-container-high));
	color: var(--primary);
}

/* Иконки в тёмной теме: чистый мягкий M3E акцент */
:root.dark .support-icon-wrap--taps,
:root.dark .support-icon-wrap--tribute,
:root.dark .support-icon-wrap--steam,
:root.dark .support-icon-wrap--followish,
:root.dark .support-icon-wrap--share,
:root.dark .support-icon-wrap--chat {
	background: color-mix(in srgb, var(--primary) 18%, var(--surface-container-highest));
	color: var(--primary);
}

/* ── Круглые бейджи стрелочек ── */
.card-arrow-badge {
	width: 2.25rem;
	height: 2.25rem;
	border-radius: var(--shape-corner-full, 999px);
	border: none;
	transition:
		background var(--m3e-duration-short) var(--m3e-easing-standard),
		color var(--m3e-duration-short) var(--m3e-easing-standard);
}

:root:not(.dark) .card-arrow-badge {
	background: color-mix(in srgb, var(--surface-container-highest) 50%, #ffffff);
	border: none;
	color: var(--on-surface-variant);
}

:root:not(.dark) .support-card:hover .card-arrow-badge {
	background: var(--primary);
	border: none;
	color: var(--on-primary);
}

:root.dark .card-arrow-badge {
	background: color-mix(in srgb, var(--surface-container-highest) 70%, transparent);
	border: none;
	color: var(--on-surface-variant);
}

:root.dark .support-card:hover .card-arrow-badge {
	background: var(--primary);
	border: none;
	color: var(--on-primary);
}
</style>
