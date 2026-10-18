/**
 * Конфигурация раздела «Книги» (Books).
 * Поддерживает синхронизацию с Literal.club и локальные снапшоты.
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
	enable: false,
	title: "Книги",
	description: "Книги, которые я читаю — библиотека, статус, оценки и цели чтения из The StoryGraph.",
	source: {
		kind: "snapshot",
		file: "hardcover.json",
	},
};
