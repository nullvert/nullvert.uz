import type { DevicesConfig } from "@/types/devicesConfig";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * Конфигурация поведения и отображения страницы девайсов (Devices).
 *
 * Принцип «конфигурация управляет поведением, данные — контентом»:
 * - enable: главный переключатель страницы; если false, пункт меню скрывается, а /devices/ отдает 404;
 * - categories: список категорий устройств (порядок в массиве задает порядок чипов вверху);
 * - disabledIds: список ID устройств, которые нужно скрыть;
 *
 * Примечание: сами устройства (название, бренд, фото, характеристики, отзывы) настраиваются в `src/data/devices.ts`.
 */
export const devicesConfig: DevicesConfig = withUserConfig("devices", {
	enable: false,
	title: "$t:devices",
	description: "$t:devicesBanner",
	categories: [
		{
			key: "desk",
			label: "Desk Setup",
			icon: "material-symbols:desktop-windows-outline-rounded",
			description: "Workstation & home office hardware",
		},
		{
			key: "mobile",
			label: "Mobile & EDC",
			icon: "material-symbols:phone-iphone",
			description: "Daily portable devices & smart gadgets",
		},
		{
			key: "audio",
			label: "Audio & Visual",
			icon: "material-symbols:headphones-rounded",
			description: "Headphones, speakers & monitoring gears",
		},
		{
			key: "peripheral",
			label: "Peripherals",
			icon: "material-symbols:keyboard-outline-rounded",
			description: "Keyboards, mice & desk accessories",
		},
	],
	// disabledIds: [],
});
