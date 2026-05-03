const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

assert.ok(existsSync(resolve(process.cwd(), "src/shared/vocabulary.ts")));
assert.ok(existsSync(resolve(process.cwd(), "src/options/vocabulary.html")));

const selectionTranslationSource = readFileSync(
  resolve(process.cwd(), "src/content/selection/selectionTranslation.ts"),
  "utf8"
);
const selectionVocabularySource = readFileSync(
  resolve(process.cwd(), "src/content/selection/selectionVocabulary.ts"),
  "utf8"
);

assert.match(selectionTranslationSource, /selectionVocabulary/);
assert.match(selectionTranslationSource, /saveSelectionToVocabulary/);
assert.match(selectionVocabularySource, /GENERATE_VOCAB_EXAMPLE/);
assert.match(selectionVocabularySource, /exampleSentence/);
assert.match(selectionVocabularySource, /exampleTranslation/);
assert.match(selectionVocabularySource, /upsertVocabularyItem/);

console.log("vocabulary test passed");
