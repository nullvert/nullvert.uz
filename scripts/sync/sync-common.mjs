import {
	existsSync,
	mkdirSync,
	readFileSync,
	renameSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));

/** Absolute project root, independent of the directory used to invoke Node. */
export const ROOT_DIR = resolve(MODULE_DIR, "../..");
export const SNAPSHOT_DIR = resolve(ROOT_DIR, "src/data/snapshots");

/**
 * Read the project's simple KEY=VALUE .env format without requiring dotenv.
 * Existing process environment variables always take precedence over file values.
 */
export function loadEnvFile(envPath = resolve(ROOT_DIR, ".env")) {
	if (!existsSync(envPath)) return {};

	const content = readFileSync(envPath, "utf8").replace(/^\uFEFF/, "");
	const env = {};

	for (const originalLine of content.split(/\r?\n/)) {
		const line = originalLine.trim();
		if (!line || line.startsWith("#")) continue;

		const match = line.match(/^(?:export\s+)?([\w.-]+)\s*=\s*(.*)$/);
		if (!match) continue;

		const key = match[1];
		let value = match[2].trim();
		const quote = value[0];

		if (quote === '"' || quote === "'") {
			const closingQuote = value.indexOf(quote, 1);
			if (closingQuote >= 0 && (!value.slice(closingQuote + 1).trim() || value.slice(closingQuote + 1).trim().startsWith("#"))) {
				value = value.slice(1, closingQuote);
				if (quote === '"') {
					value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\\\/g, "\\").replace(/\\\"/g, '"');
				}
			} else {
				// Malformed/unclosed quotes are treated as plain values rather than discarded.
				value = value.replace(/\s+#.*$/, "").trim();
			}
		} else {
			// Treat whitespace-prefixed # as an inline comment in unquoted values.
			value = value.replace(/\s+#.*$/, "").trim();
		}

		env[key] = value;
	}

	return env;
}

/**
 * Updates or appends keys in the project's .env file preserving existing formatting and comments.
 */
export function updateEnvFile(updates, envPath = resolve(ROOT_DIR, ".env")) {
	let content = existsSync(envPath) ? readFileSync(envPath, "utf8").replace(/^\uFEFF/, "") : "";
	const lines = content ? content.split(/\r?\n/) : [];
	const pending = { ...updates };

	const newLines = lines.map((line) => {
		const match = line.match(/^(?:export\s+)?([\w.-]+)\s*=/);
		if (match && pending[match[1]] !== undefined) {
			const key = match[1];
			const val = pending[key];
			delete pending[key];
			return `${key}="${val}"`;
		}
		return line;
	});

	for (const [key, val] of Object.entries(pending)) {
		newLines.push(`${key}="${val}"`);
	}

	const normalized = `${newLines.join("\n").trim()}\n`;
	writeTextAtomic(envPath, normalized);
}

/** Resolve CLI argument > process environment > .env file > fallback. */
export function getSetting(name, { cliValue, env = loadEnvFile(), fallback } = {}) {
	if (typeof cliValue === "string" && cliValue.trim()) return cliValue.trim();

	const processValue = process.env[name];
	if (typeof processValue === "string" && processValue.trim()) return processValue.trim();

	const fileValue = env[name];
	if (typeof fileValue === "string" && fileValue.trim()) return fileValue.trim();

	return fallback;
}

/** Check if force-refresh flag is requested via CLI or environment variable. */
export function isForceRefreshRequested(argv = process.argv, env = process.env) {
	return (
		argv.includes("--refresh") ||
		argv.includes("--force-refresh") ||
		argv.includes("-r") ||
		env.REFRESH_METADATA === "true" ||
		env.FORCE_REFRESH === "true"
	);
}

export function delay(ms) {
	return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

/**
 * Concurrency pool executor with controlled concurrency limit and delay.
 * Useful for rate-limited public APIs like Simkl and InfiniteBacklog.
 */
export async function mapConcurrent(items, limit, fn) {
	const results = new Array(items.length);
	let nextIndex = 0;

	async function worker() {
		while (nextIndex < items.length) {
			const index = nextIndex++;
			results[index] = await fn(items[index], index);
		}
	}

	const workerCount = Math.min(Math.max(1, limit), items.length);
	const workers = Array.from({ length: workerCount }, () => worker());
	await Promise.all(workers);
	return results;
}

/**
 * Check if a cached item is missing required fields or is older than maxAgeDays.
 * Supports explicit force-refresh flag via CLI or environment.
 */
export function shouldRefresh(cached, { requiredFields = [], maxAgeDays = 30, force = false } = {}) {
	if (force || !cached) return true;
	for (const field of requiredFields) {
		const val = cached[field];
		if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
			return true;
		}
	}
	if (cached._fetchedAt) {
		const fetchedTime = new Date(cached._fetchedAt).getTime();
		const ageMs = Date.now() - fetchedTime;
		if (ageMs > maxAgeDays * 24 * 60 * 60 * 1000) {
			return true;
		}
	}
	return false;
}

export function ensureDir(directory) {
	mkdirSync(directory, { recursive: true });
}

/** Fetch with a hard timeout; Node's AbortSignal.timeout also covers body reads. */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 20_000) {
	const signal = options.signal ?? AbortSignal.timeout(timeoutMs);
	try {
		return await fetch(url, { ...options, signal });
	} catch (error) {
		if (error?.name === "TimeoutError" || error?.name === "AbortError") {
			throw new Error(`Request timed out or was aborted: ${url}`, { cause: error });
		}
		throw error;
	}
}

/** Fetch and parse JSON with consistent HTTP and parse errors. */
export async function fetchJson(url, options = {}, { timeoutMs = 20_000, label = "API" } = {}) {
	const response = await fetchWithTimeout(url, options, timeoutMs);
	if (!response.ok) {
		let body = "";
		try {
			body = (await response.text()).slice(0, 400).replace(/\s+/g, " ");
		} catch {
			// The status code is still useful if the response body cannot be read.
		}
		throw new Error(`${label} request failed (HTTP ${response.status} ${response.statusText})${body ? `: ${body}` : ""} — ${url}`);
	}

	try {
		return await response.json();
	} catch (error) {
		if (error?.name === "TimeoutError" || error?.name === "AbortError") {
			throw new Error(`${label} response body timed out — ${url}`, { cause: error });
		}
		throw new Error(`${label} returned invalid JSON — ${url}`, { cause: error });
	}
}

/** Read a JSON file if it exists; optional snapshots may be absent or malformed. */
export function readJsonFile(filePath, { fallback = null, warn = false } = {}) {
	if (!existsSync(filePath)) return fallback;
	try {
		return JSON.parse(readFileSync(filePath, "utf8"));
	} catch (error) {
		if (warn) console.warn(`[Sync] Could not read JSON cache ${filePath}: ${error.message}`);
		return fallback;
	}
}

/** Supports both legacy array snapshots and snapshots whose entries live in `items`. */
export function getSnapshotItems(snapshot) {
	if (Array.isArray(snapshot)) return snapshot;
	if (Array.isArray(snapshot?.items)) return snapshot.items;
	return [];
}

/**
 * Load snapshot file into a key-value Map for fast caching and incremental updates.
 */
export function loadSnapshotCache(filePath, keyField = "id") {
	const snapshot = readJsonFile(filePath, { fallback: null, warn: true });
	const cache = new Map();
	for (const item of getSnapshotItems(snapshot)) {
		if (item && item[keyField] !== undefined && item[keyField] !== null) {
			cache.set(String(item[keyField]), item);
		}
	}
	return cache;
}

/**
 * Determines file extension from image URL with query string stripping and known format priorities.
 * Prioritizes modern web formats (.webp, .png, .jpg/.jpeg, .avif).
 */
export function inferImageExtension(url, defaultExt = "jpg") {
	if (typeof url !== "string" || !url.trim()) return defaultExt;
	try {
		const cleanPath = url.split("?")[0].split("#")[0];
		const match = cleanPath.match(/\.(webp|png|jpe?g|avif|gif|svg)$/i);
		if (match) {
			const ext = match[1].toLowerCase();
			return ext === "jpeg" ? "jpg" : ext;
		}
	} catch {
		// Fallback to defaultExt
	}
	return defaultExt;
}

/**
 * Creates standardized snapshot envelope matching Shirone schema conventions.
 */
export function createSnapshotEnvelope({ items, provider, accountRef, extra = {} }) {
	return {
		schemaVersion: 1,
		updatedAt: new Date().toISOString(),
		total: items.length,
		...(provider ? { provider } : {}),
		...(accountRef ? { accountRef } : {}),
		...extra,
		items,
	};
}

/**
 * Write through a temporary file then rename, so an interrupted sync does not
 * leave a truncated snapshot/config file behind.
 */
export function writeTextAtomic(filePath, content) {
	ensureDir(dirname(filePath));
	const tempPath = resolve(dirname(filePath), `.${basename(filePath)}.${process.pid}.tmp`);

	try {
		writeFileSync(tempPath, content, "utf8");
		renameSync(tempPath, filePath);
	} catch (error) {
		try {
			if (existsSync(tempPath)) unlinkSync(tempPath);
		} catch {
			// Preserve the original write/rename error.
		}
		throw error;
	}
}

export function writeJsonAtomic(filePath, value) {
	writeTextAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
