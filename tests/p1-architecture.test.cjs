const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const requiredFiles = [
  "src/content/core/batching.ts",
  "src/content/core/orchestrator.ts",
  "src/content/runtime/lazyTranslation.ts",
  "src/content/runtime/spaMonitoring.ts",
  "src/content/runtime/pageTranslationController.ts",
  "src/content/floating/floatingSettings.ts",
  "src/content/floating/floatingProgress.ts",
  "src/content/floating/floatingShortcut.ts",
];

for (const file of requiredFiles) {
  assert.ok(existsSync(resolve(process.cwd(), file)), `expected ${file} to exist`);
}

const contentIndex = readFileSync(resolve(process.cwd(), "src/content/index.ts"), "utf8");
const floatingFacade = readFileSync(resolve(process.cwd(), "src/content/floating/floating.ts"), "utf8");

assert.match(contentIndex, /from "\.\/runtime\/pageTranslationController"/);
assert.match(floatingFacade, /from "\.\/floatingSettings"/);
assert.match(floatingFacade, /from "\.\/floatingProgress"/);
assert.match(floatingFacade, /from "\.\/floatingShortcut"/);

console.log("p1 architecture test passed");
