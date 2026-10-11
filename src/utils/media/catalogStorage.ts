/**
 * Безопасное чтение и запись в localStorage с валидацией допустимых значений
 */

export function getSafeStorageItem<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
	try {
		if (typeof localStorage === "undefined") return fallback;
		const val = localStorage.getItem(key);
		if (val && allowed.includes(val as T)) {
			return val as T;
		}
		return fallback;
	} catch {
		return fallback;
	}
}

export function setSafeStorageItem(key: string, value: string): void {
	try {
		if (typeof localStorage !== "undefined") {
			localStorage.setItem(key, value);
		}
	} catch {}
}
