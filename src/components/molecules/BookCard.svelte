<script lang="ts">
/**
 * BookCard — цифровая читательская карточка (Digital Library Card).
 * Чистый реестровый UI без водянистых синопсисов:
 * - Четкая иерархия: Автор и статус вверху, крупный красивый заголовок, метаданные (год, страницы, серия), прогресс и теги.
 * - Одинаковая стройная высота карточек, идеально садится в сетку как на мобильном, так и на десктопе.
 */
import Icon from "@iconify/svelte";
import type { MediaItemData } from "@/types/media";

interface Props {
	item: MediaItemData;
	onclick?: () => void;
}

const { item, onclick }: Props = $props();

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

const progressPercent = $derived(
	item.progress && item.progress.total > 0
		? Math.round(Math.min((item.progress.watched / item.progress.total) * 100, 100))
		: 0,
);

const statusColor = $derived(item.statusColor || "var(--primary)");
</script>

<article
	class="book-card book-card--tier-{ratingTier}"
	class:book-card--has-link={Boolean(item.link)}
	style={`--book-status-color: ${statusColor};`}
>
	<!-- Верхняя строка: автор слева, статус справа -->
	<header class="book-card__header">
		<div class="book-card__author-wrap">
			{#if item.authorOrStudio}
				<span class="book-card__author" title={item.authorOrStudio}>
					{item.authorOrStudio}
				</span>
			{/if}
		</div>

		{#if item.statusLabel}
			<span class="book-card__status" title={`Статус: ${item.statusLabel}`}>
				{item.statusLabel}
			</span>
		{/if}
	</header>

	<!-- Заголовок книги -->
	<div class="book-card__main">
		{#if item.link}
			<a
				href={item.link}
				target="_blank"
				rel="noopener noreferrer"
				class="book-card__title-link"
				aria-label={item.title}
			>
				<h3 class="book-card__title" title={item.title}>
					{item.title}
				</h3>
				<span class="book-card__arrow" aria-hidden="true">↗</span>
			</a>
		{:else}
			<h3 class="book-card__title" title={item.title}>
				{item.title}
			</h3>
		{/if}

		<!-- Метаданные: Год • Страницы • Серия -->
		<div class="book-card__meta">
			{#if item.year}
				<span class="book-card__meta-item book-card__year">{item.year}</span>
			{/if}
			{#if item.year && item.subMeta}
				<span class="book-card__bullet" aria-hidden="true">•</span>
			{/if}
			{#if item.subMeta}
				<span class="book-card__meta-item book-card__pages">{item.subMeta}</span>
			{/if}
			{#if item.badge}
				<span class="book-card__bullet" aria-hidden="true">•</span>
				<span class="book-card__meta-item book-card__series" title={item.badge}>{item.badge}</span>
			{/if}
		</div>
	</div>

	<!-- Нижняя часть: прогресс и жанровые теги -->
	<div class="book-card__bottom">
		<!-- Прогресс чтения (только для читаемых в данный момент книг или незавершенного чтения) -->
		{#if item.status === "reading" && item.progress && item.progress.total > 0}
			<div class="book-card__progress">
				<div class="book-card__progress-info">
					<span class="book-card__progress-label">Прогресс</span>
					<span class="book-card__progress-count">
						{item.progress.watched} / {item.progress.total} {item.progress.unit ?? "стр."}
					</span>
				</div>
				<div
					class="book-card__progress-track"
					role="progressbar"
					aria-valuenow={progressPercent}
					aria-valuemin={0}
					aria-valuemax={100}
				>
					<div class="book-card__progress-fill" style={`width: ${progressPercent}%;`}></div>
				</div>
			</div>
		{/if}

		<!-- Футер: жанровые теги (максимум 3) -->
		{#if item.genres && item.genres.length > 0}
			<footer class="book-card__footer" aria-label="Жанры">
				<div class="book-card__genres">
					{#each item.genres.slice(0, 3) as genre (genre)}
						<span class="book-card__genre-tag">{genre}</span>
					{/each}
				</div>
			</footer>
		{/if}
	</div>
</article>

<style lang="stylus">
.book-card
	position: relative
	display: flex
	flex-direction: column
	justify-content: space-between
	gap: 0.75rem
	width: 100%
	height: 100%
	background: var(--card-bg, rgba(255, 255, 255, 0.03))
	border: 1px solid var(--outline-variant, rgba(255, 255, 255, 0.08))
	border-radius: var(--shape-corner-card, 16px)
	padding: 1rem 1.125rem
	box-sizing: border-box
	overflow: hidden
	transition:
		border-color var(--m3e-duration-medium, 250ms) var(--m3e-easing-standard),
		box-shadow var(--m3e-duration-medium, 250ms) var(--m3e-easing-standard),
		background-color var(--m3e-duration-medium, 250ms) var(--m3e-easing-standard),
		transform var(--m3e-duration-medium, 250ms) var(--m3e-easing-standard)

	&:hover
		border-color: unquote("color-mix(in oklab, var(--primary) 45%, transparent)")
		background: var(--surface-container, rgba(255, 255, 255, 0.05))
		box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.4)
		transform: translateY(-2px)

	/* ── Верхняя строка: автор и статус ── */
	&__header
		display: flex
		align-items: center
		justify-content: space-between
		gap: 0.5rem

	&__author-wrap
		min-width: 0
		flex: 1

	&__author
		font-family: inherit
		font-size: 0.6875rem
		font-weight: 700
		text-transform: uppercase
		letter-spacing: 0.08em
		color: unquote("color-mix(in oklab, var(--primary) 70%, var(--on-surface-variant, #ffffff))")
		white-space: nowrap
		overflow: hidden
		text-overflow: ellipsis
		display: block

	/* Статус чтения */
	&__status
		font-size: 0.6875rem
		font-weight: 500
		color: var(--on-surface-variant, rgba(255, 255, 255, 0.5))
		white-space: nowrap
		flex-shrink: 0
		user-select: none
		transition: color var(--m3e-duration-short) ease

		.book-card:hover &
			color: var(--on-surface-variant, rgba(255, 255, 255, 0.75))

	/* ── Основной контент: заголовок и метаданные ── */
	&__main
		display: flex
		flex-direction: column
		gap: 0.3125rem

	&__title-link
		text-decoration: none
		color: inherit
		display: inline-flex
		align-items: baseline
		gap: 0.375rem
		width: fit-content
		max-width: 100%

		&:hover
			.book-card__title
				color: var(--primary)
			.book-card__arrow
				opacity: 0.9
				transform: translate(2px, -2px)

	&__title
		margin: 0
		font-family: inherit
		font-size: 1.0625rem
		font-weight: 700
		line-height: 1.3
		color: var(--on-surface, #ffffff)
		display: -webkit-box
		-webkit-line-clamp: 2
		-webkit-box-orient: vertical
		overflow: hidden
		transition: color var(--m3e-duration-short) ease

	&__arrow
		font-size: 0.8125rem
		line-height: 1
		color: var(--primary)
		opacity: 0.4
		transition:
			opacity var(--m3e-duration-short) ease,
			transform var(--m3e-duration-short) ease

	/* Метаданные (Год • Страницы • Серия) */
	&__meta
		display: flex
		align-items: center
		flex-wrap: wrap
		gap: 0.375rem
		font-size: 0.75rem
		font-weight: 500
		color: var(--on-surface-variant, rgba(255, 255, 255, 0.65))
		font-variant-numeric: tabular-nums lining-nums

	&__meta-item
		white-space: nowrap

	&__year
		color: var(--on-surface, #ffffff)
		font-weight: 600

	&__bullet
		color: rgba(255, 255, 255, 0.25)
		user-select: none

	&__pages
		color: var(--on-surface-variant, rgba(255, 255, 255, 0.7))

	&__series
		overflow: hidden
		text-overflow: ellipsis
		color: unquote("color-mix(in oklab, var(--primary) 75%, #ffffff)")
		font-weight: 600

	/* ── Нижний блок ── */
	&__bottom
		display: flex
		flex-direction: column
		gap: 0.5rem
		margin-top: auto

	/* Прогресс чтения */
	&__progress
		width: 100%

	&__progress-info
		display: flex
		justify-content: space-between
		align-items: center
		margin-bottom: 0.25rem
		font-size: 0.6875rem
		font-weight: 600
		color: var(--on-surface-variant, rgba(255, 255, 255, 0.65))

	&__progress-count
		font-variant-numeric: tabular-nums lining-nums

	&__progress-track
		width: 100%
		height: 4px
		border-radius: 9999px
		background: rgba(255, 255, 255, 0.08)
		overflow: hidden

	&__progress-fill
		height: 100%
		border-radius: 9999px
		background: var(--primary)
		transition: width var(--m3e-duration-medium) var(--m3e-easing-standard)

	/* Футер: только теги в 1 аккуратную строку */
	&__footer
		display: flex
		align-items: center
		overflow: hidden

	/* Жанровые теги — стиль кино (MediaCard.svelte), строго в 1 строку без прыжков высоты */
	&__genres
		display: flex
		flex-wrap: nowrap
		gap: 0.3125rem
		overflow: hidden
		white-space: nowrap
		width: 100%

	&__genre-tag
		display: inline-flex
		align-items: center
		justify-content: center
		text-align: center
		line-height: 1.2
		padding: 0.1875rem 0.5rem
		border-radius: var(--shape-corner-xs, 4px)
		background: var(--surface-container-high, rgba(125, 125, 125, 0.12))
		border: 1px solid var(--outline-variant, rgba(125, 125, 125, 0.15))
		color: var(--on-surface-variant)
		font: var(--m3e-type-label-small)
		font-size: 0.71875rem
		font-weight: 500
		flex-shrink: 0
		transition:
			background-color var(--m3e-duration-short) ease,
			border-color var(--m3e-duration-short) ease,
			color var(--m3e-duration-short) ease

		&:hover
			background: var(--surface-container-highest, rgba(125, 125, 125, 0.2))
			border-color: var(--outline, rgba(125, 125, 125, 0.25))
			color: var(--on-surface)

@media (max-width: 36rem)
	.book-card
		padding: 0.9375rem 1rem
		gap: 0.625rem
		min-height: auto

		&__title
			font-size: 1.0625rem
</style>
