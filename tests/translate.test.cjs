const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const source = readFileSync(resolve(process.cwd(), "src/background/translate.ts"), "utf8");

assert.match(source, /export function buildPrompt/);
assert.match(source, /export function parseStructuredTranslations/);
assert.match(source, /Output ONLY valid JSON/i);
assert.match(source, /"translations"/);
assert.match(source, /JSON\.parse/);
assert.match(source, /translatedText/);
assert.match(source, /itemIds/);

console.log("translate protocol test passed");
