import { existsSync, mkdirSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fetchWithTimeout } from "./sync-common.mjs";

/**
 * Validate that buffer represents a supported real image file by checking its magic bytes.
 * Prevents saving HTML error pages or corrupted responses as image files.
 *
 * @param {Buffer} buffer
 * @returns {boolean}
 */
export function isValidImageBuffer(buffer) {
	if (!Buffer.isBuffer(buffer) || buffer.length < 16) {
		return false;
	}

	// JPEG: FF D8 FF
	if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
		return true;
	}

	// PNG: 89 50 4E 47 0D 0A 1A 0A
	if (
		buffer[0] === 0x89 &&
		buffer[1] === 0x50 &&
		buffer[2] === 0x4e &&
		buffer[3] === 0x47 &&
		buffer[4] === 0x0d &&
		buffer[5] === 0x0a &&
		buffer[6] === 0x1a &&
		buffer[7] === 0x0a
	) {
		return true;
	}

	// WebP: RIFF .... WEBP
	if (
		buffer[0] === 0x52 &&
		buffer[1] === 0x49 &&
		buffer[2] === 0x46 &&
		buffer[3] === 0x46 &&
		buffer[8] === 0x57 &&
		buffer[9] === 0x45 &&
		buffer[10] === 0x42 &&
		buffer[11] === 0x50
	) {
		return true;
	}

	// AVIF / HEIC: ....ftyp (avif | avis | heic)
	if (buffer.length >= 16) {
		const ftyp = buffer.toString("ascii", 4, 8);
		if (ftyp === "ftyp") {
			const brand = buffer.toString("ascii", 8, 12);
			if (["avif", "avis", "heic", "mif1"].includes(brand.toLowerCase())) {
				return true;
			}
		}
	}

	// GIF: GIF87a or GIF89a
	if (
		buffer[0] === 0x47 &&
		buffer[1] === 0x49 &&
		buffer[2] === 0x46 &&
		buffer[3] === 0x38 &&
		(buffer[4] === 0x37 || buffer[4] === 0x39) &&
		buffer[5] === 0x61
	) {
		return true;
	}

	return false;
}

/**
 * Download an image only when a valid, non-empty local copy is not already available.
 * Writes via a temporary file so an interrupted download cannot leave a partial asset.
 */
export async function downloadCoverIfMissing(remoteUrl, localFilePath, publicUrl, forceRefresh = false) {
	if (!remoteUrl) return "";

	try {
		if (!forceRefresh && existsSync(localFilePath)) {
			const size = statSync(localFilePath).size;
			// A valid cover must be at least 100 bytes (protects against empty or corrupted files)
			if (size > 100) {
				return publicUrl;
			}
		}
	} catch {
		// If the existing file cannot be inspected, attempt to replace it safely.
	}

	const dir = dirname(localFilePath);
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

	const tempPath = resolve(dir, `.${basename(localFilePath)}.${process.pid}.${Date.now()}.tmp`);
	try {
		const res = await fetchWithTimeout(remoteUrl, {
			headers: { "User-Agent": "ShironeBlog/1.0" },
		});

		if (!res.ok) {
			console.warn(`[MediaAsset] Failed to download ${remoteUrl} (HTTP ${res.status})`);
			return remoteUrl;
		}

		const contentType = res.headers.get("content-type") || "";
		if (contentType && !contentType.startsWith("image/") && !contentType.includes("octet-stream")) {
			console.warn(`[MediaAsset] Invalid content-type (${contentType}) for image: ${remoteUrl}`);
			return remoteUrl;
		}

		const declaredLength = Number(res.headers.get("content-length"));
		if (Number.isFinite(declaredLength) && declaredLength > 30 * 1024 * 1024) {
			console.warn(`[MediaAsset] Skipping oversized image (${declaredLength} bytes): ${remoteUrl}`);
			return remoteUrl;
		}

		const buffer = Buffer.from(await res.arrayBuffer());
		if (buffer.length < 100 || buffer.length > 30 * 1024 * 1024) {
			console.warn(`[MediaAsset] Skipping empty or invalid sized image (${buffer.length} bytes): ${remoteUrl}`);
			return remoteUrl;
		}

		if (!isValidImageBuffer(buffer)) {
			console.warn(`[MediaAsset] Skipping corrupted/non-image buffer (magic bytes mismatch): ${remoteUrl}`);
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
 * Remove unused assets and leftover temp files after a successful sync.
 * Empty active sets are ignored to avoid wiping the cache if a provider fails unexpectedly.
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
		let cleanedTempCount = 0;

		// Clean up stray temporary files (.filename.pid.tmp)
		for (const file of files) {
			if (file.endsWith(".tmp") || (file.startsWith(".") && file.includes(".tmp"))) {
				try {
					unlinkSync(resolve(targetDir, file));
					cleanedTempCount++;
				} catch {
					// Ignore temp file cleanup errors
				}
			}
		}

		// Safety check: if more than 60% of files would be deleted and target has >= 10 files,
		// require a high threshold to prevent accidental mass deletion on partial API response.
		const regularFiles = files.filter((f) => f !== ".gitkeep" && !f.endsWith(".tmp"));
		const candidatesToRemove = regularFiles.filter((f) => !activeFilenames.has(f));

		if (regularFiles.length >= 10 && candidatesToRemove.length > regularFiles.length * 0.6) {
			console.warn(
				`[${domainName}] Safety guard: ${candidatesToRemove.length} of ${regularFiles.length} files would be deleted. Skipping orphan cleanup to prevent data loss.`,
			);
			return;
		}

		for (const file of candidatesToRemove) {
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
		if (cleanedTempCount > 0) {
			console.log(`[${domainName}] Cleaned up ${cleanedTempCount} leftover temporary file(s).`);
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
