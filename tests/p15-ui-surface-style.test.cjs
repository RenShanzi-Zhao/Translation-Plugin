const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const floatingCss = readFileSync(
  resolve(process.cwd(), "src/content/floating/floating.css"),
  "utf8"
);
const floatingSettings = readFileSync(
  resolve(process.cwd(), "src/content/floating/floatingSettings.ts"),
  "utf8"
);
const popupCss = readFileSync(
  resolve(process.cwd(), "src/content/selection/selectionPopup.css"),
  "utf8"
);
const popupTs = readFileSync(
  resolve(process.cwd(), "src/content/selection/selectionPopup.ts"),
  "utf8"
);
const floatingButtonTs = readFileSync(
  resolve(process.cwd(), "src/content/floating/floatingButtonController.ts"),
  "utf8"
);
const overlayTs = readFileSync(
  resolve(process.cwd(), "src/content/floating/floatingOverlayController.ts"),
  "utf8"
);

assert.match(floatingCss, /--imm-surface-bg:/);
assert.match(floatingCss, /--imm-text-strong:/);
assert.match(floatingCss, /\.imm-settings-panel-title/);
assert.match(floatingCss, /\.imm-surface-btn/);
assert.match(floatingCss, /\.imm-primary-btn/);
assert.match(floatingCss, /\.imm-secondary-btn/);

assert.match(floatingSettings, /imm-settings-panel-eyebrow/);
assert.match(floatingSettings, /imm-settings-panel-title/);
assert.match(floatingSettings, /imm-surface-btn imm-primary-btn/);
assert.match(floatingSettings, /imm-surface-btn imm-secondary-btn/);

assert.match(popupCss, /--imm-popup-bg:/);
assert.match(popupCss, /\.imm-selection-popup-close/);
assert.match(popupCss, /\.imm-selection-popup-source/);
assert.match(popupCss, /\.imm-selection-popup-translation/);
assert.match(popupCss, /\.imm-selection-popup-add/);

assert.match(popupTs, /imm-selection-popup-close/);
assert.match(popupTs, /imm-selection-popup-source/);
assert.match(popupTs, /imm-selection-popup-translation/);
assert.match(floatingButtonTs, /开始翻译/);
assert.match(floatingButtonTs, /悬停显示设置/);
assert.match(overlayTs, /打开设置/);

assert.match(overlayTs, /offsetWidth/);
assert.match(overlayTs, /offsetHeight/);
assert.doesNotMatch(overlayTs, /const panelWidth = 220/);
assert.doesNotMatch(overlayTs, /top \+ 240/);

console.log("p15 ui surface style contract test passed");
