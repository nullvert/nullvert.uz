import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getSetting,
  getSnapshotItems,
  loadEnvFile,
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
