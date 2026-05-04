const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

assert.ok(existsSync(resolve(process.cwd(), "src/content/core/translationStatus.ts")));

const injectSource = readFileSync(resolve(process.cwd(), "src/content/core/inject.ts"), "utf8");
assert.match(injectSource, /pending|loading|failed/);

console.log("live status test passed");
