const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const vocabularyModelSource = readFileSync(
  resolve(process.cwd(), "src/shared/vocabularyModel.ts"),
  "utf8"
);
const vocabularyStoreSource = readFileSync(
  resolve(process.cwd(), "src/shared/vocabularyStore.ts"),
  "utf8"
);
const vocabularyFacadeSource = readFileSync(
  resolve(process.cwd(), "src/shared/vocabulary.ts"),
  "utf8"
);

assert.match(vocabularyModelSource, /exampleSentence/);
assert.match(vocabularyModelSource, /exampleTranslation/);
assert.match(vocabularyModelSource, /isMastered/);
assert.match(vocabularyStoreSource, /selectionCount/);
assert.match(vocabularyStoreSource, /toggleVocabularyMastered/);
assert.match(vocabularyFacadeSource, /vocabularyModel/);
assert.match(vocabularyFacadeSource, /vocabularyStore/);
assert.doesNotMatch(vocabularyModelSource, /reviewCount/);
assert.doesNotMatch(vocabularyModelSource, /nextReviewAt/);

console.log("vocabulary redesign storage contract test passed");
