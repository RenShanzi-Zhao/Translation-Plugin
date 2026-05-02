# 悬浮球 + 批量优化 + 快捷键 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用可拖拽悬浮球取代 Popup，支持悬停设置、快捷键翻译，同时提升批量大小和并发数。

**Architecture:** 移除 Popup 模块，在 Content Script 中注入悬浮球 DOM。悬浮球可拖拽、悬停弹出设置面板、点击直接翻译。快捷键通过 manifest commands + content script keydown 监听实现。

**Tech Stack:** TypeScript, Chrome Extension Manifest V3, CSS

---

## 文件变更总览

```
删除: src/popup/ (整个目录)
修改: src/shared/constants.ts (批量大小、并发数)
修改: src/content/index.ts (移除 popup 消息处理，改为悬浮球触发)
修改: manifest.json (移除 default_popup，添加 commands)
创建: src/content/floating.ts (悬浮球 UI + 拖拽 + 设置面板)
创建: src/content/floating.css (悬浮球样式)
```

---

## Task 1: 更新批量和并发常量

**Files:**
- Modify: `src/shared/constants.ts`

- [ ] **Step 1: 修改常量**

将 `MAX_BATCH_ITEMS` 从 `8` 改为 `15`，将 `MAX_CONCURRENT_BATCHES` 从 `2` 改为 `5`：

```ts
export const MAX_BATCH_ITEMS = 15;
export const MAX_CONCURRENT_BATCHES = 5;
```

- [ ] **Step 2: 类型检查**

```bash
node ./node_modules/typescript/bin/tsc --noEmit
```

Expected: 无错误。

- [ ] **Step 3: 提交**

```bash
git add src/shared/constants.ts
git commit -m "feat: increase batch size to 15 and concurrency to 5"
```

---

## Task 2: 创建悬浮球模块

**Files:**
- Create: `src/content/floating.css`
- Create: `src/content/floating.ts`

- [ ] **Step 1: 创建 src/content/floating.css**

```css
.imm-float-btn {
  position: fixed;
  bottom: 80px;
  right: 30px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #1a73e8;
  color: #fff;
  border: none;
  cursor: grab;
  z-index: 2147483647;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  user-select: none;
  transition: box-shadow 0.2s, transform 0.1s;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.imm-float-btn:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  transform: scale(1.05);
}

.imm-float-btn:active {
  cursor: grabbing;
  transform: scale(0.95);
}

.imm-float-btn.translating {
  background: #f9ab00;
  animation: imm-pulse 1.5s infinite;
}

@keyframes imm-pulse {
  0%, 100% { box-shadow: 0 2px 10px rgba(249,171,0,0.4); }
  50% { box-shadow: 0 2px 20px rgba(249,171,0,0.7); }
}

.imm-settings-panel {
  position: fixed;
  z-index: 2147483646;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
  padding: 16px;
  width: 220px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 13px;
  color: #333;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.imm-settings-panel.visible {
  opacity: 1;
  pointer-events: auto;
}

.imm-settings-panel .imm-setting-label {
  display: block;
  font-size: 11px;
  color: #888;
  margin-bottom: 4px;
  margin-top: 10px;
}

.imm-settings-panel .imm-setting-label:first-child {
  margin-top: 0;
}

.imm-settings-panel select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 12px;
  background: #fff;
  outline: none;
}

.imm-settings-panel select:focus {
  border-color: #1a73e8;
}

.imm-settings-panel .imm-shortcut-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 12px;
  background: #f8f9fa;
  outline: none;
  cursor: pointer;
}

.imm-settings-panel .imm-shortcut-input:focus {
  border-color: #1a73e8;
  background: #fff;
}

.imm-settings-panel .imm-btn-row {
  display: flex;
  gap: 6px;
  margin-top: 14px;
}

.imm-settings-panel .imm-action-btn {
  flex: 1;
  padding: 7px 0;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.imm-settings-panel .imm-translate-btn {
  background: #1a73e8;
  color: #fff;
}

.imm-settings-panel .imm-translate-btn:hover {
  background: #1557b0;
}

.imm-settings-panel .imm-remove-btn {
  background: #f1f3f4;
  color: #333;
}

.imm-settings-panel .imm-remove-btn:hover {
  background: #e2e4e6;
}

.imm-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 2147483645;
  background: transparent;
  pointer-events: none;
}

.imm-progress-bar {
  height: 100%;
  background: #1a73e8;
  width: 0%;
  transition: width 0.3s;
}

.imm-progress.done .imm-progress-bar {
  background: #188038;
}
```

- [ ] **Step 2: 创建 src/content/floating.ts**

```ts
import { sendToBackground } from "../shared/messaging";
import type { TranslateItem, TranslationResult } from "../shared/types";

export type TranslateCallback = (targetLang: string) => void;
export type RemoveCallback = () => void;

let floatBtn: HTMLDivElement | null = null;
let settingsPanel: HTMLDivElement | null = null;
let progressBar: HTMLDivElement | null = null;
let progressBarInner: HTMLDivElement | null = null;
let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let btnStartX = 0;
let btnStartY = 0;

let currentTargetLang = "zh-CN";
let currentShortcut = "Ctrl+Shift+A";

function loadSettings() {
  try {
    const saved = localStorage.getItem("imm-settings");
    if (saved) {
      const s = JSON.parse(saved);
      if (s.targetLang) currentTargetLang = s.targetLang;
      if (s.shortcut) currentShortcut = s.shortcut;
    }
  } catch {}
}

function saveSettings() {
  try {
    localStorage.setItem("imm-settings", JSON.stringify({
      targetLang: currentTargetLang,
      shortcut: currentShortcut,
    }));
  } catch {}
}

function createProgressBar() {
  if (progressBar) return;
  progressBar = document.createElement("div");
  progressBar.className = "imm-progress";
  progressBarInner = document.createElement("div");
  progressBarInner.className = "imm-progress-bar";
  progressBar.appendChild(progressBarInner);
  document.documentElement.appendChild(progressBar);
}

function updateProgress(done: number, total: number) {
  if (!progressBar || !progressBarInner) return;
  const pct = total > 0 ? (done / total) * 100 : 0;
  progressBarInner.style.width = `${pct}%`;
}

function markProgressDone() {
  if (!progressBar) return;
  progressBar.classList.add("done");
  setTimeout(() => {
    progressBar?.remove();
    progressBar = null;
    progressBarInner = null;
  }, 1500);
}

function createSettingsPanel(): HTMLDivElement {
  const panel = document.createElement("div");
  panel.className = "imm-settings-panel";

  panel.innerHTML = `
    <label class="imm-setting-label">目标语言</label>
    <select id="imm-lang-select">
      <option value="zh-CN">英文 → 中文</option>
      <option value="en">中文 → 英文</option>
    </select>
    <label class="imm-setting-label">快捷键</label>
    <input type="text" class="imm-shortcut-input" id="imm-shortcut-input" readonly />
    <div class="imm-btn-row">
      <button class="imm-action-btn imm-translate-btn" id="imm-panel-translate">翻译</button>
      <button class="imm-action-btn imm-remove-btn" id="imm-panel-remove">移除</button>
    </div>
  `;

  document.documentElement.appendChild(panel);

  const langSelect = panel.querySelector("#imm-lang-select") as HTMLSelectElement;
  const shortcutInput = panel.querySelector("#imm-shortcut-input") as HTMLInputElement;
  const translateBtn = panel.querySelector("#imm-panel-translate") as HTMLButtonElement;
  const removeBtn = panel.querySelector("#imm-panel-remove") as HTMLButtonElement;

  langSelect.value = currentTargetLang;
  shortcutInput.value = currentShortcut;

  langSelect.addEventListener("change", () => {
    currentTargetLang = langSelect.value;
    saveSettings();
  });

  shortcutInput.addEventListener("keydown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const parts: string[] = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    if (e.metaKey) parts.push("Meta");
    if (!["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
      parts.push(e.key.toUpperCase());
    }
    if (parts.length >= 2) {
      currentShortcut = parts.join("+");
      shortcutInput.value = currentShortcut;
      saveSettings();
    }
  });

  translateBtn.addEventListener("click", () => {
    hideSettings();
    if (onTranslateCallback) onTranslateCallback(currentTargetLang);
  });

  removeBtn.addEventListener("click", () => {
    hideSettings();
    if (onRemoveCallback) onRemoveCallback();
  });

  return panel;
}

let onTranslateCallback: TranslateCallback | null = null;
let onRemoveCallback: RemoveCallback | null = null;

function showSettings() {
  if (!settingsPanel) {
    settingsPanel = createSettingsPanel();
  }
  if (!floatBtn) return;

  const rect = floatBtn.getBoundingClientRect();
  const panelWidth = 220;
  let left = rect.left - panelWidth - 10;
  if (left < 10) left = rect.right + 10;

  let top = rect.top;
  if (top + 200 > window.innerHeight) {
    top = window.innerHeight - 210;
  }
  if (top < 10) top = 10;

  settingsPanel.style.left = `${left}px`;
  settingsPanel.style.top = `${top}px`;
  settingsPanel.classList.add("visible");
}

function hideSettings() {
  settingsPanel?.classList.remove("visible");
}

function handleMouseDown(e: MouseEvent) {
  if (e.button !== 0) return;
  isDragging = false;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  const rect = floatBtn!.getBoundingClientRect();
  btnStartX = rect.left;
  btnStartY = rect.top;

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
}

function handleMouseMove(e: MouseEvent) {
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;

  if (!isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
    isDragging = true;
    hideSettings();
  }

  if (isDragging) {
    const newLeft = Math.max(0, Math.min(window.innerWidth - 48, btnStartX + dx));
    const newTop = Math.max(0, Math.min(window.innerHeight - 48, btnStartY + dy));
    floatBtn!.style.left = `${newLeft}px`;
    floatBtn!.style.top = `${newTop}px`;
    floatBtn!.style.right = "auto";
    floatBtn!.style.bottom = "auto";
  }
}

function handleMouseUp() {
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);

  if (!isDragging) {
    if (onTranslateCallback) onTranslateCallback(currentTargetLang);
  }
}

function handleMouseEnter() {
  if (isDragging) return;
  hoverTimeout = setTimeout(() => showSettings(), 300);
}

function handleMouseLeave() {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
  }
  setTimeout(() => {
    if (!settingsPanel?.matches(":hover") && !floatBtn?.matches(":hover")) {
      hideSettings();
    }
  }, 200);
}

function handlePanelMouseLeave() {
  if (!floatBtn?.matches(":hover")) {
    hideSettings();
  }
}

export function createFloatingButton(
  onTranslate: TranslateCallback,
  onRemove: RemoveCallback
) {
  loadSettings();
  onTranslateCallback = onTranslate;
  onRemoveCallback = onRemove;

  floatBtn = document.createElement("div");
  floatBtn.className = "imm-float-btn";
  floatBtn.textContent = "译";
  floatBtn.title = "点击翻译 | 悬停设置";

  floatBtn.addEventListener("mousedown", handleMouseDown);
  floatBtn.addEventListener("mouseenter", handleMouseEnter);
  floatBtn.addEventListener("mouseleave", handleMouseLeave);

  document.documentElement.appendChild(floatBtn);

  createProgressBar();
}

export function setFloatingButtonTranslating(isTranslating: boolean) {
  if (!floatBtn) return;
  if (isTranslating) {
    floatBtn.classList.add("translating");
  } else {
    floatBtn.classList.remove("translating");
  }
}

export function getTargetLang(): string {
  return currentTargetLang;
}

export function getShortcut(): string {
  return currentShortcut;
}

export function setupKeyboardShortcut(onTranslate: TranslateCallback) {
  document.addEventListener("keydown", (e) => {
    const parts: string[] = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    if (e.metaKey) parts.push("Meta");
    if (!["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
      parts.push(e.key.toUpperCase());
    }
    const pressed = parts.join("+");

    if (pressed === currentShortcut) {
      e.preventDefault();
      onTranslate(currentTargetLang);
    }
  });
}
```

- [ ] **Step 3: 类型检查**

```bash
node ./node_modules/typescript/bin/tsc --noEmit
```

Expected: 无错误。

- [ ] **Step 4: 提交**

```bash
git add src/content/floating.ts src/content/floating.css
git commit -m "feat: draggable floating button with hover settings and keyboard shortcut"
```

---

## Task 3: 修改 Content Script 入口，集成悬浮球

**Files:**
- Modify: `src/content/index.ts`

- [ ] **Step 1: 修改 src/content/index.ts**

在文件顶部添加导入：

```ts
import { createFloatingButton, setFloatingButtonTranslating, setupKeyboardShortcut, updateProgress, markProgressDone, getTargetLang } from "./floating";
```

将 `onMessage` 监听器替换为悬浮球初始化。找到文件末尾的：

```ts
onMessage(async (message: PopupMessage) => {
  if (message.type === "START_TRANSLATE") {
    if (hasExistingTranslations()) {
      chrome.runtime.sendMessage({
        type: "TRANSLATE_STATUS",
        status: "done",
        message: "页面已有译文，跳过已翻译段落",
      });
    }
    await startTranslation(message.targetLang);
  }

  if (message.type === "REMOVE_TRANSLATION") {
    removeAllTranslations();
    chrome.runtime.sendMessage({
      type: "TRANSLATE_STATUS",
      status: "removed",
    });
  }
});
```

替换为：

```ts
function handleTranslate(targetLang: string) {
  startTranslation(targetLang);
}

function handleRemove() {
  removeAllTranslations();
}

createFloatingButton(handleTranslate, handleRemove);
setupKeyboardShortcut(handleTranslate);
```

同时修改 `startTranslation` 函数中的状态通知部分，将 `chrome.runtime.sendMessage` 替换为悬浮球和进度条的调用：

找到：
```ts
  chrome.runtime.sendMessage({
    type: "TRANSLATE_STATUS",
    status: "translating",
    total: batches.length,
    done: 0,
  });
```

替换为：
```ts
  setFloatingButtonTranslating(true);
  updateProgress(0, batches.length);
```

找到：
```ts
    await translateAllBatches(batches, nodeMap, sourceLang, targetLang, (done, total) => {
      chrome.runtime.sendMessage({
        type: "TRANSLATE_STATUS",
        status: "translating",
        total,
        done,
      });
    });
```

替换为：
```ts
    await translateAllBatches(batches, nodeMap, sourceLang, targetLang, (done, total) => {
      updateProgress(done, total);
    });
```

找到：
```ts
    chrome.runtime.sendMessage({
      type: "TRANSLATE_STATUS",
      status: "done",
    });
```

替换为：
```ts
    markProgressDone();
```

找到：
```ts
    chrome.runtime.sendMessage({
      type: "TRANSLATE_STATUS",
      status: "error",
      message: "未检测到可翻译正文",
    });
```

替换为：
```ts
    // No container found — silent fail, button returns to normal
```

找到：
```ts
    chrome.runtime.sendMessage({
      type: "TRANSLATE_STATUS",
      status: "error",
      message: "未找到可翻译段落",
    });
```

替换为：
```ts
    // No translatable nodes — silent fail
```

找到：
```ts
    chrome.runtime.sendMessage({
      type: "TRANSLATE_STATUS",
      status: "error",
      message: "翻译过程中发生错误",
    });
```

替换为：
```ts
    markProgressDone();
```

在 `finally` 块中添加：
```ts
    setFloatingButtonTranslating(false);
```

- [ ] **Step 2: 类型检查**

```bash
node ./node_modules/typescript/bin/tsc --noEmit
```

Expected: 无错误。

- [ ] **Step 3: 提交**

```bash
git add src/content/index.ts
git commit -m "feat: integrate floating button into content script"
```

---

## Task 4: 更新 Manifest，移除 Popup

**Files:**
- Modify: `manifest.json`

- [ ] **Step 1: 修改 manifest.json**

移除 `action.default_popup`，添加 `commands`：

```json
{
  "manifest_version": 3,
  "name": "Immersive Translator",
  "version": "0.2.0",
  "description": "沉浸式双语翻译扩展",
  "permissions": ["storage", "activeTab", "scripting"],
  "action": {
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "commands": {
    "translate": {
      "suggested_key": {
        "default": "Ctrl+Shift+A"
      },
      "description": "翻译当前页面"
    }
  },
  "background": {
    "service_worker": "background/index.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/index.js"],
      "css": ["content/floating.css"],
      "run_at": "document_idle"
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

- [ ] **Step 2: 删除 popup 目录**

```bash
rm -rf src/popup
```

- [ ] **Step 3: 更新构建脚本**

修改 `scripts/build.ts`，移除 popup 构建步骤：

找到：
```ts
// Build all three entry points
run("npx vite build --config vite.config.ts");
run("npx vite build --config vite.config.ts --mode background");
run("npx vite build --config vite.config.ts --mode content");
```

替换为：
```ts
// Build background and content (popup removed, replaced by floating button)
run("npx vite build --config vite.config.ts --mode background");
run("npx vite build --config vite.config.ts --mode content");
```

找到：
```ts
// Copy manifest and icons
cpSync(resolve(root, "manifest.json"), resolve(root, "dist/manifest.json"));

if (existsSync(resolve(root, "icons"))) {
  cpSync(resolve(root, "icons"), resolve(root, "dist/icons"), { recursive: true });
}
```

替换为：
```ts
// Copy manifest, icons, and content CSS
cpSync(resolve(root, "manifest.json"), resolve(root, "dist/manifest.json"));

if (existsSync(resolve(root, "icons"))) {
  cpSync(resolve(root, "icons"), resolve(root, "dist/icons"), { recursive: true });
}

// Copy floating.css to dist/content/
const floatingCss = resolve(root, "src/content/floating.css");
if (existsSync(floatingCss)) {
  cpSync(floatingCss, resolve(root, "dist/content/floating.css"));
}
```

- [ ] **Step 4: 更新 vite.config.ts**

移除 popup 相关配置，简化：

找到完整的 `vite.config.ts` 内容，替换为：

```ts
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  if (mode === "background") {
    return {
      build: {
        rollupOptions: {
          input: resolve(__dirname, "src/background/index.ts"),
          output: { dir: resolve(__dirname, "dist/background"), format: "es", entryFileNames: "index.js" },
        },
        emptyOutDir: false,
        sourcemap: false,
        minify: true,
      },
      define: { "process.env": {} },
    };
  }

  // content (default mode)
  return {
    build: {
      rollupOptions: {
        input: resolve(__dirname, "src/content/index.ts"),
        output: { dir: resolve(__dirname, "dist/content"), format: "iife", entryFileNames: "index.js" },
      },
      emptyOutDir: false,
      sourcemap: false,
      minify: true,
    },
    define: { "process.env": {} },
  };
});
```

- [ ] **Step 5: 更新 package.json**

找到 scripts 部分，替换为：

```json
"scripts": {
  "build": "tsx scripts/build.ts",
  "build:background": "vite build --config vite.config.ts --mode background",
  "build:content": "vite build --config vite.config.ts"
}
```

- [ ] **Step 6: 类型检查**

```bash
node ./node_modules/typescript/bin/tsc --noEmit
```

Expected: 无错误。

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "feat: remove popup, add floating button, update manifest with commands"
```

---

## Task 5: 最终构建验证

- [ ] **Step 1: 完整构建**

```bash
npm run build
```

Expected: `dist/` 包含 `manifest.json`、`background/index.js`、`content/index.js`、`content/floating.css`、`icons/`。

- [ ] **Step 2: 验证 dist 结构**

```bash
Get-ChildItem -Recurse dist
```

Expected: 无 `popup/` 目录。

- [ ] **Step 3: 最终提交**

```bash
git add -A
git commit -m "feat: floating button MVP complete"
```

---

## 补充说明

### 悬浮球交互

- **点击** → 立即用当前语言设置翻译页面
- **悬停 300ms** → 弹出设置面板（语言选择、快捷键、翻译/移除按钮）
- **拖拽** → 自由移动位置（移动超过 3px 才算拖拽，防止误触）
- **翻译中** → 按钮变黄 + 脉冲动画

### 进度条

- 页面顶部蓝色进度条，翻译完成变绿后消失

### 快捷键

- 设置面板中点击快捷键输入框，按下新的组合键即可修改
- 存储在 `localStorage` 中，刷新页面保持

### 后续可优化

- 悬浮球位置记忆（localStorage）
- 翻译完成 toast 提示
- 悬浮球大小自适应
