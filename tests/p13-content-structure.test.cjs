const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const requiredFiles = [
  "src/content/index.ts",
  "src/content/core/extract.ts",
  "src/content/core/inject.ts",
  "src/content/core/selectors.ts",
  "src/content/core/batching.ts",
  "src/content/core/orchestrator.ts",
  "src/content/core/translationStatus.ts",
  "src/content/runtime/lazyTranslation.ts",
  "src/content/runtime/spaMonitoring.ts",
  "src/content/floating/floating.ts",
  "src/content/floating/floatingButtonController.ts",
  "src/content/floating/floatingOverlayController.ts",
  "src/content/floating/floatingSettings.ts",
  "src/content/floating/floatingProgress.ts",
  "src/content/floating/floatingShortcut.ts",
  "src/content/floating/floating.css",
  "src/content/selection/selectionTranslation.ts",
  "src/content/selection/selectionVocabulary.ts",
  "src/content/selection/selectionPopup.ts",
  "src/content/selection/selectionPopup.css",
];

for (const file of requiredFiles) {
  assert.ok(existsSync(resolve(process.cwd(), file)), `${file} should exist`);
}

const legacyRootFiles = [
  "src/content/extract.ts",
  "src/content/inject.ts",
  "src/content/selectors.ts",
  "src/content/batching.ts",
  "src/content/orchestrator.ts",
  "src/content/translationStatus.ts",
  "src/content/lazyTranslation.ts",
  "src/content/spaMonitoring.ts",
  "src/content/floating.ts",
  "src/content/floatingButtonController.ts",
  "src/content/floatingOverlayController.ts",
  "src/content/floatingSettings.ts",
  "src/content/floatingProgress.ts",
  "src/content/floatingShortcut.ts",
  "src/content/floating.css",
  "src/content/selectionTranslation.ts",
  "src/content/selectionVocabulary.ts",
  "src/content/selectionPopup.ts",
  "src/content/selectionPopup.css",
];

for (const file of legacyRootFiles) {
  assert.equal(existsSync(resolve(process.cwd(), file)), false, `${file} should be moved`);
}

const agentsSource = readFileSync(resolve(process.cwd(), "AGENTS.md"), "utf8");
assert.match(agentsSource, /core\//);
assert.match(agentsSource, /runtime\//);
assert.match(agentsSource, /floating\//);
assert.match(agentsSource, /selection\//);

console.log("content structure contract test passed");
