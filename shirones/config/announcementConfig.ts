import type { AnnouncementConfig } from "@/types/announcementConfig";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * Конфигурация панели объявлений (Announcement).
 * Отображение компонента централизованно управляется через sidebarConfig.
 */
export const announcementConfig: AnnouncementConfig = withUserConfig(
	"announcement",
	{
		title: "", // Заголовок объявления, при пустой строке используется строка i18n Key.announcement
		content: "The only way to do great work is to love what you do", // Текст объявления
		closable: true, // Разрешить пользователю закрывать объявление
		link: {
			enable: true, // Включить ссылку
			text: "GitHub", // Текст ссылки
			url: "https://github.com", // URL ссылки
			external: true, // Внешняя ссылка
		},
	},
);
