const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

assert.equal(
  existsSync(resolve(process.cwd(), "src/content/floating/floatingButtonController.ts")),
  true
);
assert.equal(
  existsSync(resolve(process.cwd(), "src/content/floating/floatingOverlayController.ts")),
  true
);

const floatingSource = readFileSync(
  resolve(process.cwd(), "src/content/floating/floating.ts"),
  "utf8"
);

assert.match(floatingSource, /floatingButtonController/);
assert.match(floatingSource, /floatingOverlayController/);
assert.match(floatingSource, /export async function createFloatingButton/);
assert.match(floatingSource, /export function setFloatingButtonTranslating/);

console.log("floating structure test passed");
