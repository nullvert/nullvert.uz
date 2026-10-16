/**
 * Конфигурация раздела «Книги» (Books).
 * Поддерживает синхронизацию с Hardcover и локальные снапшоты.
 */
export interface BooksConfig {
	enable: boolean;
	title: string;
	description: string;
	source: {
		kind: "snapshot" | "local";
		file?: string;
	};
}

export const booksConfig: BooksConfig = {
	enable: true,
	title: "Книги",
	description: "Книги, которые я читаю — библиотека, статус, оценки и цели чтения из Hardcover.",
	source: {
		kind: "snapshot",
		file: "hardcover.json",
	},
};
