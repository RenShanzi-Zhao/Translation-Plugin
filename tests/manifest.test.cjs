const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const manifestPath = resolve(process.cwd(), "manifest.json");
const manifestText = readFileSync(manifestPath, "utf8");
const manifest = JSON.parse(manifestText);

assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.action?.default_popup, undefined);
assert.ok(manifest.commands?.translate, "expected translate command to be declared");
assert.deepEqual(manifest.content_scripts?.[0]?.css, ["content/floating.css"]);

console.log("manifest test passed");
