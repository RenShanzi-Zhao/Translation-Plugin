const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const typesSource = readFileSync(resolve(process.cwd(), "src/shared/types.ts"), "utf8");
const backgroundSource = readFileSync(resolve(process.cwd(), "src/background/index.ts"), "utf8");
const translateSource = readFileSync(resolve(process.cwd(), "src/background/translate.ts"), "utf8");
const vocabularyExampleSource = readFileSync(
  resolve(process.cwd(), "src/background/vocabularyExample.ts"),
  "utf8"
);

assert.match(typesSource, /GENERATE_VOCAB_EXAMPLE/);
assert.match(typesSource, /GENERATE_VOCAB_EXAMPLE_RESULT/);
assert.match(backgroundSource, /GENERATE_VOCAB_EXAMPLE/);
assert.doesNotMatch(translateSource, /generateVocabularyExample/);
assert.match(vocabularyExampleSource, /generateVocabularyExample/);
assert.match(vocabularyExampleSource, /exampleSentence/);
assert.match(vocabularyExampleSource, /exampleTranslation/);

console.log("vocabulary example generation contract test passed");
