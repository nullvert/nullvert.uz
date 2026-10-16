<script lang="ts">
/**
 * ReadingGoalCard — M3E премиум-виджет цели чтения:
 * - Круглый прогресс-индикатор (Radial SVG ring) с сиянием
 * - Чистая статистика (прочитано, цель, осталось дней)
 * - Капсульный стеклянный стиль в гармонии с боковой панелью
 */
import type { BookGoal } from "../../utils/media/domains/books";

let {
	goal,
}: {
	goal: BookGoal;
} = $props();

const progressPercent = $derived(
	goal.goal > 0 ? Math.min(Math.round((goal.progress / goal.goal) * 100), 100) : 0,
);

const metricLabel = $derived(
	goal.metric === "book" || goal.metric === "books" ? "книг" : "стр.",
);

const remainingDays = $derived.by(() => {
	if (!goal.endDate) return null;
	const diff = new Date(goal.endDate).getTime() - Date.now();
	const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
	return days > 0 ? days : 0;
});

// SVG ring math: r = 22, circumference = 2 * PI * 22 ≈ 138.23
const radius = 22;
const circumference = 2 * Math.PI * radius;
const strokeDashoffset = $derived(
	circumference - (progressPercent / 100) * circumference,
);
</script>

<div class="reading-goal-card">
	<div class="reading-goal-card__body">
		<!-- Кольцевой прогресс -->
		<div class="reading-goal-card__ring-wrap">
			<svg class="reading-goal-card__ring-svg" viewBox="0 0 56 56" aria-hidden="true">
				<circle
					class="reading-goal-card__ring-track"
					cx="28"
					cy="28"
					r={radius}
					stroke-width="4.5"
				/>
				<circle
					class="reading-goal-card__ring-indicator"
					cx="28"
					cy="28"
					r={radius}
					stroke-width="4.5"
					stroke-dasharray={circumference}
					stroke-dashoffset={strokeDashoffset}
					stroke-linecap="round"
				/>
			</svg>
			<div class="reading-goal-card__ring-label">
				<span class="reading-goal-card__ring-number">{progressPercent}</span>
				<span class="reading-goal-card__ring-unit">%</span>
			</div>
		</div>

		<!-- Инфо блока: заголовок и тег -->
		<div class="reading-goal-card__content">
			<div class="reading-goal-card__badge-row">
				<span class="reading-goal-card__badge-tag">Челлендж</span>
				{#if remainingDays !== null}
					<span class="reading-goal-card__badge-days">{remainingDays} дн. осталось</span>
				{/if}
			</div>

			<h4 class="reading-goal-card__title" title={goal.description}>
				{goal.description || "Цель чтения"}
			</h4>
		</div>

		<!-- Метрика и счетчик справа -->
		<div class="reading-goal-card__stats">
			<div class="reading-goal-card__metric-line">
				<span class="reading-goal-card__current">{goal.progress}</span>
				<span class="reading-goal-card__sep">/</span>
				<span class="reading-goal-card__target">{goal.goal}</span>
				<span class="reading-goal-card__metric-label">{metricLabel}</span>
			</div>
		</div>
	</div>

	<!-- Нижняя мини-полоса прогресса -->
	<div class="reading-goal-card__bar-track" aria-hidden="true">
		<div class="reading-goal-card__bar-fill" style={`width: ${progressPercent}%;`}></div>
	</div>
</div>

<style>
.reading-goal-card {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	padding: 0.875rem 1.25rem 0.75rem;
	border-radius: var(--shape-corner-l, 1rem);
	background: color-mix(in oklab, var(--surface-container-high) 65%, transparent);
	border: 1px solid color-mix(in oklab, var(--outline-variant) 30%, transparent);
	backdrop-filter: blur(16px);
	-webkit-backdrop-filter: blur(16px);
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
	transition: border-color var(--m3e-duration-short) ease, background-color var(--m3e-duration-short) ease;
	width: 100%;
	box-sizing: border-box;
}

.reading-goal-card:hover {
	border-color: color-mix(in oklab, var(--primary) 45%, transparent);
	background: color-mix(in oklab, var(--surface-container-high) 85%, transparent);
}

.reading-goal-card__body {
	display: flex;
	align-items: center;
	gap: 1.125rem;
	width: 100%;
}

/* Кольцевой прогресс-бар */
.reading-goal-card__ring-wrap {
	position: relative;
	width: 3.25rem;
	height: 3.25rem;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.reading-goal-card__ring-svg {
	width: 100%;
	height: 100%;
	transform: rotate(-90deg);
}

.reading-goal-card__ring-track {
	fill: none;
	stroke: rgba(255, 255, 255, 0.08);
}

.reading-goal-card__ring-indicator {
	fill: none;
	stroke: var(--primary);
	filter: drop-shadow(0 0 6px color-mix(in oklab, var(--primary) 60%, transparent));
	transition: stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.reading-goal-card__ring-label {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	font-variant-numeric: tabular-nums;
	line-height: 1;
}

.reading-goal-card__ring-number {
	font-size: 0.875rem;
	font-weight: 800;
	color: var(--on-surface);
}

.reading-goal-card__ring-unit {
	font-size: 0.5625rem;
	font-weight: 600;
	color: var(--primary);
	margin-left: 1px;
}

/* Текстовая колонка */
.reading-goal-card__content {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	min-width: 0;
	flex: 1;
}

.reading-goal-card__badge-row {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.reading-goal-card__badge-tag {
	font-size: 0.625rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	padding: 0.125rem 0.5rem;
	border-radius: 9999px;
	background: color-mix(in oklab, var(--primary) 22%, transparent);
	color: var(--primary);
}

.reading-goal-card__badge-days {
	font-size: 0.6875rem;
	font-weight: 500;
	color: var(--on-surface-variant);
}

.reading-goal-card__title {
	margin: 0;
	font-size: 0.9375rem;
	font-weight: 700;
	color: var(--on-surface);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

/* Статистика справа */
.reading-goal-card__stats {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	justify-content: center;
	flex-shrink: 0;
}

.reading-goal-card__metric-line {
	display: flex;
	align-items: baseline;
	gap: 0.25rem;
	font-size: 0.8125rem;
	color: var(--on-surface-variant);
}

.reading-goal-card__current {
	font-size: 1.1875rem;
	font-weight: 800;
	color: var(--on-surface);
}

.reading-goal-card__sep {
	color: var(--outline-variant);
}

.reading-goal-card__target {
	font-size: 0.9375rem;
	font-weight: 600;
	color: var(--on-surface);
}

.reading-goal-card__metric-label {
	font-size: 0.6875rem;
	color: var(--on-surface-variant);
	margin-left: 0.125rem;
}

/* Нижний микро-бар */
.reading-goal-card__bar-track {
	width: 100%;
	height: 0.25rem;
	border-radius: 9999px;
	background: rgba(255, 255, 255, 0.08);
	overflow: hidden;
}

.reading-goal-card__bar-fill {
	height: 100%;
	border-radius: 9999px;
	background: linear-gradient(90deg, var(--primary), var(--secondary));
	transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@media (max-width: 36rem) {
	.reading-goal-card {
		padding: 0.75rem 1rem;
	}
	.reading-goal-card__body {
		gap: 0.75rem;
	}
	.reading-goal-card__ring-wrap {
		width: 2.75rem;
		height: 2.75rem;
	}
}
</style>
