const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const indexSource = readFileSync(resolve(process.cwd(), "src/content/index.ts"), "utf8");
const backgroundSource = readFileSync(resolve(process.cwd(), "src/background/index.ts"), "utf8");
const selectionTranslationSource = readFileSync(
  resolve(process.cwd(), "src/content/selectionTranslation.ts"),
  "utf8"
);

assert.doesNotMatch(indexSource, /pdfDetection/);
assert.doesNotMatch(indexSource, /pdfTranslation/);
assert.doesNotMatch(indexSource, /markContentBootstrapped/);
assert.doesNotMatch(indexSource, /logContentBootstrap/);

assert.doesNotMatch(backgroundSource, /chrome\.action\.onClicked/);
assert.doesNotMatch(backgroundSource, /chrome\.scripting\.executeScript/);
assert.doesNotMatch(backgroundSource, /chrome\.scripting\.insertCSS/);
assert.doesNotMatch(backgroundSource, /probe/);

assert.doesNotMatch(selectionTranslationSource, /debugLog/);
assert.doesNotMatch(selectionTranslationSource, /registerSelectionSetup/);

assert.equal(existsSync(resolve(process.cwd(), "src/content/pdfDetection.ts")), false);
assert.equal(existsSync(resolve(process.cwd(), "src/content/pdfTranslation.ts")), false);
assert.equal(existsSync(resolve(process.cwd(), "src/content/debug.ts")), false);
assert.equal(existsSync(resolve(process.cwd(), "src/shared/debug.ts")), false);

console.log("cleanup test passed");
