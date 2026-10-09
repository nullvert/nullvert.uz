/**
 * Audio Asset Sanitizer & Obfuscator Pipeline
 * -------------------------------------------------------------
 * 1. Strips Vorbis comments, ID3 and metadata tags using FFmpeg:
 *    ffmpeg -i input.opus -map_metadata -1 -c:a copy output.opus
 * 2. Renames files to non-descriptive deterministic hashes (e.g. 25a803a58675.opus)
 * 3. Safely cleans up temporary processing files.
 *
 * Usage:
 *   node scripts/sanitize-audio.mjs
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const MUSIC_DIR = path.resolve("./public/assets/music/url");

if (!fs.existsSync(MUSIC_DIR)) {
	console.error(`[Error] Music directory not found: ${MUSIC_DIR}`);
	process.exit(1);
}

const files = fs.readdirSync(MUSIC_DIR).filter((f) => f.endsWith(".opus"));

if (files.length === 0) {
	console.log("[Info] No .opus files found to process.");
	process.exit(0);
}

console.log(`[Start] Processing ${files.length} audio assets in ${MUSIC_DIR}...\n`);

const mapping = {};

for (const file of files) {
	// If already a 12-char hex hash, skip or re-sanitize
	const isAlreadyHashed = /^[0-9a-f]{12}\.opus$/i.test(file);
	const targetHash = isAlreadyHashed
		? file.replace(".opus", "")
		: crypto.createHash("sha256").update(file).digest("hex").slice(0, 12);
	const targetFileName = `${targetHash}.opus`;

	const srcPath = path.join(MUSIC_DIR, file);
	const tempPath = path.join(MUSIC_DIR, `temp_${targetFileName}`);
	const finalPath = path.join(MUSIC_DIR, targetFileName);

	try {
		console.log(`  -> Sanitizing metadata: ${file}`);
		// Run FFmpeg to strip Vorbis / ID3 tags without re-encoding audio stream
		execFileSync("ffmpeg", [
			"-y",
			"-loglevel", "error",
			"-i", srcPath,
			"-map_metadata", "-1",
			"-c:a", "copy",
			tempPath,
		]);

		// Remove old source file
		fs.unlinkSync(srcPath);

		// Rename temp to target hashed name
		fs.renameSync(tempPath, finalPath);

		mapping[file] = targetFileName;
		console.log(`     Saved sanitized: ${targetFileName}`);
	} catch (err) {
		console.error(`[Error] Failed processing ${file}:`, err.message);
		if (fs.existsSync(tempPath)) {
			try { fs.unlinkSync(tempPath); } catch {}
		}
	}
}

console.log("\n[Finished] File mapping summary:");
console.table(mapping);
