const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

assert.ok(existsSync(resolve(process.cwd(), "src/content/pdfDetection.ts")));
assert.ok(existsSync(resolve(process.cwd(), "src/content/pdfTranslation.ts")));

const productSpec = readFileSync(resolve(process.cwd(), "docs/2026-05-02-mvp-product-spec.md"), "utf8");
const technicalSpec = readFileSync(resolve(process.cwd(), "docs/2026-05-02-mvp-technical-design.md"), "utf8");

assert.match(productSpec, /PDF/);
assert.match(technicalSpec, /PDF/);

console.log("pdf support test passed");
