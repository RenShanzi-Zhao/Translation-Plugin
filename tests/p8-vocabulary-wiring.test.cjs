const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const vocabularyFacadeSource = readFileSync(
  resolve(process.cwd(), "src/shared/vocabulary.ts"),
  "utf8"
);
const vocabularyModelSource = readFileSync(
  resolve(process.cwd(), "src/shared/vocabularyModel.ts"),
  "utf8"
);
const vocabularyStoreSource = readFileSync(
  resolve(process.cwd(), "src/shared/vocabularyStore.ts"),
  "utf8"
);

assert.match(vocabularyFacadeSource, /vocabularyModel/);
assert.match(vocabularyFacadeSource, /vocabularyStore/);
assert.match(vocabularyModelSource, /id:\s*string/);
assert.match(vocabularyStoreSource, /addVocabularyItem/);
assert.match(vocabularyStoreSource, /hasVocabularyItem/);
assert.match(vocabularyStoreSource, /removeVocabularyItem/);
assert.match(vocabularyStoreSource, /removeVocabularyItem\(id:/);

const popupSource = readFileSync(
  resolve(process.cwd(), "src/content/selection/selectionPopup.ts"),
  "utf8"
);
const selectionSource = readFileSync(
  resolve(process.cwd(), "src/content/selection/selectionVocabulary.ts"),
  "utf8"
);

assert.match(popupSource, /加入词库|add to vocabulary|vocab-add/);
assert.match(popupSource, /showSelectionPopupSuccess/);
assert.match(selectionSource, /upsertVocabularyItem/);
assert.match(selectionSource, /GENERATE_VOCAB_EXAMPLE/);

const vocabularyPageSource = readFileSync(
  resolve(process.cwd(), "src/options/vocabulary.ts"),
  "utf8"
);

assert.match(vocabularyPageSource, /data-id/);
assert.match(vocabularyPageSource, /removeVocabularyItem\(id\)/);

console.log("vocabulary wiring test passed");
