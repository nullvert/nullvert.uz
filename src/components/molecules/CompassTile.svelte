<script lang="ts">
/**
 * CompassTile — лаконичная карточка закладки:
 * - Вверху заголовок с аккуратным фавиконом (1.25rem) в одной строке
 * - Ниже полный текст описания (пользовательская заметка / excerpt) без обрезания
 * - M3-карточка с тонкими рамками и плавным ховером
 */
import Icon from "@iconify/svelte";
import { reveal } from "@utils/motion";
import type { CompassEntry } from "../../types/compass";

let {
	entry,
	delay = 0,
}: { entry: CompassEntry; delay?: number } = $props();

let imgFailed = $state(false);

const iconKind = $derived(
	entry.image
		? "image"
		: /^[\w-]+:[\w-]+$/.test(entry.icon ?? "")
			? "iconify"
			: /^https?:\/\//.test(entry.icon ?? "") || /^\//.test(entry.icon ?? "")
				? "image"
				: "letter",
);

const ghRepoInfo = $derived.by(() => {
	try {
		const match = entry.href.match(/^https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9_\-]+)(?:\/([a-zA-Z0-9_\-\.]+))?/);
		if (match && match[1] && !["orgs", "topics", "features", "collections", "trending"].includes(match[1])) {
			return {
				owner: match[1],
				repo: match[2] || "",
			};
		}
	} catch {}
	return null;
});

const imageSrc = $derived(
	entry.image || entry.icon || (ghRepoInfo ? `https://github.com/${ghRepoInfo.owner}.png?size=64` : "")
);

// Стилизованная монограмма для репозитория (первая буква названия проекта)
const monogramLetter = $derived.by(() => {
	if (ghRepoInfo?.repo) {
		return ghRepoInfo.repo.charAt(0).toUpperCase();
	}
	return (entry.label.charAt(0) || "?").toUpperCase();
});

const host = $derived.by(() => {
	try {
		return new URL(entry.href).hostname.replace(/^www\./, "");
	} catch {
		return entry.href;
	}
});
</script>

<article class="compass-tile m3-state-layer" use:reveal={{ delay }}>
	<a
		class="compass-tile__link"
		href={entry.href}
		target="_blank"
		rel="noopener noreferrer"
	>
		<!-- Заголовок с компактным фавиконом в строке (выровнен по верху) -->
		<div class="compass-tile__header">
			<span class="compass-tile__icon" aria-hidden="true">
				{#if iconKind === "image" && !imgFailed}
					<img
						src={imageSrc}
						alt=""
						loading="lazy"
						referrerpolicy="no-referrer"
						onerror={() => (imgFailed = true)}
					/>
				{:else if iconKind === "iconify"}
					<Icon icon={entry.icon!} />
				{:else}
					<span class="compass-tile__letter" class:compass-tile__letter--github={Boolean(ghRepoInfo)}>{monogramLetter}</span>
				{/if}
			</span>
			<h3 class="compass-tile__label">{entry.label}</h3>
		</div>

		<!-- Полный текст описания без обрезания -->
		{#if entry.note}
			<p class="compass-tile__note">{entry.note}</p>
		{/if}

		<!-- Футер карточки (домен/источник), прижатый к низу для баланса высот -->
		<div class="compass-tile__footer">
			<span class="compass-tile__host">{host}</span>
		</div>
	</a>
</article>

<style lang="stylus">
.compass-tile
	box-sizing: border-box
	background: var(--shirone-card-bg)
	border: none
	border-radius: var(--card-outer-radius, 16px)
	padding: 1.25rem 1.375rem
	height: 100%
	display: flex
	flex-direction: column
	box-shadow: none
	transition:
		background-color var(--m3e-duration-medium) var(--m3e-easing-standard),
		transform var(--m3e-duration-short) var(--m3e-easing-standard)

	&:hover
		border: none
		background: var(--shirone-card-bg-hover)
		box-shadow: none
		transform: translateY(-2px)

	&__link
		display: flex
		flex-direction: column
		gap: 0.625rem
		height: 100%
		min-width: 0
		text-decoration: none

	/* Top-Aligned Header: иконка + заголовок в ряд */
	&__header
		display: flex
		align-items: center
		gap: 0.75rem
		min-width: 0

	&__icon
		display: flex
		align-items: center
		justify-content: center
		width: 1.75rem
		height: 1.75rem
		flex-shrink: 0
		box-sizing: border-box
		border-radius: 0.5rem
		overflow: hidden

		> :global(svg)
			width: 1.625rem
			height: 1.625rem
			color: var(--primary)

		> :global(img)
			width: 100%
			height: 100%
			object-fit: cover
			border-radius: 0.5rem

	&__letter
		display: flex
		align-items: center
		justify-content: center
		width: 1.75rem
		height: 1.75rem
		border-radius: 0.5rem
		background: unquote("color-mix(in oklab, var(--primary) 20%, transparent)")
		color: var(--primary)
		font: var(--m3e-type-label-medium)
		font-weight: 700
		line-height: 1

	&__label
		margin: 0
		color: var(--on-surface)
		font: var(--m3e-type-title-medium)
		font-size: 1.05rem
		font-weight: 700
		line-height: 1.3
		letter-spacing: -0.01em
		transition: color var(--m3e-duration-short) var(--m3e-easing-standard)

		.compass-tile:hover &
			color: var(--primary)

	&__note
		margin: 0
		color: var(--on-surface-variant)
		font: var(--m3e-type-body-medium)
		font-size: 0.84375rem
		line-height: 1.45
		white-space: normal
		word-break: break-word
		overflow: visible

	/* Card Footer: прижатая к низу капсульная плашка домена */
	&__footer
		margin-top: auto
		padding-top: 0.875rem
		display: flex
		align-items: center

	&__host
		display: inline-flex
		align-items: center
		height: 1.5rem
		padding: 0 0.625rem
		border-radius: var(--shape-corner-small, 0.5rem)
		background: var(--surface-container-high, rgba(125, 125, 125, 0.08))
		border: 1px solid var(--outline-variant)
		color: var(--on-surface-variant)
		font: var(--m3e-type-label-small)
		font-size: 0.71875rem
		font-weight: 500
		line-height: 1
		letter-spacing: 0.01em
		transition:
			color var(--m3e-duration-short) var(--m3e-easing-standard),
			border-color var(--m3e-duration-short) var(--m3e-easing-standard),
			background-color var(--m3e-duration-short) var(--m3e-easing-standard)

		.compass-tile:hover &
			color: var(--primary)
			border-color: unquote("color-mix(in oklab, var(--primary) 35%, transparent)")
			background: unquote("color-mix(in oklab, var(--primary) 10%, transparent)")

@media (max-width: 48rem)
	.compass-tile
		padding: 0.875rem 1rem
		border-radius: var(--shape-corner-m, 12px)

		&__link
			gap: 0.375rem

		&__header
			gap: 0.625rem

		&__icon,
		&__letter
			width: 1.5rem
			height: 1.5rem

			> :global(svg)
				width: 1.35rem
				height: 1.35rem

		&__label
			font-size: 0.9375rem
			line-height: 1.25

		&__note
			font-size: 0.8125rem
			line-height: 1.35

		&__footer
			padding-top: 0.5rem

		&__host
			height: 1.25rem
			font-size: 0.6875rem
			padding: 0 0.5rem
</style>
