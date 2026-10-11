import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Скачивает изображение в локальный файл, если его ещё нет.
 * @param {string} remoteUrl URL удалённого изображения
 * @param {string} localFilePath Абсолютный путь сохранения на диске
 * @param {string} publicUrl Относительный путь для браузера (напр. /assets/media/...)
 * @returns {Promise<string>} Возвращает publicUrl при успехе или fallback remoteUrl при ошибке
 */
export async function downloadCoverIfMissing(remoteUrl, localFilePath, publicUrl) {
	if (!remoteUrl) return "";

	// Если файл уже скачан — возвращаем локальный URL
	if (existsSync(localFilePath)) {
		return publicUrl;
	}

	try {
		const dir = dirname(localFilePath);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}

		const res = await fetch(remoteUrl, {
			headers: {
				"User-Agent": "ShironeBlog/1.0",
			},
		});

		if (!res.ok) {
			console.warn(`[MediaAsset] Warning: Failed to download ${remoteUrl} (${res.status})`);
			return remoteUrl; // Fallback на оригинальный URL
		}

		const buffer = Buffer.from(await res.arrayBuffer());
		writeFileSync(localFilePath, buffer);
		await delay(60);
		return publicUrl;
	} catch (err) {
		console.warn(`[MediaAsset] Download error for ${remoteUrl}:`, err.message);
		return remoteUrl; // Fallback
	}
}

/**
 * Очищает файлы в директории, которых нет в актуальном наборе activeFilenames.
 * @param {string} targetDir Директория с постерами
 * @param {Set<string>} activeFilenames Имена актуальных файлов (напр. "show-123.webp")
 * @param {string} domainName Имя домена для логов (cinema, games)
 */
export function cleanupOrphanedCovers(targetDir, activeFilenames, domainName = "media") {
	if (!existsSync(targetDir)) return;

	try {
		const files = readdirSync(targetDir);
		let removedCount = 0;

		for (const file of files) {
			if (file === ".gitkeep") continue;
			if (!activeFilenames.has(file)) {
				const fullPath = resolve(targetDir, file);
				try {
					unlinkSync(fullPath);
					removedCount++;
				} catch (e) {
					console.warn(`[${domainName}] Failed to remove orphan ${file}:`, e.message);
				}
			}
		}

		if (removedCount > 0) {
			console.log(`[${domainName}] Garbage collection: removed ${removedCount} orphaned cover(s).`);
		}
	} catch (err) {
		console.warn(`[${domainName}] Error during garbage collection:`, err.message);
	}
}
