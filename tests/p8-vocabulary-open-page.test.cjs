const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const floatingSettingsSource = readFileSync(
  resolve(process.cwd(), "src/content/floating/floatingSettings.ts"),
  "utf8"
);
const backgroundSource = readFileSync(
  resolve(process.cwd(), "src/background/index.ts"),
  "utf8"
);
const typesSource = readFileSync(resolve(process.cwd(), "src/shared/types.ts"), "utf8");

assert.match(floatingSettingsSource, /sendToBackground\(\{ type: "OPEN_VOCABULARY_PAGE" \}\)/);
assert.doesNotMatch(floatingSettingsSource, /chrome\.tabs\.create/);
assert.match(backgroundSource, /OPEN_VOCABULARY_PAGE/);
assert.match(backgroundSource, /options\/vocabulary\.html/);
assert.match(backgroundSource, /chrome\.tabs\.create\(\{ url \}\)/);
assert.match(typesSource, /OPEN_VOCABULARY_PAGE/);
assert.match(typesSource, /OPEN_VOCABULARY_PAGE_RESULT/);

console.log("vocabulary open page contract test passed");
