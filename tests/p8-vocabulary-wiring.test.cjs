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

console.log("vocabulary wiring test passed");
