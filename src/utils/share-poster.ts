export const SHARE_POSTER_WIDTH = 1200;
export const SHARE_POSTER_HEIGHT = 630; // 1.91:1 стандарт Telegram / X / OpenGraph

const PAGE_PADDING_X = 72;
const PAGE_PADDING_Y = 64;
const FONT_FAMILY = '"Manrope", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export interface SharePosterPalette {
	surfaceContainerLowest: string;
	surfaceContainerLow: string;
	surfaceContainerHigh?: string;
	onSurface: string;
	onSurfaceVariant: string;
	primary: string;
	primaryContainer: string;
	onPrimaryContainer: string;
	outlineVariant: string;
}

export interface SharePosterLabels {
	author: string;
	scanToRead: string;
}

export interface SharePosterInput {
	title: string;
	description: string;
	author: string;
	published: string;
	siteTitle: string;
	url: string;
	coverUrl?: string;
	avatarUrl?: string;
	labels: SharePosterLabels;
	palette: SharePosterPalette;
	signal?: AbortSignal;
}

interface DrawableImage {
	source: CanvasImageSource;
	close?: () => void;
}

export function sanitizeFilename(
	name: string,
	fallback = "article-share",
): string {
	const cleaned = Array.from(name)
		.filter((char) => {
			const code = char.charCodeAt(0);
			return code >= 32 && code !== 127 && !'<>:"/\\|?*'.includes(char);
		})
		.join("")
		.trim()
		.replace(/\s+/g, "-");
	return cleaned || fallback;
}

export function getSharePosterPalette(
	element: HTMLElement = document.documentElement,
): SharePosterPalette {
	const style = getComputedStyle(element);
	const getVar = (name: string, fallback: string) => {
		const value = style.getPropertyValue(name).trim();
		return value || fallback;
	};

	return {
		surfaceContainerLowest: getVar("--surface-container-lowest", "#ffffff"),
		surfaceContainerLow: getVar("--surface-container-low", "#f7f2fa"),
		surfaceContainerHigh: getVar("--surface-container-high", "#ece6f0"),
		onSurface: getVar("--on-surface", "#1d1b20"),
		onSurfaceVariant: getVar("--on-surface-variant", "#49454f"),
		primary: getVar("--primary", "#6750a4"),
		primaryContainer: getVar("--primary-container", "#eaddff"),
		onPrimaryContainer: getVar("--on-primary-container", "#21005d"),
		outlineVariant: getVar("--outline-variant", "#cac4d0"),
	};
}

async function loadDrawableImage(
	url?: string,
	signal?: AbortSignal,
	timeoutMs = 6000,
): Promise<DrawableImage | null> {
	if (!url || signal?.aborted) return null;

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
		const onAbort = () => controller.abort();
		signal?.addEventListener("abort", onAbort, { once: true });

		try {
			const response = await fetch(url, { signal: controller.signal });
			if (!response.ok) return null;

			const contentType = response.headers.get("content-type") || "";
			if (contentType && !contentType.startsWith("image/")) return null;

			const blob = await response.blob();
			if (blob.size > 15 * 1024 * 1024) return null;

			if (typeof createImageBitmap === "function") {
				const bitmap = await createImageBitmap(blob);
				return { source: bitmap, close: () => bitmap.close() };
			}

			return await new Promise<DrawableImage | null>((resolve) => {
				const image = new Image();
				const blobUrl = URL.createObjectURL(blob);
				image.onload = () => {
					resolve({
						source: image,
						close: () => URL.revokeObjectURL(blobUrl),
					});
				};
				image.onerror = () => {
					URL.revokeObjectURL(blobUrl);
					resolve(null);
				};
				image.src = blobUrl;
			});
		} finally {
			clearTimeout(timeoutId);
			signal?.removeEventListener("abort", onAbort);
		}
	} catch {
		return null;
	}
}

function segmentText(text: string, granularity: "word" | "grapheme"): string[] {
	if (!text) return [];
	if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
		try {
			const segmenter = new Intl.Segmenter(undefined, { granularity });
			return Array.from(segmenter.segment(text), (segment) => segment.segment);
		} catch {
			// Fall through
		}
	}
	return Array.from(text);
}

function wrapTextLines(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
	maxLines: number,
): string[] {
	const normalized = text.replace(/\s+/g, " ").trim();
	if (!normalized) return [];

	const tokens = segmentText(normalized, "word").flatMap((token) =>
		ctx.measureText(token).width > maxWidth
			? segmentText(token, "grapheme")
			: [token],
	);
	const lines: string[] = [];
	let currentLine = "";
	let truncated = false;

	for (let index = 0; index < tokens.length; index++) {
		const token = tokens[index];
		const candidate = currentLine + token;
		if (ctx.measureText(candidate).width <= maxWidth) {
			currentLine = candidate;
			continue;
		}

		if (currentLine) {
			lines.push(currentLine.trimEnd());
			if (lines.length === maxLines) {
				truncated = true;
				break;
			}
		}
		currentLine = token.trimStart();
	}

	if (!truncated && currentLine && lines.length < maxLines) {
		lines.push(currentLine.trimEnd());
	}

	if (truncated && lines.length > 0) {
		const ellipsis = "\u2026";
		let lastLine = lines[lines.length - 1];
		while (
			lastLine &&
			ctx.measureText(`${lastLine}${ellipsis}`).width > maxWidth
		) {
			lastLine = segmentText(lastLine, "grapheme").slice(0, -1).join("");
		}
		lines[lines.length - 1] = `${lastLine.trimEnd()}${ellipsis}`;
	}

	return lines;
}

function drawCoverImage(
	ctx: CanvasRenderingContext2D,
	image: CanvasImageSource,
	x: number,
	y: number,
	width: number,
	height: number,
) {
	const dimensions = image as { width?: number; height?: number };
	const imageWidth = Number(dimensions.width) || width;
	const imageHeight = Number(dimensions.height) || height;
	const imageAspect = imageWidth / imageHeight;
	const targetAspect = width / height;

	let sourceX = 0;
	let sourceY = 0;
	let sourceWidth = imageWidth;
	let sourceHeight = imageHeight;

	if (imageAspect > targetAspect) {
		sourceWidth = imageHeight * targetAspect;
		sourceX = (imageWidth - sourceWidth) / 2;
	} else {
		sourceHeight = imageWidth / targetAspect;
		sourceY = (imageHeight - sourceHeight) / 2;
	}

	ctx.drawImage(
		image,
		sourceX,
		sourceY,
		sourceWidth,
		sourceHeight,
		x,
		y,
		width,
		height,
	);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) resolve(blob);
			else reject(new Error("Canvas toBlob returned null"));
		}, "image/png");
	});
}

/**
 * Отрисовывает премиальный атмосферный градиент для постов без обложки.
 * Глубокий темный космический фон с деликатными световыми сферами в палитре блога.
 */
function drawNoCoverBackdrop(
	ctx: CanvasRenderingContext2D,
	_palette?: SharePosterPalette,
) {
	// Базовый темный фон
	ctx.fillStyle = "#0c0e14";
	ctx.fillRect(0, 0, SHARE_POSTER_WIDTH, SHARE_POSTER_HEIGHT);

	// Мягкое рассеянное свечение в правом верхнем углу (без резкого пятна/вспышки)
	const primaryGlow = ctx.createRadialGradient(
		SHARE_POSTER_WIDTH - 200,
		150,
		0,
		SHARE_POSTER_WIDTH - 150,
		180,
		800,
	);
	// Очень деликатные полупрозрачные стопы без яркого пятна
	primaryGlow.addColorStop(0, "rgba(83, 152, 217, 0.22)");
	primaryGlow.addColorStop(0.35, "rgba(83, 152, 217, 0.12)");
	primaryGlow.addColorStop(0.7, "rgba(83, 152, 217, 0.04)");
	primaryGlow.addColorStop(1, "rgba(12, 14, 20, 0)");
	ctx.fillStyle = primaryGlow;
	ctx.fillRect(0, 0, SHARE_POSTER_WIDTH, SHARE_POSTER_HEIGHT);

	// Вторичное глубокое свечение в левом нижнем углу
	const secondaryGlow = ctx.createRadialGradient(
		100,
		SHARE_POSTER_HEIGHT - 80,
		0,
		150,
		SHARE_POSTER_HEIGHT - 50,
		600,
	);
	secondaryGlow.addColorStop(0, "rgba(40, 60, 95, 0.18)");
	secondaryGlow.addColorStop(0.6, "rgba(40, 60, 95, 0.05)");
	secondaryGlow.addColorStop(1, "transparent");
	ctx.fillStyle = secondaryGlow;
	ctx.fillRect(0, 0, SHARE_POSTER_WIDTH, SHARE_POSTER_HEIGHT);


}

/**
 * Генерирует карточку 1200x630 (1.91:1) для Telegram:
 * - Умная защита читаемости текста (scrim + многослойное затемнение от ярких обложек).
 * - Премиальный aurora-градиент для постов без обложки.
 * - Гармоничное центрирование по высоте.
 * - Чистый домен nullvert.uz.
 */
export async function generateSharePoster(
	input: SharePosterInput,
): Promise<Blob> {
	const coverImage = await loadDrawableImage(input.coverUrl, input.signal);

	try {
		const canvas = document.createElement("canvas");
		canvas.width = SHARE_POSTER_WIDTH;
		canvas.height = SHARE_POSTER_HEIGHT;
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			throw new Error("Failed to acquire render canvas 2d context");
		}

		if (coverImage?.source) {
			// 1. Рисуем обложку
			drawCoverImage(ctx, coverImage.source, 0, 0, SHARE_POSTER_WIDTH, SHARE_POSTER_HEIGHT);

			// 2. Многослойная защита от ярких и пестрых картинок:
			// Слой А: Базовое общее затемнение (гарантирует контраст даже если фото ослепительно белое)
			ctx.fillStyle = "rgba(10, 12, 18, 0.52)";
			ctx.fillRect(0, 0, SHARE_POSTER_WIDTH, SHARE_POSTER_HEIGHT);

			// Слой Б: Направленный градиент слева направо (акцент под левым краем с текстом)
			const leftScrim = ctx.createLinearGradient(0, 0, SHARE_POSTER_WIDTH * 0.85, 0);
			leftScrim.addColorStop(0, "rgba(8, 10, 15, 0.85)");
			leftScrim.addColorStop(0.55, "rgba(8, 10, 15, 0.6)");
			leftScrim.addColorStop(1, "rgba(8, 10, 15, 0.2)");
			ctx.fillStyle = leftScrim;
			ctx.fillRect(0, 0, SHARE_POSTER_WIDTH, SHARE_POSTER_HEIGHT);

			// Слой В: Нижний подъемный градиент для подвала
			const bottomScrim = ctx.createLinearGradient(0, SHARE_POSTER_HEIGHT - 220, 0, SHARE_POSTER_HEIGHT);
			bottomScrim.addColorStop(0, "rgba(0,0,0,0)");
			bottomScrim.addColorStop(1, "rgba(8, 10, 15, 0.85)");
			ctx.fillStyle = bottomScrim;
			ctx.fillRect(0, SHARE_POSTER_HEIGHT - 220, SHARE_POSTER_WIDTH, 220);
		} else {
			// Для постов без обложки: богатый атмосферный темный фон
			drawNoCoverBackdrop(ctx, input.palette);
		}

		// Вычисляем вертикальный баланс контента
		const maxTextWidth = SHARE_POSTER_WIDTH - PAGE_PADDING_X * 2;
		ctx.font = `800 52px ${FONT_FAMILY}`;
		const titleLines = wrapTextLines(ctx, input.title, maxTextWidth, 3);
		const titleLineHeight = 68;
		const titleBlockHeight = titleLines.length * titleLineHeight;

		ctx.font = `400 28px ${FONT_FAMILY}`;
		const descLines = input.description
			? wrapTextLines(ctx, input.description, maxTextWidth, 2)
			: [];
		const descLineHeight = 42;
		const descBlockHeight = descLines.length > 0 ? descLines.length * descLineHeight + 20 : 0;

		const metaBlockHeight = input.published ? 32 : 0;
		const totalContentHeight = metaBlockHeight + 24 + titleBlockHeight + descBlockHeight;

		// Доступная высота между шапкой и футером
		const availableTop = PAGE_PADDING_Y;
		const availableBottom = SHARE_POSTER_HEIGHT - PAGE_PADDING_Y - 40;
		const availableAreaHeight = availableBottom - availableTop;

		// Сбалансированный стартовый Y контента
		const startY = Math.max(
			PAGE_PADDING_Y + 10,
			availableTop + Math.floor((availableAreaHeight - totalContentHeight) / 2) - 10,
		);

		// 1. Дата публикации
		let currentY = startY;
		if (input.published) {
			ctx.textBaseline = "top";
			ctx.font = `600 24px ${FONT_FAMILY}`;
			ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
			ctx.fillText(input.published, PAGE_PADDING_X, currentY);
			currentY += metaBlockHeight + 22;
		}

		// 2. Заголовок статьи
		ctx.textBaseline = "top";
		ctx.font = `800 54px ${FONT_FAMILY}`;
		ctx.fillStyle = "#ffffff";
		// Деликатная кинематографичная тень текста для гарантированной четкости
		ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
		ctx.shadowBlur = 18;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 4;

		titleLines.forEach((line, i) => {
			ctx.fillText(line, PAGE_PADDING_X, currentY + i * titleLineHeight);
		});
		currentY += titleBlockHeight + 22;

		// Сбрасываем тень для описания
		ctx.shadowColor = "transparent";
		ctx.shadowBlur = 0;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;

		// 3. Описание
		if (descLines.length > 0) {
			ctx.font = `400 28px ${FONT_FAMILY}`;
			ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
			descLines.forEach((line, i) => {
				ctx.fillText(line, PAGE_PADDING_X, currentY + i * descLineHeight);
			});
		}

		// 4. Подвал: Автор слева (Javohir) и аккуратный деликатный вотермарк nullvert.uz справа
		const footerY = SHARE_POSTER_HEIGHT - PAGE_PADDING_Y - 8;
		ctx.textBaseline = "middle";

		ctx.font = `600 24px ${FONT_FAMILY}`;
		ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
		ctx.fillText("Javohir", PAGE_PADDING_X, footerY);


		// Деликатный ненавязчивый вотермарк nullvert.uz справа
		ctx.textAlign = "right";
		ctx.font = `600 24px ${FONT_FAMILY}`;
		ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
		ctx.fillText("nullvert.uz", SHARE_POSTER_WIDTH - PAGE_PADDING_X, footerY);
		ctx.textAlign = "left";

		return await canvasToBlob(canvas);
	} finally {
		coverImage?.close?.();
	}
}
