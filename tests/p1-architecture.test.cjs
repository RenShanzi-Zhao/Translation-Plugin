const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const requiredFiles = [
  "src/content/batching.ts",
  "src/content/orchestrator.ts",
  "src/content/lazyTranslation.ts",
  "src/content/spaMonitoring.ts",
  "src/content/floatingSettings.ts",
  "src/content/floatingProgress.ts",
  "src/content/floatingShortcut.ts",
];

for (const file of requiredFiles) {
  assert.ok(existsSync(resolve(process.cwd(), file)), `expected ${file} to exist`);
}

const contentIndex = readFileSync(resolve(process.cwd(), "src/content/index.ts"), "utf8");
const floatingFacade = readFileSync(resolve(process.cwd(), "src/content/floating.ts"), "utf8");

assert.match(contentIndex, /from "\.\/orchestrator"/);
assert.match(contentIndex, /from "\.\/lazyTranslation"/);
assert.match(contentIndex, /from "\.\/spaMonitoring"/);
assert.match(floatingFacade, /from "\.\/floatingSettings"/);
assert.match(floatingFacade, /from "\.\/floatingProgress"/);
assert.match(floatingFacade, /from "\.\/floatingShortcut"/);

console.log("p1 architecture test passed");
