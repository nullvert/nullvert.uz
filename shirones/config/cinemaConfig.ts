/**
 * Конфигурация раздела «Кино и Сериалы» (Cinema).
 * Поддерживает синхронизацию с Simkl, Kinorium и локальные данные.
 */
export interface CinemaConfig {
	enable: boolean;
	title: string;
	description: string;
	source: {
		kind: "snapshot" | "local";
		file?: string;
	};
}

export const cinemaConfig: CinemaConfig = {
	enable: true,
	title: "Кино",
	description: "Фильмы и сериалы, которые я смотрю — оценки, статус и впечатления.",
	source: {
		kind: "snapshot",
		file: "simkl.json",
	},
};
