const assert = require("node:assert/strict");
const { readFileSync, existsSync } = require("node:fs");
const { resolve } = require("node:path");

const typesSource = readFileSync(resolve(process.cwd(), "src/shared/types.ts"), "utf8");
const productSpec = readFileSync(resolve(process.cwd(), "docs/product-spec.md"), "utf8");
const technicalSpec = readFileSync(resolve(process.cwd(), "docs/technical-design.md"), "utf8");

assert.match(typesSource, /SELECTION_TRANSLATE/);
assert.match(typesSource, /SELECTION_TRANSLATE_RESULT/);
assert.match(productSpec, /划词翻译/);
assert.match(technicalSpec, /划词翻译/);

assert.ok(existsSync(resolve(process.cwd(), "src/content/selection/selectionPopup.ts")));
assert.ok(existsSync(resolve(process.cwd(), "src/content/selection/selectionPopup.css")));

const indexSource = readFileSync(resolve(process.cwd(), "src/content/index.ts"), "utf8");
assert.match(indexSource, /selectionTranslation/);

const backgroundIndex = readFileSync(resolve(process.cwd(), "src/background/index.ts"), "utf8");
const translateSource = readFileSync(resolve(process.cwd(), "src/background/translate.ts"), "utf8");

assert.match(backgroundIndex, /SELECTION_TRANSLATE/);
assert.match(backgroundIndex, /SELECTION_TRANSLATE_RESULT/);
assert.match(translateSource, /translateSelectionText/);

const popupSource = readFileSync(resolve(process.cwd(), "src/content/selection/selectionPopup.ts"), "utf8");
assert.match(popupSource, /loading/);
assert.match(popupSource, /error/);
assert.match(popupSource, /success/);

const selectionTranslationSource = readFileSync(resolve(process.cwd(), "src/content/selection/selectionTranslation.ts"), "utf8");
assert.match(selectionTranslationSource, /Control/);
assert.match(selectionTranslationSource, /Escape/);
assert.match(selectionTranslationSource, /event\.ctrlKey/);
assert.match(selectionTranslationSource, /imm-selection-popup/);
assert.match(selectionTranslationSource, /isContentEditable/);

console.log("selection translation contract test passed");
