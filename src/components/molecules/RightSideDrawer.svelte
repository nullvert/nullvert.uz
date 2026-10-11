<script lang="ts">
/**
 * RightSideDrawer — универсальное правое навигационное меню/шторка (M3 Right Drawer).
 * - Порталируется напрямую в document.body, избегая конфликтов с transform-контейнерами.
 * - Полная высота вьюпорта (100dvh) с учётом safe-area на мобильных устройствах.
 * - Плавный аппаратный выезд справа с токеном --m3e-easing-emphasized-decelerate.
 * - Бэкдроп с блюром (backdrop-filter: blur(8px)) и блокировкой скролла подложки.
 */
import { onDestroy, type Snippet } from "svelte";

let {
	open = $bindable(false),
	title = "Параметры",
	ariaLabel = "Параметры",
	onClose = () => {},
	children,
	headerIcon,
	footer,
}: {
	open?: boolean;
	title?: string;
	ariaLabel?: string;
	onClose?: () => void;
	children?: Snippet;
	headerIcon?: Snippet;
	footer?: Snippet;
} = $props();

function portal(node: HTMLElement) {
	if (typeof document !== "undefined") {
		document.body.appendChild(node);
	}
	return {
		destroy() {
			if (node.parentNode) {
				node.parentNode.removeChild(node);
			}
		},
	};
}

let isDragging = $state(false);
let startX = 0;
let startY = 0;
let currentTranslateX = $state(0);
let isHorizontalGesture = false;
let gestureDecided = false;

function handleClose() {
	open = false;
	isDragging = false;
	currentTranslateX = 0;
	onClose();
	if (typeof document !== "undefined") {
		document.body.style.overflow = "";
	}
}

function handleKeyDown(e: KeyboardEvent) {
	if (e.key === "Escape" && open) {
		handleClose();
	}
}

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
			// Горизонтальный жест, если сдвиг по X больше, чем по Y
			isHorizontalGesture = Math.abs(deltaX) > Math.abs(deltaY);
		}
	}

	if (isHorizontalGesture) {
		// Для правого ящика закрывающий свайп направлен вправо (deltaX > 0)
		if (deltaX > 0) {
			currentTranslateX = deltaX;
			if (e.cancelable) e.preventDefault();
		} else {
			// Легкое эластичное сопротивление влево
			currentTranslateX = deltaX * 0.15;
		}
	}
}

function handleTouchEnd(e: TouchEvent) {
	if (!isDragging) return;
	isDragging = false;
	// Порог закрытия: если сдвинули вправо более чем на 75px
	if (isHorizontalGesture && currentTranslateX > 75) {
		handleClose();
	} else {
		currentTranslateX = 0;
	}
	gestureDecided = false;
	isHorizontalGesture = false;
}

$effect(() => {
	if (typeof document !== "undefined") {
		if (open) {
			document.body.style.overflow = "hidden";
			currentTranslateX = 0;
		} else {
			document.body.style.overflow = "";
			currentTranslateX = 0;
			isDragging = false;
		}
	}
});

onDestroy(() => {
	if (typeof document !== "undefined") {
		document.body.style.overflow = "";
	}
});
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
	use:portal
	class="right-drawer"
	class:right-drawer--open={open}
	class:right-drawer--dragging={isDragging}
	role="dialog"
	aria-modal={open}
	aria-label={ariaLabel}
>
	<div
		class="right-drawer__scrim"
		onclick={handleClose}
		ontouchmove={(e) => e.preventDefault()}
		aria-hidden="true"
	></div>

	<aside
		class="right-drawer__panel"
		aria-label={ariaLabel}
		style={isDragging && currentTranslateX > 0 ? `transform: translateX(${currentTranslateX}px); transition: none;` : undefined}
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
		ontouchcancel={handleTouchEnd}
	>
		<div class="right-drawer__header">
			<div class="right-drawer__title-group">
				{#if headerIcon}
					{@render headerIcon()}
				{:else}
					<svg class="right-drawer__header-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h16q.825 0 1.413.588T22 6v12q0 .825-.587 1.413T20 20zm12-2h4V6h-4zm-2 0V6H4v12z"/>
					</svg>
				{/if}
				<h2 class="right-drawer__title">{title}</h2>
			</div>

			<button
				type="button"
				class="right-drawer__close"
				onclick={handleClose}
				aria-label="Закрыть"
			>
				<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="m12 13.4-4.9 4.9q-.275.275-.7.275t-.7-.275q-.275-.275-.275-.7t.275-.7l4.9-4.9-4.9-4.9q-.275-.275-.275-.7t.275-.7q.275-.275.7-.275t.7.275l4.9 4.9 4.9-4.9q.275-.275.7-.275t.7.275q.275.275.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7q-.275.275-.7.275t-.7-.275z"/>
				</svg>
			</button>
		</div>

		<div class="right-drawer__body">
			{@render children?.()}
		</div>

		{#if footer}
			<div class="right-drawer__footer">
				{@render footer()}
			</div>
		{/if}
	</aside>
</div>

<style lang="stylus">
.right-drawer
	position: fixed
	inset: 0
	z-index: 130
	visibility: hidden
	pointer-events: none

	@media (min-width: 64rem)
		display: none !important

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
		right: 0
		display: flex
		flex-direction: column
		width: 320px
		max-width: 85vw
		height: 100%
		height: 100dvh
		box-sizing: border-box
		background: var(--surface-container-low)
		color: var(--on-surface)
		border-left: 1px solid var(--outline-variant)
		border-radius: var(--shape-corner-xl, 28px) 0 0 var(--shape-corner-xl, 28px)
		box-shadow: -8px 0 48px rgba(0, 0, 0, 0.45)
		transform: translateX(100%)
		transition: transform var(--m3e-duration-long) var(--m3e-easing-emphasized-decelerate)
		z-index: 1
		overflow: hidden

	&--open &__panel
		transform: translateX(0)

	&__header
		display: flex
		align-items: center
		justify-content: space-between
		padding: 1.125rem 1.25rem 1rem
		border-bottom: 1px solid var(--outline-variant)
		flex-shrink: 0

	&__title-group
		display: flex
		align-items: center
		gap: 0.625rem

	&__header-icon
		width: 1.375rem
		height: 1.375rem
		color: var(--primary)

	&__title
		margin: 0
		color: var(--on-surface)
		font: var(--m3e-type-title-medium)
		font-weight: 700

	&__close
		display: inline-flex
		align-items: center
		justify-content: center
		width: 2.25rem
		height: 2.25rem
		border: none
		border-radius: var(--shape-corner-full, 9999px)
		background: transparent
		color: var(--on-surface-variant)
		cursor: pointer
		-webkit-tap-highlight-color: transparent
		transition:
			background-color var(--m3e-duration-short) var(--m3e-easing-standard),
			color var(--m3e-duration-short) var(--m3e-easing-standard)

		&:hover
			background: var(--surface-container-high)
			color: var(--on-surface)

		> :global(svg)
			width: 1.25rem
			height: 1.25rem

	&__body
		flex: 1
		min-height: 0
		overflow-y: auto
		-webkit-overflow-scrolling: touch
		display: flex
		flex-direction: column
		gap: 1.375rem
		padding: 1.25rem
		padding-bottom: unquote("max(1.5rem, env(safe-area-inset-bottom, 1.5rem))")

	&__footer
		padding: 1rem 1.25rem unquote("max(1rem, env(safe-area-inset-bottom, 1rem))")
		border-top: 1px solid var(--outline-variant)
		flex-shrink: 0
</style>
