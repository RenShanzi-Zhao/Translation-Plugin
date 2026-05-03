const assert = require("node:assert/strict");
const { readFileSync, existsSync } = require("node:fs");
const { resolve } = require("node:path");

const typesSource = readFileSync(resolve(process.cwd(), "src/shared/types.ts"), "utf8");
const productSpec = readFileSync(resolve(process.cwd(), "docs/2026-05-02-mvp-product-spec.md"), "utf8");
const technicalSpec = readFileSync(resolve(process.cwd(), "docs/2026-05-02-mvp-technical-design.md"), "utf8");

assert.match(typesSource, /SELECTION_TRANSLATE/);
assert.match(typesSource, /SELECTION_TRANSLATE_RESULT/);
assert.match(productSpec, /划词翻译/);
assert.match(technicalSpec, /划词翻译/);

assert.ok(existsSync(resolve(process.cwd(), "src/content/selectionPopup.ts")));
assert.ok(existsSync(resolve(process.cwd(), "src/content/selectionPopup.css")));

const indexSource = readFileSync(resolve(process.cwd(), "src/content/index.ts"), "utf8");
assert.match(indexSource, /selectionTranslation/);
assert.match(indexSource, /Ctrl/);

console.log("selection translation contract test passed");
