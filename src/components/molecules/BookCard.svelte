<script lang="ts">
/**
 * BookCard — цифровая читательская карточка (Digital Library Card).
 * Премиальный M3E дизайн с описанием, метаданными и статусом.
 */
import Icon from "@iconify/svelte";
import type { MediaItemData } from "@/types/media";
import { MEDIA_LABEL, mediaLabel } from "../../utils/media/labels";

interface Props {
	item: MediaItemData;
	onclick?: () => void;
}

const { item, onclick }: Props = $props();

const progressPercent = $derived(
	item.progress && item.progress.total > 0
		? Math.round(Math.min((item.progress.watched / item.progress.total) * 100, 100))
		: 0,
);

const statusColor = $derived(item.statusColor || "var(--primary)");

const statusIconName = $derived(
	item.status === "completed"
		? "material-symbols:check-circle-rounded"
		: item.status === "reading"
			? "material-symbols:menu-book-rounded"
			: item.status === "onHold"
				? "material-symbols:pause-circle-rounded"
				: item.status === "dropped"
					? "material-symbols:cancel-rounded"
					: "material-symbols:bookmark-rounded",
);
</script>

<article
	class="book-card"
	class:book-card--has-link={Boolean(item.link)}
	style={`--book-status-color: ${statusColor};`}
>
	<!-- Верхняя строка: автор слева, бейдж статуса справа -->
	<header class="book-card__header">
		<div class="book-card__author-wrap">
			<Icon icon="material-symbols:edit-note-rounded" class="book-card__author-icon" aria-hidden="true" />
			{#if item.authorOrStudio}
				<span class="book-card__author" title={item.authorOrStudio}>
					{item.authorOrStudio}
				</span>
			{/if}
		</div>

		{#if item.statusLabel}
			<span class="book-card__status-badge" title={`${mediaLabel(MEDIA_LABEL.status, "Статус")}: ${item.statusLabel}`}>
				<Icon icon={statusIconName} class="book-card__status-icon" aria-hidden="true" />
				<span class="book-card__status-text">{item.statusLabel}</span>
			</span>
		{/if}
	</header>

	<!-- Основная часть: заголовок и метаданные -->
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
				<span class="book-card__meta-item book-card__year">
					<Icon icon="material-symbols:calendar-today-rounded" class="book-card__meta-icon" aria-hidden="true" />
					{item.year}
				</span>
			{/if}
			{#if item.subMeta}
				<span class="book-card__meta-item book-card__pages">
					<Icon icon="material-symbols:auto-stories-outline-rounded" class="book-card__meta-icon" aria-hidden="true" />
					{item.subMeta}
				</span>
			{/if}
			{#if item.badge}
				<span class="book-card__meta-item book-card__series" title={item.badge}>
					<Icon icon="material-symbols:collections-bookmark-outline-rounded" class="book-card__meta-icon" aria-hidden="true" />
					{item.badge}
				</span>
			{/if}
		</div>

		<!-- Описание книги -->
		{#if item.description}
			<p class="book-card__description" title={item.description}>
				{item.description}
			</p>
		{/if}
	</div>

	<!-- Нижняя часть: прогресс чтения и жанровые теги -->
	<div class="book-card__bottom">
		<!-- Прогресс чтения -->
		{#if item.status === "reading" && item.progress && item.progress.total > 0}
			<div class="book-card__progress">
				<div class="book-card__progress-info">
					<span class="book-card__progress-label">{mediaLabel(MEDIA_LABEL.booksProgress, "Прогресс")}</span>
					<span class="book-card__progress-count">
						{item.progress.watched} / {item.progress.total} {item.progress.unit ?? mediaLabel(MEDIA_LABEL.booksUnitPages, "стр.")}
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

		<!-- Футер: жанровые теги -->
		{#if item.genres && item.genres.length > 0}
			<footer class="book-card__footer" aria-label={mediaLabel(MEDIA_LABEL.booksGenres, "Жанры")}>
				<div class="book-card__genres">
					{#each item.genres as genre (genre)}
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
	gap: 1rem
	width: 100%
	height: 100%
	background: unquote("color-mix(in srgb, var(--surface-container-high) 65%, transparent)")
	border: 1px solid unquote("color-mix(in srgb, var(--outline-variant) 30%, transparent)")
	border-radius: var(--shape-corner-xl, 20px)
	padding: 1.25rem 1.375rem
	box-sizing: border-box
	backdrop-filter: blur(24px) saturate(180%)
	-webkit-backdrop-filter: blur(24px) saturate(180%)
	box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.25)
	transition:
		border-color var(--m3e-duration-medium, 250ms) var(--m3e-easing-standard),
		box-shadow var(--m3e-duration-medium, 250ms) var(--m3e-easing-standard),
		background-color var(--m3e-duration-medium, 250ms) var(--m3e-easing-standard),
		transform var(--m3e-duration-medium, 250ms) var(--m3e-easing-standard)

	&:hover
		border-color: unquote("color-mix(in oklab, var(--primary) 40%, transparent)")
		background: unquote("color-mix(in srgb, var(--surface-container-highest) 75%, transparent)")
		box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.4), 0 0 0 1px unquote("color-mix(in oklab, var(--primary) 20%, transparent)")
		transform: translateY(-3px)

	/* ── Верхняя строка: автор и статус ── */
	&__header
		display: flex
		align-items: center
		justify-content: space-between
		gap: 0.75rem

	&__author-wrap
		display: flex
		align-items: center
		gap: 0.375rem
		min-width: 0
		flex: 1

	:global(.book-card__author-icon)
		font-size: 1rem
		color: var(--primary)
		flex-shrink: 0
		opacity: 0.85

	&__author
		font-size: 0.75rem
		font-weight: 700
		text-transform: uppercase
		letter-spacing: 0.06em
		color: unquote("color-mix(in oklab, var(--primary) 70%, var(--on-surface))")
		white-space: nowrap
		overflow: hidden
		text-overflow: ellipsis

	/* Капсульный бейдж статуса */
	&__status-badge
		display: inline-flex
		align-items: center
		gap: 0.3125rem
		height: 1.5rem
		padding: 0 0.625rem
		border-radius: var(--shape-corner-full, 9999px)
		background: unquote("color-mix(in srgb, var(--book-status-color) 12%, var(--surface-container-highest))")
		border: 1px solid unquote("color-mix(in srgb, var(--book-status-color) 28%, transparent)")
		color: var(--on-surface)
		font-size: 0.6875rem
		font-weight: 600
		white-space: nowrap
		flex-shrink: 0
		user-select: none

	:global(.book-card__status-icon)
		font-size: 0.875rem
		color: var(--book-status-color)

	/* ── Основной контент: заголовок, метаданные и описание ── */
	&__main
		display: flex
		flex-direction: column
		gap: 0.625rem

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
				opacity: 1
				transform: translate(2px, -2px)

	&__title
		margin: 0
		font-size: 1.1875rem
		font-weight: 700
		line-height: 1.3
		letter-spacing: -0.01em
		color: var(--on-surface, #ffffff)
		display: -webkit-box
		-webkit-line-clamp: 2
		-webkit-box-orient: vertical
		overflow: hidden
		transition: color var(--m3e-duration-short) ease

	&__arrow
		font-size: 0.875rem
		line-height: 1
		color: var(--primary)
		opacity: 0.4
		transition:
			opacity var(--m3e-duration-short) ease,
			transform var(--m3e-duration-short) ease

	/* Метаданные (Год, Страницы, Серия) */
	&__meta
		display: flex
		align-items: center
		flex-wrap: wrap
		gap: 0.5rem

	&__meta-item
		display: inline-flex
		align-items: center
		gap: 0.25rem
		font-size: 0.75rem
		font-weight: 500
		color: var(--on-surface-variant)
		background: unquote("color-mix(in srgb, var(--surface-container-highest) 45%, transparent)")
		border: 1px solid unquote("color-mix(in srgb, var(--outline-variant) 20%, transparent)")
		padding: 0.1875rem 0.5rem
		border-radius: var(--shape-corner-xs, 6px)
		white-space: nowrap

	:global(.book-card__meta-icon)
		font-size: 0.8125rem
		opacity: 0.7

	&__year
		color: var(--on-surface)
		font-weight: 600

	&__series
		color: unquote("color-mix(in oklab, var(--primary) 80%, #ffffff)")
		font-weight: 600

	/* Описание книги */
	&__description
		margin: 0.25rem 0 0 0
		font-size: 0.84375rem
		line-height: 1.55
		color: var(--on-surface-variant)
		display: -webkit-box
		-webkit-line-clamp: 3
		-webkit-box-orient: vertical
		overflow: hidden
		word-break: break-word

	/* ── Нижний блок ── */
	&__bottom
		display: flex
		flex-direction: column
		gap: 0.625rem
		margin-top: auto
		padding-top: 0.5rem

	/* Прогресс чтения */
	&__progress
		width: 100%

	&__progress-info
		display: flex
		justify-content: space-between
		align-items: center
		margin-bottom: 0.3125rem
		font-size: 0.6875rem
		font-weight: 600
		color: var(--on-surface-variant)

	&__progress-count
		font-variant-numeric: tabular-nums lining-nums
		color: var(--on-surface)

	&__progress-track
		width: 100%
		height: 5px
		border-radius: 9999px
		background: unquote("color-mix(in srgb, var(--surface-container-highest) 60%, transparent)")
		overflow: hidden

	&__progress-fill
		height: 100%
		border-radius: 9999px
		background: var(--primary)
		transition: width var(--m3e-duration-medium) var(--m3e-easing-standard)

	/* Футер: аккуратные теги */
	&__footer
		display: flex
		align-items: center
		overflow: hidden

	&__genres
		display: flex
		flex-wrap: wrap
		gap: 0.375rem

	&__genre-tag
		display: inline-flex
		align-items: center
		padding: 0.2rem 0.5625rem
		border-radius: var(--shape-corner-xs, 6px)
		background: unquote("color-mix(in srgb, var(--surface-container-high) 50%, transparent)")
		border: 1px solid unquote("color-mix(in srgb, var(--outline-variant) 25%, transparent)")
		color: var(--on-surface-variant)
		font-size: 0.6875rem
		font-weight: 500
		line-height: 1.2
		transition:
			background-color var(--m3e-duration-short) ease,
			border-color var(--m3e-duration-short) ease,
			color var(--m3e-duration-short) ease

		&:hover
			background: unquote("color-mix(in oklab, var(--primary) 15%, var(--surface-container-highest))")
			border-color: unquote("color-mix(in oklab, var(--primary) 35%, transparent)")
			color: var(--on-surface)

@media (max-width: 36rem)
	.book-card
		padding: 1rem 1.125rem
		gap: 0.75rem

		&__title
			font-size: 1.0625rem
</style>
