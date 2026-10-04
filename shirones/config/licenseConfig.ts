import type { LicenseConfig } from "@/types/config";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * Лицензия на материалы статей (блок License в конце статьи). Типы описаны в src/types/config.ts.
 */
export const licenseConfig: LicenseConfig = withUserConfig("license", {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
});
