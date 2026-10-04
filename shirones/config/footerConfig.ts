import type { FooterConfig } from "@/types/footerConfig";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * Конфигурация вставки пользовательского HTML в футер сайта.
 * При включении читает содержимое файла shirones/config/FooterConfig.html и вставляет его над копирайтом в футере.
 * При выключении (enable: false) не создает лишнего DOM и не читает файл.
 */
export const footerConfig: FooterConfig = withUserConfig("footer", {
	enable: false,
});
