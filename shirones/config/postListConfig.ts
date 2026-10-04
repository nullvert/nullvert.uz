import type { PostCardWidth, PostListConfig } from "@/types/postListConfig";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * Конфигурация списка статей: пагинация и раскладка.
 *
 * 【Основные параметры】
 * - pageSize: количество статей на одной странице (по умолчанию 8);
 * - layout:
 *   - mode: "list" (классический вертикальный список) | "grid" (сетка карточек);
 *   - cover: "left" (обложка слева) | "right" (обложка справа, по умолчанию);
 *   - cardWidth (действует только в режиме grid):
 *     - "compact": компактные карточки (мин. ширина 20rem);
 *     - "regular": стандартные карточки (мин. ширина 24rem, рекомендуется);
 *     - "relaxed": просторные карточки (мин. ширина 28rem).
 *
 * Примечание: посетители могут переключать list/grid в настройках сайта; здесь задается значение по умолчанию.
 */
export const postListConfig: PostListConfig = withUserConfig("postList", {
	pageSize: 8,
	layout: {
		mode: "list",
		cover: "right",
		cardWidth: "regular",
	},
});

/** Соответствие пресетов сетки и минимальной ширины карточки (--post-card-min) */
export const POST_CARD_MIN_WIDTH: Record<PostCardWidth, string> = {
	compact: "20rem",
	regular: "24rem",
	relaxed: "28rem",
};
