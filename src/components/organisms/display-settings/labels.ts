import type I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";

/**
 * Keys that exist only in this project's locale overrides (shirones/config/i18nConfig.ts).
 * Locales without an override fall back to the English text passed by the caller.
 */
export const DISPLAY_LABEL = {
	resetDefault: "displaySettings.resetDefault",
	glassEffect: "displaySettings.glassEffect",
} as const;

export function localLabel(key: string, fallback: string): string {
	return i18n(key as I18nKey) ?? fallback;
}
