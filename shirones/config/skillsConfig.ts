import type { SkillsConfig } from "@/types/skillsConfig";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * Конфигурация поведения и отображения страницы навыков (Skills).
 *
 * Принцип «конфигурация управляет поведением, данные — контентом»:
 * - enable: главный переключатель страницы; если false, пункт меню скрывается, а /skills/ отдает 404;
 * - categories: список категорий для фильтрации (порядок в массиве задает порядок чипов вверху);
 * - disabledNames: список скрываемых навыков (например, ["PHP"]);
 *
 * Примечание: сами навыки (название, уровень, иконка, описание) настраиваются в `src/data/skills.ts`.
 */
export const skillsConfig: SkillsConfig = withUserConfig("skills", {
	enable: false,
	title: "$t:skills",
	description: "$t:skillsBanner",
	categories: [
		{
			key: "frontend",
			label: "Frontend",
			icon: "material-symbols:web-rounded",
		},
		{
			key: "backend",
			label: "Backend",
			icon: "material-symbols:dns-rounded",
		},
		{
			key: "tooling",
			label: "Tooling",
			icon: "material-symbols:construction-rounded",
		},
	],
	// disabledNames: [],
});
