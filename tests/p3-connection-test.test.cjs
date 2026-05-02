const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const optionsHtml = readFileSync(resolve(process.cwd(), "src/options/index.html"), "utf8");
const optionsMain = readFileSync(resolve(process.cwd(), "src/options/main.ts"), "utf8");
const backgroundIndex = readFileSync(resolve(process.cwd(), "src/background/index.ts"), "utf8");
const typesSource = readFileSync(resolve(process.cwd(), "src/shared/types.ts"), "utf8");
const productSpec = readFileSync(resolve(process.cwd(), "docs/2026-05-02-mvp-product-spec.md"), "utf8");
const technicalSpec = readFileSync(resolve(process.cwd(), "docs/2026-05-02-mvp-technical-design.md"), "utf8");

assert.match(optionsHtml, /id="test-connection"/);
assert.match(optionsMain, /test-connection/);
assert.match(optionsMain, /TEST_CONNECTION/);
assert.match(backgroundIndex, /TEST_CONNECTION/);
assert.match(typesSource, /TEST_CONNECTION/);
assert.match(productSpec, /连接测试/);
assert.match(technicalSpec, /连接测试/);

console.log("p3 connection test feature check passed");
