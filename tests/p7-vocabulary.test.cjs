const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

assert.ok(existsSync(resolve(process.cwd(), "src/shared/vocabulary.ts")));
assert.ok(existsSync(resolve(process.cwd(), "src/options/vocabulary.html")));

const productSpec = readFileSync(resolve(process.cwd(), "docs/2026-05-02-mvp-product-spec.md"), "utf8");
assert.match(productSpec, /词汇库/);

console.log("vocabulary test passed");
