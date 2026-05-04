const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const controllerPath = resolve(
  process.cwd(),
  "src/content/runtime/pageTranslationController.ts"
);
const indexPath = resolve(process.cwd(), "src/content/index.ts");

assert.ok(existsSync(controllerPath), "pageTranslationController.ts should exist");

const controllerSource = readFileSync(controllerPath, "utf8");
const indexSource = readFileSync(indexPath, "utf8");

assert.match(controllerSource, /export function createPageTranslationController/);
assert.match(controllerSource, /restoreCurrentPageTranslations/);
assert.match(controllerSource, /startTranslation/);
assert.match(controllerSource, /handleRemove/);

assert.match(indexSource, /from "\.\/runtime\/pageTranslationController"/);
assert.match(indexSource, /createPageTranslationController/);
assert.doesNotMatch(indexSource, /createLazyTranslationController/);
assert.doesNotMatch(indexSource, /createSPAMonitoring/);
assert.doesNotMatch(indexSource, /translateBatches/);
assert.doesNotMatch(indexSource, /restoreCachedTranslations/);

console.log("p17 content entry structure test passed");
