const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const vocabularyPageSource = readFileSync(
  resolve(process.cwd(), "src/options/vocabulary.ts"),
  "utf8"
);
const vocabularyHtml = readFileSync(
  resolve(process.cwd(), "src/options/vocabulary.html"),
  "utf8"
);
const vocabularyCss = readFileSync(
  resolve(process.cwd(), "src/options/vocabulary.css"),
  "utf8"
);

assert.match(vocabularyPageSource, /toggleVocabularyMastered/);
assert.match(vocabularyPageSource, /exampleSentence/);
assert.match(vocabularyPageSource, /exampleTranslation/);
assert.match(vocabularyPageSource, /划线/);
assert.match(vocabularyPageSource, /已掌握/);
assert.match(vocabularyPageSource, /未掌握/);
assert.match(vocabularyPageSource, /删除/);
assert.doesNotMatch(vocabularyPageSource, /Continue Learning/);
assert.doesNotMatch(vocabularyPageSource, /Mark Mastered/);
assert.doesNotMatch(vocabularyPageSource, /selected/);
assert.doesNotMatch(vocabularyPageSource, /reviewed/);
assert.match(vocabularyHtml, /个人词汇库/);
assert.match(vocabularyCss, /--page-bg/);
assert.match(vocabularyCss, /--card-bg/);

console.log("vocabulary review UI contract test passed");
