const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

assert.ok(existsSync(resolve(process.cwd(), "src/shared/vocabularyModel.ts")));
assert.ok(existsSync(resolve(process.cwd(), "src/shared/vocabularyStore.ts")));
assert.ok(existsSync(resolve(process.cwd(), "src/content/selection/selectionVocabulary.ts")));
assert.ok(existsSync(resolve(process.cwd(), "src/background/vocabularyExample.ts")));

const vocabularyFacade = readFileSync(
  resolve(process.cwd(), "src/shared/vocabulary.ts"),
  "utf8"
);
const selectionTranslation = readFileSync(
  resolve(process.cwd(), "src/content/selection/selectionTranslation.ts"),
  "utf8"
);
const translateSource = readFileSync(
  resolve(process.cwd(), "src/background/translate.ts"),
  "utf8"
);
const agentsSource = readFileSync(resolve(process.cwd(), "AGENTS.md"), "utf8");

assert.match(vocabularyFacade, /vocabularyModel/);
assert.match(vocabularyFacade, /vocabularyStore/);
assert.match(selectionTranslation, /selectionVocabulary/);
assert.doesNotMatch(translateSource, /generateVocabularyExample/);
assert.match(agentsSource, /vocabularyModel\.ts/);
assert.match(agentsSource, /vocabularyStore\.ts/);
assert.match(agentsSource, /selectionVocabulary\.ts/);
assert.match(agentsSource, /vocabularyExample\.ts/);

console.log("vocabulary structure contract test passed");
