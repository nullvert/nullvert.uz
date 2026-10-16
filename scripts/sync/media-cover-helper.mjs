import { existsSync, mkdirSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fetchWithTimeout } from "./sync-common.mjs";

/**
 * Download an image only when a non-empty local copy is not already available.
 * Writes via a temporary file so an interrupted download cannot leave a partial asset.
 */
export async function downloadCoverIfMissing(remoteUrl, localFilePath, publicUrl, forceRefresh = false) {
	if (!remoteUrl) return "";

	try {
		if (!forceRefresh && existsSync(localFilePath) && statSync(localFilePath).size > 0) {
			return publicUrl;
		}
	} catch {
		// If the existing file cannot be inspected, attempt to replace it safely.
	}

	const dir = dirname(localFilePath);
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

	const tempPath = resolve(dir, `.${basename(localFilePath)}.${process.pid}.tmp`);
	try {
		const res = await fetchWithTimeout(remoteUrl, {
			headers: { "User-Agent": "ShironeBlog/1.0" },
		});

		if (!res.ok) {
			console.warn(`[MediaAsset] Failed to download ${remoteUrl} (HTTP ${res.status})`);
			return remoteUrl;
		}

		const declaredLength = Number(res.headers.get("content-length"));
		if (Number.isFinite(declaredLength) && declaredLength > 30 * 1024 * 1024) {
			console.warn(`[MediaAsset] Skipping oversized image (${declaredLength} bytes): ${remoteUrl}`);
			return remoteUrl;
		}

		const buffer = Buffer.from(await res.arrayBuffer());
		if (buffer.length === 0 || buffer.length > 30 * 1024 * 1024) {
			console.warn(`[MediaAsset] Skipping empty or oversized image (${buffer.length} bytes): ${remoteUrl}`);
			return remoteUrl;
		}

		writeFileSync(tempPath, buffer);
		renameSync(tempPath, localFilePath);
		return publicUrl;
	} catch (err) {
		console.warn(`[MediaAsset] Download error for ${remoteUrl}:`, err.message);
		return remoteUrl;
	} finally {
		try {
			if (existsSync(tempPath)) unlinkSync(tempPath);
		} catch {
			// Cleanup must not hide the download error.
		}
	}
}

/**
 * Remove unused assets after a successful sync. Empty active sets are ignored to
 * avoid deleting the entire cache when a provider returns an unexpectedly empty list.
 */
export function cleanupOrphanedCovers(targetDir, activeFilenames, domainName = "media") {
	if (!existsSync(targetDir)) return;
	if (!(activeFilenames instanceof Set) || activeFilenames.size === 0) {
		console.warn(`[${domainName}] Skipping cover cleanup because the active asset set is empty.`);
		return;
	}

	try {
		const files = readdirSync(targetDir);
		let removedCount = 0;

		for (const file of files) {
			if (file === ".gitkeep" || activeFilenames.has(file)) continue;
			const fullPath = resolve(targetDir, file);
			try {
				unlinkSync(fullPath);
				removedCount++;
			} catch (error) {
				console.warn(`[${domainName}] Failed to remove orphan ${file}:`, error.message);
			}
		}

		if (removedCount > 0) {
			console.log(`[${domainName}] Garbage collection: removed ${removedCount} orphaned cover(s).`);
		}
	} catch (error) {
		console.warn(`[${domainName}] Error during garbage collection:`, error.message);
	}
}

/**
 * Universal cover sync: downloads remote covers locally, updates item.cover to public URLs,
 * and cleans up orphaned files.
 */
export async function syncLocalCovers(items, { coversDir, publicPrefix, getFilename, providerName = "Media", forceRefresh = false }) {
	console.log(`[${providerName}] Downloading covers locally to ${coversDir}...`);
	const activeCoverFilenames = new Set();

	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		if (!item.cover) continue;

		const filename = getFilename(item, i);
		activeCoverFilenames.add(filename);

		const localFilePath = resolve(coversDir, filename);
		const publicPath = `${publicPrefix.replace(/\/$/, "")}/${filename}`;

		item.cover = await downloadCoverIfMissing(item.cover, localFilePath, publicPath, forceRefresh);
	}

	cleanupOrphanedCovers(coversDir, activeCoverFilenames, providerName);
}
