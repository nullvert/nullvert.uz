import type { ProjectsConfig } from "@/types/projectsConfig";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * Конфигурация поведения и отображения страницы проектов (Projects).
 *
 * Принцип «конфигурация управляет поведением, данные — контентом»:
 * - enable: главный переключатель страницы; если false, пункт меню скрывается, а /projects/ отдает 404;
 * - categories: список категорий (порядок в массиве задает порядок чипов вверху);
 * - disabledKeys: список ключей проектов, которые нужно скрыть (например, ["folkpatch"]);
 *
 * Примечание: сами проекты (название, описание, стек, ссылки, обложки) настраиваются в `src/data/projects.ts`.
 */
export const projectsConfig: ProjectsConfig = withUserConfig("projects", {
	enable: false,
	title: "$t:projects",
	description: "$t:projectsBanner",
	categories: [
		{
			key: "theme",
			label: "Theme",
			icon: "material-symbols:palette-outline-rounded",
		},
		{
			key: "android",
			label: "Android",
			icon: "material-symbols:android-rounded",
		},
	],
	// disabledKeys: [],
});
