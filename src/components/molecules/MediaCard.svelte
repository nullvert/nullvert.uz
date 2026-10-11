<script lang="ts">
/**
 * MediaCard — ультра-лаконичная M3E карточка медиа:
 * - В обычном состоянии: чистый постер + название + год/студия (минималистично, без визуального шума).
 * - На постере: аккуратный иконочный бейдж статуса (слева) и стеклянный рейтинг (справа).
 * - При наведении (Hover): плавно выдвигается / проявляется слой с синопсисом, жанрами и прогрессом.
 * - Никаких лишних иконок Play: вся карточка или постер интерактивны.
 */
import Icon from "@iconify/svelte";
import { reveal } from "@utils/motion";
import { url } from "@utils/url-utils";
import type { MediaItemData, MediaProgress } from "@/types/media";

export type { MediaItemData, MediaProgress };

let {
	item,
	aspect = "poster",
	delay = 0,
	showTitle = true,
	showTitleOnPoster = false,
}: {
	item: MediaItemData;
	aspect?: "poster" | "landscape";
	delay?: number;
	showTitle?: boolean;
	showTitleOnPoster?: boolean;
} = $props();

let coverFailed = $state(false);

const showCover = $derived(Boolean(item.cover) && !coverFailed);

const progressPercent = $derived(
	item.progress && item.progress.total > 0
		? Math.round(Math.min((item.progress.watched / item.progress.total) * 100, 100))
		: 0,
);

const metaLine = $derived(
	[item.year, item.authorOrStudio].filter(Boolean).join(" · "),
);

const statusColor = $derived(item.statusColor || "var(--primary)");

const ratingTier = $derived(
	item.rating !== undefined && item.rating > 0
		? item.rating >= 10
			? "masterpiece"
			: item.rating >= 8
				? "great"
				: item.rating <= 3
					? "poor"
					: "normal"
		: "none",
);

// Курсорный блик (Masterpiece): ультра-плавное шелковистое следование (lerp)
let glowRaf = 0;
let glowEl: HTMLElement | null = null;
let tx = 0;
let ty = 0;
let cx = 0;
let cy = 0;
let curDeg = 0;

const glowTick = () => {
	if (!glowEl) {
		glowRaf = 0;
		return;
	}
	cx += (tx - cx) * 0.06;
	cy += (ty - cy) * 0.06;
	const rect = glowEl.getBoundingClientRect();
	const w = rect.width || 1;
	const h = rect.height || 1;

	// Нормализованные координаты [-1 ... 1] для мягкого 3D наклона (6.5°)
	const nx = (cx / w - 0.5) * 2;
	const ny = (cy / h - 0.5) * 2;
	const tiltX = (-ny * 6.5).toFixed(2);
	const tiltY = (nx * 6.5).toFixed(2);

	// Плавная интерполяция угла рамки по кратчайшей дуге (без резких скачков через 0°/360°)
	let targetDeg = (Math.atan2(ny, nx) * (180 / Math.PI) + 90);
	if (targetDeg < 0) targetDeg += 360;
	let diff = (targetDeg - curDeg + 540) % 360 - 180;
	curDeg += diff * 0.08;

	glowEl.style.setProperty("--mx", `${cx.toFixed(1)}px`);
	glowEl.style.setProperty("--my", `${cy.toFixed(1)}px`);
	glowEl.style.setProperty("--px", `${((cx / w) * 100).toFixed(1)}%`);
	glowEl.style.setProperty("--py", `${((cy / h) * 100).toFixed(1)}%`);
	glowEl.style.setProperty("--tilt-x", `${tiltX}deg`);
	glowEl.style.setProperty("--tilt-y", `${tiltY}deg`);
	glowEl.style.setProperty("--angle", `${curDeg.toFixed(1)}deg`);

	glowRaf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.2 || Math.abs(diff) > 0.5) ? requestAnimationFrame(glowTick) : 0;
};

const trackPointer = (event: PointerEvent, snap: boolean) => {
	if (ratingTier !== "masterpiece" || event.pointerType === "touch") return;
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
	glowEl = event.currentTarget as HTMLElement;
	const rect = glowEl.getBoundingClientRect();
	tx = event.clientX - rect.left;
	ty = event.clientY - rect.top;
	if (snap) {
		cx = tx;
		cy = ty;
	}
	if (!glowRaf) glowRaf = requestAnimationFrame(glowTick);
};

const resetPointer = (event: PointerEvent) => {
	if (!glowEl || event.pointerType === "touch") return;
	const rect = glowEl.getBoundingClientRect();
	tx = rect.width * 0.5;
	ty = rect.height * 0.5;
	if (!glowRaf) glowRaf = requestAnimationFrame(glowTick);
};

$effect(() => () => cancelAnimationFrame(glowRaf));
</script>

<article
	class="media-card media-card--{aspect} media-card--rating-{ratingTier}"
	class:media-card--title-on-poster={showTitleOnPoster}
	style={`--media-status-color: ${statusColor};`}
	onpointerenter={(e) => trackPointer(e, true)}
	onpointermove={(e) => trackPointer(e, false)}
	onpointerleave={(e) => resetPointer(e)}
	use:reveal={{ delay }}
>
	<!-- Постер с плавающими иконками-бейджами -->
	<div class="media-card__media-wrap">
		{#snippet mediaContent()}
			{#if showCover}
				<img
					class="media-card__cover"
					src={url(item.cover!)}
					alt={item.title}
					loading="lazy"
					decoding="async"
					fetchpriority="low"
					referrerpolicy="no-referrer"
					onerror={() => (coverFailed = true)}
				/>
			{:else}
				<div class="media-card__placeholder" aria-hidden="true">
					<div class="media-card__placeholder-glow"></div>
					<div class="media-card__placeholder-content">
						<Icon
							icon={aspect === "landscape"
								? "material-symbols:sports-esports-outline-rounded"
								: "material-symbols:movie-outline-rounded"}
							class="media-card__placeholder-icon"
						/>
						<span class="media-card__placeholder-title">{item.title}</span>
						<span class="media-card__placeholder-hint">Нет сети</span>
					</div>
				</div>
			{/if}

			<!-- Полупрозрачные бейджи в верхних углах постера -->
			<!-- Статус: показывается слева вверху (иконка статуса) -->
			{#if item.statusLabel}
				<span
					class="media-card__top-status"
					title={item.statusLabel}
					aria-label={item.statusLabel}
				>
					{#if item.status === "planned" || item.statusIcon === "material-symbols:bookmark-rounded"}
						<svg class="media-card__top-status-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
						</svg>
					{:else if item.statusIcon}
						<Icon icon={item.statusIcon} class="media-card__top-status-icon" aria-hidden="true" />
					{:else}
						<span class="media-card__status-dot" aria-hidden="true"></span>
					{/if}
				</span>
			{/if}

			<!-- Оценка: в правом верхнем углу (числовой бейдж без звездочки) -->
			{#if item.rating !== undefined && item.rating > 0}
				<span class="media-card__top-rating" title={`Оценка: ${item.rating}`}>
					<span class="media-card__top-rating-val">{item.rating}</span>
				</span>
			{/if}


			<!-- Затемнение градиентом -->
			<div class="media-card__scrim" aria-hidden="true"></div>

			<!-- Hover-оверлей поверх постера с названием, мета-шапкой, описанием и деталями -->
			<div class="media-card__overlay">
				<h3 class="media-card__overlay-title" title={item.title}>
					{item.title}
				</h3>

				{#if item.year || item.authorOrStudio}
					<div class="media-card__overlay-meta">
						{#if item.year}
							<span class="media-card__overlay-year">{item.year}</span>
						{/if}
						{#if item.year && item.authorOrStudio}
							<span class="media-card__overlay-dot" aria-hidden="true">·</span>
						{/if}
						{#if item.authorOrStudio}
							<span class="media-card__overlay-extra">{item.authorOrStudio}</span>
						{/if}
					</div>
				{/if}

				<div class="media-card__overlay-details">
					<div class="media-card__overlay-details-inner">
						{#if item.description}
							<p class="media-card__overlay-desc">{item.description}</p>
						{/if}

						{#if item.progress}
							<div class="media-card__overlay-progress">
								<div class="media-card__progress-info">
									<span>Прогресс</span>
									<span>{item.progress.watched} / {item.progress.total} {item.progress.unit ?? ""}</span>
								</div>
								<div class="media-card__progress-track">
									<div class="media-card__progress-fill" style={`width: ${progressPercent}%;`}></div>
								</div>
							</div>
						{/if}

						{#if item.genres && item.genres.length > 0}
							<div class="media-card__overlay-genres">
								{#each item.genres.slice(0, 4) as genre (genre)}
									<span class="media-card__genre-tag">
										{genre}
									</span>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>

		{/snippet}

		{#if item.link}
			<a
				class="media-card__media-link"
				href={item.link}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={item.title}
			>
				{@render mediaContent()}
			</a>
		{:else}
			<div class="media-card__media-link">
				{@render mediaContent()}
			</div>
		{/if}

		<!-- Fancy Hover Border (Temani Afif style): пробегающая рамка из углов с акцентным цветом для всех карточек -->
		{#if ratingTier !== "masterpiece"}
			<div class="media-card__fancy-border" aria-hidden="true"></div>
		{/if}

		<!-- Pure CSS Animated Gradient Border: для золотого (masterpiece) без SVG -->
		{#if ratingTier === "masterpiece"}
			<div class="media-card__foil-shine" aria-hidden="true"></div>
			<div class="media-card__gradient-border" aria-hidden="true"></div>
			<div class="media-card__gold-aura" aria-hidden="true"></div>
		{/if}
	</div>

</article>

<style lang="stylus">
.media-card
	position: relative
	display: flex
	flex-direction: column
	height: 100%
	box-sizing: border-box
	overflow: visible
	border-radius: 0
	background: transparent
	border: none
	box-shadow: none
	transition: transform var(--m3e-duration-medium) var(--m3e-easing-emphasized-decelerate)
	--electric-color: var(--primary)

	&:hover
		/* Мягкий фокус без прыжков карточки */
		z-index: 5

	/* ── Контейнер медиа / постера: строгий прямоугольный срез (0px) ── */
	&__media-wrap
		position: relative
		width: 100%
		aspect-ratio: 2 / 3
		height: auto
		overflow: visible
		border-radius: 0
		background: var(--surface-container-high)
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25)
		flex-shrink: 0
		transform: translateZ(0)
		container-type: inline-size
		/* Размер бейджей растёт с шириной постера: ~12.5% ширины, но не менее 30px и не более 38px */
		--badge-size: unquote("clamp(1.875rem, 12.5cqw, 2.375rem)")
		transition:
			box-shadow var(--m3e-duration-medium) var(--m3e-easing-emphasized-decelerate)

		.media-card:hover &
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4)

	/* ══════════════════════════════════════════════════════════════
	   ГАЧА-ГРЕЙДЫ: ЦВЕТОВЫЕ АКЦЕНТЫ БЕЙДЖЕЙ
	   ══════════════════════════════════════════════════════════════ */

	/* ── Fancy Animated Border (Temani Afif style): пробегающая рамка из углов ── */
	&__fancy-border
		position: absolute
		inset: -2px
		z-index: 10
		pointer-events: none
		--c: var(--electric-color, var(--primary))
		--b: 2.5px
		--_g: unquote("#0000 25%, var(--c) 0")
		background:
			unquote("conic-gradient(from 180deg at top var(--b) right var(--b), var(--_g)) var(--_i, 200%) 0 / 200% var(--_i, var(--b)) no-repeat"),
			unquote("conic-gradient(at bottom var(--b) left var(--b), var(--_g)) 0 var(--_i, 200%) / var(--_i, var(--b)) 200% no-repeat")
		transition: 0.35s ease, background-position 0.35s 0.35s ease
		opacity: 0

		.media-card:hover &
			--_i: 100%
			opacity: 1
			transition: 0.35s ease, background-size 0.35s 0.35s ease

	/* ── Pure CSS Animated Gradient Border: вращающийся золотой луч через mask (без SVG) ── */
	&__gradient-border
		position: absolute
		inset: -2.5px
		z-index: 10
		pointer-events: none
		opacity: 0
		border-radius: 0
		overflow: hidden
		--b: 2.5px
		--_m: unquote("linear-gradient(#000 0 0)")
		-webkit-mask:
			var(--_m) content-box,
			var(--_m)
		-webkit-mask-composite: xor
		mask-composite: exclude
		padding: var(--b)
		box-sizing: border-box
		transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)

		&::before
			content: ""
			position: absolute
			top: -50%
			left: -50%
			width: 200%
			height: 200%
			background: conic-gradient(from 0deg, transparent 0%, transparent 60%, rgba(255, 230, 163, 0.4) 75%, #ffb338 88%, #ffe89e 96%, transparent 100%)
			transform: rotate(var(--angle, 0deg))

		.media-card:hover &
			opacity: 1

	/* ── Золотое свечение и поинтер-ховер (матовый золотой глянец) ── */
	&__gold-aura
		position: absolute
		inset: -6px
		z-index: 1
		pointer-events: none
		opacity: 0
		border-radius: inherit
		background: radial-gradient(180px circle at var(--mx, 50%) var(--my, 50%), rgba(255, 179, 56, 0.28) 0%, rgba(255, 148, 16, 0.08) 50%, transparent 80%)
		filter: blur(14px)
		transition: opacity 0.6s var(--m3e-easing-standard)

		.media-card:hover &
			opacity: 1

	/* ── Foil / Holographic Shine (Masterpiece): коллекционный радужно-золотой призматический перелив ── */
	/* ── Foil / Holographic Shine (Masterpiece): коллекционный радужно-золотой призматический перелив ── */
	&__foil-shine
		position: absolute
		inset: 0
		z-index: 4
		pointer-events: none
		opacity: 0
		border-radius: inherit
		overflow: hidden
		mix-blend-mode: screen
		background:
			linear-gradient(
				unquote("calc(115deg + var(--px, 50%) * 0.4)"),
				transparent 15%,
				rgba(255, 215, 0, 0.45) 35%,
				rgba(255, 120, 220, 0.4) 48%,
				rgba(0, 240, 255, 0.4) 55%,
				rgba(255, 235, 120, 0.5) 65%,
				transparent 85%
			),
			radial-gradient(
				220px circle at var(--mx, 50%) var(--my, 50%),
				rgba(255, 255, 255, 0.5) 0%,
				rgba(255, 215, 0, 0.3) 35%,
				transparent 70%
			)
		background-size: 200% 200%, 100% 100%
		background-position: var(--px, 50%) var(--py, 50%), 0 0
		transition: opacity 0.5s var(--m3e-easing-standard)

		.media-card:hover &
			opacity: 0.9

	/* ── Masterpiece: 3D Tilt + Премиальный золотой матовый глянец на оверлее ── */
	&--rating-masterpiece
		perspective: 1100px

		.media-card__media-wrap
			transform-style: preserve-3d
			transition:
				box-shadow var(--m3e-duration-medium) var(--m3e-easing-emphasized-decelerate),
				transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)

		/* Двухслойный золотой контур: внутренняя тонкая ювелирная грань-паспарту */
		.media-card__media-link::before
			content: ""
			position: absolute
			inset: 0
			z-index: 5
			pointer-events: none
			border: 1px solid rgba(255, 220, 120, 0.28)
			box-shadow: inset 0 0 10px rgba(255, 180, 50, 0.12)
			transition: border-color var(--m3e-duration-short) var(--m3e-easing-standard)

		&:hover .media-card__media-link::before
			border-color: rgba(255, 230, 160, 0.5)

		&:hover .media-card__media-wrap
			transform: unquote("perspective(1100px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)) translateZ(5px)")
			box-shadow: 0 14px 32px rgba(255, 148, 16, 0.22), 0 4px 12px rgba(0, 0, 0, 0.35)

		.media-card__overlay
			background: unquote("linear-gradient(180deg, rgba(255, 195, 77, 0.07) 0%, rgba(15, 23, 42, 0.72) 35%, rgba(10, 15, 29, 0.96) 100%)")
			box-shadow: inset 0 0 40px rgba(255, 180, 50, 0.08)

	/* ── Бейджи редких грейдов ── */
	&--rating-masterpiece,
	&--rating-great,
	&--rating-poor
		.media-card__top-rating-val
			font-weight: 900
			color: var(--on-surface)
			text-shadow: none

	/* ── 1. Золото: 10 / 10 ── */
	&--rating-masterpiece
		--electric-color: #ff9410
		--tier-hi: #ffe6a3
		--tier-lo: #b8741a

	/* ── 2. Фиолетовый: 8 – 9.9 ── */
	&--rating-great
		--electric-color: #b57cff
		--tier-hi: #eadcff
		--tier-lo: #6d3fc4

	/* ── 3. Красный: 3 и ниже (Ухудшенный/разрушенный грейд) ── */
	&--rating-poor
		--electric-color: #c2362f
		--tier-hi: #e88e85
		--tier-lo: #661515

		.media-card__cover
			filter: saturate(50%) brightness(82%) contrast(1.1)
			transition: filter 0.8s var(--m3e-easing-standard)

		&:hover .media-card__cover
			filter: saturate(20%) brightness(65%) contrast(1.2) sepia(18%)

		/* Бейдж с тревожным приглушенным оттенком */
		.media-card__top-rating
			background: rgba(25, 10, 10, 0.82)
			border: 1px solid rgba(194, 54, 47, 0.25)

		.media-card__top-rating-val
			color: #ff8a80
			text-shadow: 0 0 6px rgba(194, 54, 47, 0.6)

	&--poster &__media-wrap
		aspect-ratio: 2 / 3

	&--landscape &__media-wrap
		aspect-ratio: 16 / 9

	&__media-link
		position: relative
		display: block
		width: 100%
		height: 100%
		text-decoration: none
		border-radius: inherit
		overflow: hidden

	&__cover
		display: block
		width: 100%
		height: 100%
		object-fit: cover
		object-position: center
		border-radius: inherit

	&__placeholder
		position: absolute
		inset: 0
		display: flex
		flex-direction: column
		align-items: center
		justify-content: center
		padding: 1rem
		box-sizing: border-box
		color: var(--on-surface-variant)
		background: radial-gradient(circle at 50% 30%, var(--surface-container-high) 0%, var(--surface-container-lowest) 100%)
		overflow: hidden
		user-select: none

	&__placeholder-glow
		position: absolute
		top: -20%
		left: 10%
		width: 80%
		height: 60%
		border-radius: 50%
		background: unquote("radial-gradient(circle, rgba(100, 150, 255, 0.12) 0%, transparent 70%)")
		filter: blur(20px)
		pointer-events: none

	&__placeholder-content
		position: relative
		z-index: 2
		display: flex
		flex-direction: column
		align-items: center
		text-align: center
		gap: 0.5rem
		width: 100%

	:global(.media-card__placeholder-icon)
		width: 2.75rem
		height: 2.75rem
		opacity: 0.55
		color: var(--primary)

	&__placeholder-title
		font: var(--m3e-type-label-medium)
		font-weight: 700
		font-size: 0.8125rem
		line-height: 1.25
		color: var(--on-surface)
		display: -webkit-box
		-webkit-line-clamp: 2
		-webkit-box-orient: vertical
		overflow: hidden
		opacity: 0.85

	&__placeholder-hint
		font: var(--m3e-type-label-small)
		font-size: 0.6875rem
		font-weight: 500
		color: var(--on-surface-variant)
		opacity: 0.65
		padding: 0.125rem 0.5rem
		border-radius: var(--shape-corner-full, 999px)
		background: rgba(255, 255, 255, 0.06)

	&__scrim
		position: absolute
		inset: 0
		pointer-events: none
		border-radius: inherit
		background: linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, transparent 40%, rgba(0, 0, 0, 0.35) 100%)
		opacity: 0.6
		transition: opacity var(--m3e-duration-medium) var(--m3e-easing-standard)

	/* ── Полупрозрачный бейдж статуса: бесшовное слияние с левым верхним углом ── */
	&__top-status
		position: absolute
		top: 0
		left: 0
		z-index: 6
		display: inline-flex
		align-items: center
		justify-content: center
		width: var(--badge-size, 1.875rem)
		height: var(--badge-size, 1.875rem)
		box-sizing: border-box
		border-radius: unquote("0 0 calc(var(--badge-size, 1.875rem) * 0.33) 0")
		background: rgba(15, 23, 42, 0.72)
		backdrop-filter: blur(12px)
		-webkit-backdrop-filter: blur(12px)
		border: none
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3)
		transition:
			background var(--m3e-duration-short) var(--m3e-easing-standard),
			transform var(--m3e-duration-short) var(--m3e-easing-standard)

		&:hover
			background: rgba(15, 23, 42, 0.88)

		:global(.media-card__top-status-icon)
			width: unquote("calc(var(--badge-size, 1.875rem) * 0.57)")
			height: unquote("calc(var(--badge-size, 1.875rem) * 0.57)")
			color: rgba(255, 255, 255, 0.88)
			flex-shrink: 0

	&__status-dot
		width: 0.5rem
		height: 0.5rem
		border-radius: 50%
		background: rgba(255, 255, 255, 0.88)

	/* ── Полупрозрачный бейдж оценки: бесшовное слияние с правым верхним углом ── */
	&__top-rating
		position: absolute
		top: 0
		right: 0
		z-index: 6
		display: inline-flex
		align-items: center
		justify-content: center
		min-width: var(--badge-size, 1.875rem)
		height: var(--badge-size, 1.875rem)
		padding: unquote("0 calc(var(--badge-size, 1.875rem) * 0.23)")
		box-sizing: border-box
		border-radius: unquote("0 0 0 calc(var(--badge-size, 1.875rem) * 0.33)")
		background: rgba(15, 23, 42, 0.72)
		backdrop-filter: blur(12px)
		-webkit-backdrop-filter: blur(12px)
		border: none
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3)
		transition:
			background var(--m3e-duration-short) var(--m3e-easing-standard),
			transform var(--m3e-duration-short) var(--m3e-easing-standard)

		&:hover
			background: rgba(15, 23, 42, 0.88)

	&__top-rating-val
		font-family: ui-monospace, "SF Pro Rounded", "JetBrains Mono Variable", "SFMono-Regular", Menlo, Monaco, Consolas, "Segoe UI", sans-serif
		font-size: unquote("calc(var(--badge-size, 1.875rem) * 0.43)")
		font-weight: 800
		line-height: 1
		letter-spacing: -0.01em
		font-variant-numeric: tabular-nums lining-nums
		color: var(--on-surface)
		text-shadow: none

	/* ── Hover Overlay: ультра-плавный кинематографичный переход при наведении ── */
	&__overlay
		position: absolute
		inset: 0
		z-index: 3
		display: flex
		flex-direction: column
		justify-content: flex-end
		padding: 0.875rem
		border-radius: inherit
		background: linear-gradient(180deg, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0.78) 35%, rgba(0, 0, 0, 0.96) 100%)
		backdrop-filter: blur(4px)
		-webkit-backdrop-filter: blur(4px)
		opacity: 0
		pointer-events: none
		transform: none
		transition:
			opacity var(--m3e-duration-long) var(--m3e-easing-standard)

		.media-card:hover &
			opacity: 1
			pointer-events: auto

	/* ── Режим ТОЛЬКО ДЛЯ АНИМЕ (title-on-poster):
	   Снизу постера всегда виден мягкий градиент с названием и мета (год · студия).
	   При наведении неспешно и шелковисто раскрывается расширенный блок (описание, прогресс, жанры). ── */
	&--title-on-poster
		.media-card__overlay
			opacity: 1
			pointer-events: auto
			transform: translateY(0)
			background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.45) 30%, rgba(0, 0, 0, 0.88) 100%)
			backdrop-filter: blur(0px)
			-webkit-backdrop-filter: blur(0px)
			transition:
				background 0.8s cubic-bezier(0.2, 0.8, 0.2, 1),
				backdrop-filter 0.8s cubic-bezier(0.2, 0.8, 0.2, 1),
				-webkit-backdrop-filter 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)

		/* Плавное раскрытие через CSS Grid: шелковистое скольжение */
		.media-card__overlay-details
			display: grid
			grid-template-rows: 0fr
			opacity: 0
			pointer-events: none
			transition:
				grid-template-rows 0.8s cubic-bezier(0.2, 0.8, 0.2, 1),
				opacity 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)

		.media-card__overlay-details-inner
			min-height: 0
			overflow: hidden
			transform: translateY(6px)
			transition:
				transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)

		&:hover
			.media-card__overlay
				background: linear-gradient(180deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.82) 32%, rgba(0, 0, 0, 0.96) 100%)
				backdrop-filter: blur(4px)
				-webkit-backdrop-filter: blur(4px)

			.media-card__overlay-details
				grid-template-rows: 1fr
				opacity: 1
				pointer-events: auto
				transition:
					grid-template-rows 0.85s cubic-bezier(0.2, 0.8, 0.2, 1),
					opacity 0.85s cubic-bezier(0.2, 0.8, 0.2, 1)

			.media-card__overlay-details-inner
				transform: translateY(0)
				transition:
					transform 0.85s cubic-bezier(0.2, 0.8, 0.2, 1)

	&__overlay-title
		margin: 0 0 0.3125rem
		color: #fff
		font: var(--m3e-type-title-small)
		font-size: 0.9375rem
		font-weight: 700
		line-height: 1.3
		letter-spacing: -0.01em
		display: -webkit-box
		-webkit-line-clamp: 2
		-webkit-box-orient: vertical
		overflow: hidden
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6)

	&__overlay-meta
		display: flex
		align-items: center
		gap: 0.375rem
		margin-bottom: 0.375rem
		font: var(--m3e-type-label-small)
		font-size: 0.75rem
		font-weight: 600
		color: rgba(255, 255, 255, 0.85)
		white-space: nowrap
		overflow: hidden
		text-overflow: ellipsis

	&__overlay-year
		color: var(--primary)
		font-variant-numeric: tabular-nums
		flex-shrink: 0

	&__overlay-dot
		color: rgba(255, 255, 255, 0.4)
		user-select: none
		flex-shrink: 0

	&__overlay-extra
		color: rgba(255, 255, 255, 0.9)
		overflow: hidden
		text-overflow: ellipsis
		flex: 1
		min-width: 0

	&__overlay-desc
		margin: 0 0 0.625rem
		color: rgba(255, 255, 255, 0.95)
		font: var(--m3e-type-body-small)
		font-size: 0.78125rem
		line-height: 1.5
		letter-spacing: 0.01em
		display: -webkit-box
		-webkit-line-clamp: 4
		-webkit-box-orient: vertical
		overflow: hidden

	&__overlay-progress
		margin-bottom: 0.5rem

	&__progress-info
		display: flex
		justify-content: space-between
		align-items: center
		margin-bottom: 0.25rem
		color: rgba(255, 255, 255, 0.85)
		font: var(--m3e-type-label-small)
		font-size: 0.6875rem
		font-weight: 600

	&__progress-track
		width: 100%
		height: 4px
		border-radius: var(--shape-corner-full)
		background: rgba(255, 255, 255, 0.2)
		overflow: hidden

	&__progress-fill
		height: 100%
		border-radius: var(--shape-corner-full)
		background: var(--primary)
		transition: width var(--m3e-duration-medium) var(--m3e-easing-standard)

	&__overlay-genres
		display: flex
		flex-wrap: wrap
		gap: 0.25rem

	&__genre-tag
		display: inline-flex
		align-items: center
		justify-content: center
		text-align: center
		line-height: 1.2
		padding: 0.1875rem 0.5rem
		border-radius: var(--shape-corner-xs)
		background: rgba(255, 255, 255, 0.18)
		color: rgba(255, 255, 255, 0.95)
		font: var(--m3e-type-label-small)
		font-size: 0.71875rem
		font-weight: 500

	/* Simkl-стиль: компактная плашка серий/длительности в правом нижнем углу постера */
	&__corner-pill
		position: absolute
		bottom: 0.4375rem
		right: 0.4375rem
		z-index: 2
		display: inline-flex
		align-items: center
		height: 1.3125rem
		padding: 0 0.4375rem
		border-radius: var(--shape-corner-xs, 4px)
		background: rgba(10, 14, 20, 0.78)
		backdrop-filter: blur(8px)
		-webkit-backdrop-filter: blur(8px)
		border: 1px solid rgba(255, 255, 255, 0.12)
		color: rgba(255, 255, 255, 0.95)
		font: var(--m3e-type-label-small)
		font-size: 0.6875rem
		font-weight: 600
		letter-spacing: 0.01em
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35)
		pointer-events: none

@keyframes goldBorderRotate
	100%
		transform: rotate(360deg)

</style>

