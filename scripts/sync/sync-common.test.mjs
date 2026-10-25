import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createSnapshotEnvelope,
  getSetting,
  getSnapshotItems,
  inferImageExtension,
  isForceRefreshRequested,
  loadEnvFile,
  loadSnapshotCache,
  readJsonFile,
  writeJsonAtomic,
} from "./sync-common.mjs";

test("loadEnvFile supports comments, export, quoted values, and inline comments", () => {
  const dir = mkdtempSync(join(tmpdir(), "shirone-env-test-"));
  const file = join(dir, ".env");
  try {
    writeFileSync(file, [
      "# comment",
      "PLAIN=value # inline comment",
      "export TOKEN=abc123",
      'QUOTED="value # retained" # trailing comment',
      "SINGLE=' spaced value '",
      'MULTILINE="line1\\nline2"',
    ].join("\n"));

    assert.deepEqual(loadEnvFile(file), {
      PLAIN: "value",
      TOKEN: "abc123",
      QUOTED: "value # retained",
      SINGLE: " spaced value ",
      MULTILINE: "line1\nline2",
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("getSetting applies CLI, process environment, file environment, then fallback", () => {
  const name = `SYNC_TEST_${process.pid}`;
  const original = process.env[name];
  try {
    process.env[name] = " from-process ";
    assert.equal(getSetting(name, { cliValue: " from-cli ", env: { [name]: "from-file" }, fallback: "default" }), "from-cli");
    assert.equal(getSetting(name, { env: { [name]: "from-file" }, fallback: "default" }), "from-process");
    delete process.env[name];
    assert.equal(getSetting(name, { env: { [name]: "from-file" }, fallback: "default" }), "from-file");
    assert.equal(getSetting(name, { env: {}, fallback: "default" }), "default");
  } finally {
    if (original === undefined) delete process.env[name];
    else process.env[name] = original;
  }
});

test("getSnapshotItems supports legacy arrays and object envelopes", () => {
  const items = [{ id: "1" }];
  assert.deepEqual(getSnapshotItems(items), items);
  assert.deepEqual(getSnapshotItems({ schemaVersion: 1, items }), items);
  assert.deepEqual(getSnapshotItems({ items: "not-an-array" }), []);
  assert.deepEqual(getSnapshotItems(null), []);
});

test("writeJsonAtomic writes valid JSON with a trailing newline", () => {
  const dir = mkdtempSync(join(tmpdir(), "shirone-json-test-"));
  const file = join(dir, "snapshot.json");
  try {
    const value = { schemaVersion: 1, items: [{ id: "a" }] };
    writeJsonAtomic(file, value);
    assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), value);
    assert.ok(readFileSync(file, "utf8").endsWith("\n"));
    assert.equal(readJsonFile(file).items[0].id, "a");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("isForceRefreshRequested recognizes CLI flags and environment variables", () => {
  assert.equal(isForceRefreshRequested(["node", "script.mjs"]), false);
  assert.equal(isForceRefreshRequested(["node", "script.mjs", "--refresh"]), true);
  assert.equal(isForceRefreshRequested(["node", "script.mjs", "-r"]), true);
  assert.equal(isForceRefreshRequested(["node", "script.mjs"], { REFRESH_METADATA: "true" }), true);
});

test("inferImageExtension handles query strings, hashes, and default fallback", () => {
  assert.equal(inferImageExtension("https://simkl.in/posters/abc_m.webp"), "webp");
  assert.equal(inferImageExtension("https://example.com/cover.PNG?version=2&size=large#top"), "png");
  assert.equal(inferImageExtension("https://example.com/cover.JPEG?token=xyz"), "jpg");
  assert.equal(inferImageExtension("https://example.com/image_without_extension"), "jpg");
  assert.equal(inferImageExtension("", "webp"), "webp");
});

test("loadSnapshotCache loads items into a fast Map by given keyField", () => {
  const dir = mkdtempSync(join(tmpdir(), "shirone-cache-test-"));
  const file = join(dir, "snapshot.json");
  try {
    writeJsonAtomic(file, {
      items: [
        { id: "101", title: "Game A" },
        { id: "102", title: "Game B" },
      ],
    });
    const cache = loadSnapshotCache(file, "id");
    assert.equal(cache.size, 2);
    assert.equal(cache.get("101")?.title, "Game A");
    assert.equal(cache.get("102")?.title, "Game B");
    assert.equal(cache.get("999"), undefined);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("createSnapshotEnvelope formats unified metadata structure", () => {
  const envelope = createSnapshotEnvelope({
    provider: "test-provider",
    accountRef: "user123",
    items: [{ id: "1" }],
  });
  assert.equal(envelope.schemaVersion, 1);
  assert.equal(envelope.provider, "test-provider");
  assert.equal(envelope.accountRef, "user123");
  assert.equal(envelope.total, 1);
  assert.ok(typeof envelope.updatedAt === "string");
  assert.equal(envelope.items.length, 1);
});

