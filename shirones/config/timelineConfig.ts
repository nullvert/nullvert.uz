import type { TimelineConfig } from "@/types/timelineConfig";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * Конфигурация поведения и отображения страницы «Временная шкала» (Timeline).
 *
 * Принцип «конфигурация управляет поведением, данные — контентом»:
 * - enable: главный переключатель страницы; если false, пункт меню скрывается, а /timeline/ отдает 404;
 * - categories: список категорий для фильтрации (порядок в массиве задает порядок чипов вверху);
 * - order: порядок сортировки, по умолчанию "desc" (новые сверху); доступно "asc" (прямой хронологический);
 * - disabledTitles: список заголовков событий, которые нужно скрыть;
 *
 * Примечание: сами события (заголовок, дата, описание, списки, ссылки) настраиваются в `src/data/timeline.ts`.
 */
export const timelineConfig: TimelineConfig = withUserConfig("timeline", {
	enable: false,
	title: "$t:timeline",
	description: "$t:timelineBanner",
	categories: [
		{
			key: "milestone",
			label: "Milestones",
			icon: "material-symbols:flag-rounded",
		},
		{
			key: "project",
			label: "Projects",
			icon: "material-symbols:code-rounded",
		},
		{
			key: "career",
			label: "Career",
			icon: "material-symbols:work-rounded",
		},
		{
			key: "education",
			label: "Education",
			icon: "material-symbols:school-rounded",
		},
		{
			key: "life",
			label: "Life",
			icon: "material-symbols:favorite-rounded",
		},
	],
	order: "desc",
	// disabledTitles: [],
});
