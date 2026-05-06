const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const siteRulesPath = resolve(process.cwd(), "src/content/core/siteRules.ts");
const selectorsPath = resolve(process.cwd(), "src/content/core/selectors.ts");
const extractPath = resolve(process.cwd(), "src/content/core/extract.ts");

assert.ok(existsSync(siteRulesPath), "siteRules.ts should exist");

const siteRulesSource = readFileSync(siteRulesPath, "utf8");
const selectorsSource = readFileSync(selectorsPath, "utf8");
const extractSource = readFileSync(extractPath, "utf8");

assert.match(siteRulesSource, /github\.com/);
assert.match(siteRulesSource, /contentSelectors/);
assert.match(siteRulesSource, /containerSelectors/);
assert.match(siteRulesSource, /excludedSelectors/);
assert.match(siteRulesSource, /blob-code/);
assert.match(siteRulesSource, /highlight/);
assert.match(siteRulesSource, /getSiteExtractionRule/);

assert.match(selectorsSource, /getSiteExtractionRule/);
assert.match(selectorsSource, /containerSelectors/);
assert.match(selectorsSource, /excludedSelectors/);

assert.match(extractSource, /resolveBlockCandidate/);
assert.match(extractSource, /extractCandidateFromTextNode/);
assert.match(extractSource, /shouldTranslateNode/);
assert.match(extractSource, /isCodeLikeBlock/);
assert.doesNotMatch(extractSource, /parentSet\.add\(parent\)/);

console.log("p14 extraction rules contract test passed");
