const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const vocabularySource = readFileSync(
  resolve(process.cwd(), "src/shared/vocabulary.ts"),
  "utf8"
);

assert.match(vocabularySource, /id:\s*string/);
assert.match(vocabularySource, /addVocabularyItem/);
assert.match(vocabularySource, /hasVocabularyItem/);
assert.match(vocabularySource, /removeVocabularyItem/);
assert.match(vocabularySource, /removeVocabularyItem\(id:/);

const popupSource = readFileSync(
  resolve(process.cwd(), "src/content/selectionPopup.ts"),
  "utf8"
);
const selectionSource = readFileSync(
  resolve(process.cwd(), "src/content/selectionTranslation.ts"),
  "utf8"
);

assert.match(popupSource, /加入词库|add to vocabulary|vocab-add/);
assert.match(popupSource, /showSelectionPopupSuccess/);
assert.match(selectionSource, /addVocabularyItem/);
assert.match(selectionSource, /showSelectionPopupSuccess/);

console.log("vocabulary wiring test passed");
