import type { GamesConfig } from "@/types/gamesConfig";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * Конфигурация поведения и отображения страницы игр (Games).
 *
 * Принцип «конфигурация управляет поведением, данные — контентом»:
 * - enable: главный переключатель страницы; если false, пункт меню скрывается, а /games/ отдает 404;
 * - categories: список категорий игр (порядок в массиве задает порядок чипов вверху;
 *   пустые категории без записей скрываются автоматически);
 * - disabledIds: список ID игр, которые нужно скрыть;
 *
 * Примечание: сами игры (название, разработчик, обложка, рейтинг, время игры, отзыв) настраиваются в `src/data/games.ts`.
 */
export const gamesConfig: GamesConfig = withUserConfig("games", {
	enable: false,
	title: "$t:games",
	description: "$t:gamesBanner",
	categories: [
		{
			key: "open-world",
			label: "Open World",
			icon: "material-symbols:explore-outline-rounded",
			description: "Open-world adventures",
		},
		{
			key: "sandbox",
			label: "Sandbox",
			icon: "material-symbols:widgets-rounded",
			description: "Building, crafting & creative worlds",
		},
		{
			key: "rpg",
			label: "RPG",
			icon: "material-symbols:shield-outline-rounded",
			description: "Role-playing stories & builds",
		},
		{
			key: "action",
			label: "Action",
			icon: "material-symbols:swords-outline-rounded",
			description: "Action, fighting & shooters",
		},
		{
			key: "casual",
			label: "Casual",
			icon: "material-symbols:extension-outline-rounded",
			description: "Cozy, casual & party games",
		},
	],
	// disabledIds: [],
});
