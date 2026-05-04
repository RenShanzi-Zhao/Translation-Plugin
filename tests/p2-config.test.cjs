const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const requiredFiles = [
  "src/options/index.html",
  "src/options/main.ts",
  "src/options/style.css",
  "src/shared/config.ts",
];

for (const file of requiredFiles) {
  assert.ok(existsSync(resolve(process.cwd(), file)), `expected ${file} to exist`);
}

const manifest = JSON.parse(
  readFileSync(resolve(process.cwd(), "manifest.json"), "utf8")
);
assert.equal(manifest.options_page, "options/index.html");

const translateSource = readFileSync(
  resolve(process.cwd(), "src/background/translate.ts"),
  "utf8"
);
assert.match(translateSource, /getRuntimeConfig/);

const configSource = readFileSync(
  resolve(process.cwd(), "src/shared/config.ts"),
  "utf8"
);
assert.match(configSource, /chrome\.storage/);

console.log("p2 config test passed");
