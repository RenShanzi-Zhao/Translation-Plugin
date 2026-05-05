const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const indexSource = readFileSync(resolve(process.cwd(), "src/content/index.ts"), "utf8");
const backgroundSource = readFileSync(resolve(process.cwd(), "src/background/index.ts"), "utf8");
const selectionTranslationSource = readFileSync(
  resolve(process.cwd(), "src/content/selection/selectionTranslation.ts"),
  "utf8"
);
const selectionPopupSource = readFileSync(
  resolve(process.cwd(), "src/content/selection/selectionPopup.ts"),
  "utf8"
);
const floatingSettingsSource = readFileSync(
  resolve(process.cwd(), "src/content/floating/floatingSettings.ts"),
  "utf8"
);
const floatingButtonSource = readFileSync(
  resolve(process.cwd(), "src/content/floating/floatingButtonController.ts"),
  "utf8"
);
const floatingOverlaySource = readFileSync(
  resolve(process.cwd(), "src/content/floating/floatingOverlayController.ts"),
  "utf8"
);
const suspiciousMojibake = /鍒|缈|璇|鐐|鎮|璁|姝|澶|浼|鏄|姞|瘝|簱|脳/;

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
assert.doesNotMatch(selectionPopupSource, suspiciousMojibake);
assert.doesNotMatch(floatingSettingsSource, suspiciousMojibake);
assert.doesNotMatch(floatingButtonSource, suspiciousMojibake);
assert.doesNotMatch(floatingOverlaySource, suspiciousMojibake);

assert.equal(existsSync(resolve(process.cwd(), "src/content/pdfDetection.ts")), false);
assert.equal(existsSync(resolve(process.cwd(), "src/content/pdfTranslation.ts")), false);
assert.equal(existsSync(resolve(process.cwd(), "src/content/debug.ts")), false);
assert.equal(existsSync(resolve(process.cwd(), "src/shared/debug.ts")), false);

console.log("cleanup test passed");
