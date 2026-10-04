/**
 * Конфигурация эффекта Tonal Bloom (плейсхолдер цветного свечения изображений).
 * Работает в единой цветовой модели M3E HCT, предотвращает скачки верстки (layout shift) и обеспечивает плавное появление картинок.
 */
import type { ImageBloomConfig } from "@/types/imageBloomConfig";
import { withUserConfig } from "@/utils/config-overlay.ts";

export const imageBloomConfig: ImageBloomConfig = withUserConfig("imageBloom", {
	enable: true,
	blurRadius: 20,
	opacity: 0.7,
	transitionDuration: 300,
});

export function resolveImageBloomOptions(
	config: Partial<ImageBloomConfig> = imageBloomConfig,
): ImageBloomConfig {
	return {
		enable: config.enable ?? true,
		blurRadius: config.blurRadius ?? 20,
		opacity: config.opacity ?? 0.7,
		transitionDuration: config.transitionDuration ?? 300,
	};
}
