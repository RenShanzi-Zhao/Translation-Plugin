const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const messagingSource = readFileSync(resolve(process.cwd(), "src/shared/messaging.ts"), "utf8");

assert.doesNotMatch(messagingSource, /Promise<any>/);
assert.match(messagingSource, /sendToBackground\(/);
assert.match(messagingSource, /Promise<.*BgResponse/);

console.log("messaging typing test passed");
