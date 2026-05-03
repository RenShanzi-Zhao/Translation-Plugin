# Selection Translation, PDF Support, Live Status, and Personal Vocabulary Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有沉浸式整页翻译插件上，按既定顺序扩展 4 个能力：划词翻译、PDF 支持、实时翻译状态、个人词汇库。

**Architecture:** 采用“分阶段交付”的方式推进，每一阶段都要求独立可用、可验证、可回退。第一阶段先做网页划词翻译，建立选区监听、小弹窗和局部翻译链路；第二阶段再扩展 PDF 支持；第三阶段补段落级实时状态；第四阶段在划词翻译的基础上接入个人词汇采集与管理。

**Tech Stack:** TypeScript, Vite, Manifest V3, content scripts, background service worker, chrome.storage.local, localStorage, OpenAI-compatible API

---

## Scope Note

这 4 个方向技术上并不完全独立，但它们有明确的前后依赖：

1. `划词翻译` 是后续词汇库的基础
2. `PDF 支持` 是单独能力分支，建议在网页划词翻译稳定后再做
3. `实时状态` 会改进整页翻译和后续 PDF/划词体验
4. `个人词汇库` 依赖划词翻译和局部交互

因此这里保留为 **一个总路线图计划文件**，但执行时应按阶段拆批推进，而不是一次并行做完。

---

## Planned File Map

### Existing files likely to modify

- Modify: `manifest.json`
- Modify: `src/shared/types.ts`
- Modify: `src/shared/messaging.ts`
- Modify: `src/shared/constants.ts`
- Modify: `src/content/index.ts`
- Modify: `src/content/floating.ts`
- Modify: `src/content/floating.css`
- Modify: `src/background/index.ts`
- Modify: `src/background/translate.ts`
- Modify: `src/options/index.html`
- Modify: `src/options/main.ts`
- Modify: `src/options/style.css`
- Modify: `docs/2026-05-02-mvp-product-spec.md`
- Modify: `docs/2026-05-02-mvp-technical-design.md`
- Modify: `AGENTS.md`

### New files expected for Phase 1: Selection Translation

- Create: `src/content/selectionTranslation.ts`
- Create: `src/content/selectionPopup.ts`
- Create: `src/content/selectionPopup.css`
- Create: `tests/p4-selection-translation.test.cjs`

### New files expected for Phase 2: PDF Support

- Create: `src/content/pdfDetection.ts`
- Create: `src/content/pdfTranslation.ts`
- Create: `tests/p5-pdf-support.test.cjs`

### New files expected for Phase 3: Live Status

- Create: `src/content/translationStatus.ts`
- Create: `tests/p6-live-status.test.cjs`

### New files expected for Phase 4: Personal Vocabulary

- Create: `src/shared/vocabulary.ts`
- Create: `src/options/vocabulary.html`
- Create: `src/options/vocabulary.ts`
- Create: `src/options/vocabulary.css`
- Create: `tests/p7-vocabulary.test.cjs`

---

## Phase Order

1. Phase 1: 划词翻译
2. Phase 2: PDF 支持
3. Phase 3: 实时翻译状态
4. Phase 4: 个人词汇库

---

## Phase 1 Design Summary: Selection Translation

### User experience

- 用户在普通网页中按住 `Ctrl` 进行选区
- 一旦存在非空选区，弹出一个小卡片
- 小卡片显示原文片段、加载态、译文、关闭按钮
- 后续词汇库阶段，小卡片将扩展“加入词库”按钮

### Interaction rules

- 默认只在普通网页内容区域触发，不在输入框、代码块中触发
- 只有非空选区才触发
- 失焦、点击空白、按 `Esc` 时关闭
- 同一时间只保留一个划词翻译弹窗

### Technical approach

- content script 监听 `selectionchange`、`mouseup`、`keydown`、`keyup`
- 检查 `Ctrl` 状态和当前 `Selection`
- 把选中的文本发给 background 执行翻译
- 用独立 popup 组件在选区附近显示结果

---

## Phase 2 Design Summary: PDF Support

> Note added after implementation investigation on 2026-05-03:
> Native Edge PDF viewer support is currently deferred. Investigation showed that even with successful script injection, PDF text selection is not exposed through standard `window.getSelection()` in the native viewer. See `docs/2026-05-03-pdf-support-investigation.md` for the detailed findings and the recommended future direction of using an extension-controlled PDF viewer page.

### User experience

- 用户在 Edge 打开的 PDF 页面中，能对选中文本使用和普通网页一致的划词翻译
- 第一阶段不追求 PDF 页面内整段沉浸式插入译文
- PDF 支持优先以“划词翻译可用”为目标

### Technical approach

- 先做 PDF 页面识别
- 验证 Edge PDF viewer 中的文本选区是否可通过标准 `window.getSelection()` 拿到
- 如果能拿到，则直接复用划词翻译链路
- 如果不能稳定拿到，则退化为“仅支持 PDF 文本图层可选内容”

### Explicit non-goals in this phase

- 不做 PDF 页面内原位双语插入
- 不做扫描版 PDF OCR
- 不做 PDF 整页批量翻译

---

## Phase 3 Design Summary: Live Status

### User experience

- 整页翻译时，原文下方先显示“翻译中”的占位块
- 占位块带转圈、脉冲点或骨架屏
- 翻译完成后，占位块替换为正式译文
- 失败时显示失败态和简短提示

### Technical approach

- 在 `inject.ts` 或新模块中引入三态：
  - pending
  - success
  - failed
- 在任务调度开始时先插入 pending block
- background 返回后更新具体 block

---

## Phase 4 Design Summary: Personal Vocabulary

### User experience

- 用户在划词翻译卡片中点击“加入词库”
- 保存词条、释义、原句、来源页面、时间
- 在 options 页新增一个简单词汇列表页面

### Technical approach

- 词汇数据存 `chrome.storage.local`
- 先做轻量本地词库，不做远程同步
- 先做采集和展示，不做记忆曲线和学习算法

---

## Task 1: Phase 1 Spec and Message Contract for Selection Translation

**Files:**
- Modify: `src/shared/types.ts`
- Modify: `src/shared/messaging.ts`
- Modify: `docs/2026-05-02-mvp-product-spec.md`
- Modify: `docs/2026-05-02-mvp-technical-design.md`
- Test: `tests/p4-selection-translation.test.cjs`

- [ ] **Step 1: Write the failing feature-check test**

```js
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const typesSource = readFileSync(resolve(process.cwd(), "src/shared/types.ts"), "utf8");
const productSpec = readFileSync(resolve(process.cwd(), "docs/2026-05-02-mvp-product-spec.md"), "utf8");
const technicalSpec = readFileSync(resolve(process.cwd(), "docs/2026-05-02-mvp-technical-design.md"), "utf8");

assert.match(typesSource, /SELECTION_TRANSLATE/);
assert.match(typesSource, /SELECTION_TRANSLATE_RESULT/);
assert.match(productSpec, /划词翻译/);
assert.match(technicalSpec, /划词翻译/);

console.log("selection translation contract test passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node tests\p4-selection-translation.test.cjs
```

Expected:

- FAIL because message types and docs are not present yet

- [ ] **Step 3: Add minimal message types**

Add these types in `src/shared/types.ts`:

```ts
export type SelectionTranslateRequest = {
  text: string;
  sourceLang: string;
  targetLang: string;
};

export type SelectionTranslateResponse = {
  translatedText: string;
};

export type ContentToBgMessage =
  | { type: "TRANSLATE_BATCH"; items: TranslateItem[]; sourceLang: string; targetLang: string }
  | { type: "TEST_CONNECTION"; config: TestConnectionPayload }
  | { type: "SELECTION_TRANSLATE"; text: string; sourceLang: string; targetLang: string }
  | { type: "PING" };

export type BgToContentMessage =
  | { type: "TRANSLATE_RESULT"; translations: TranslationResult[] }
  | { type: "TRANSLATE_ERROR"; error: TranslateError }
  | { type: "TEST_CONNECTION_RESULT"; ok: boolean; message: string }
  | { type: "SELECTION_TRANSLATE_RESULT"; translatedText: string };
```

- [ ] **Step 4: Update docs with the new feature scope**

Update product doc to include:

```md
- 支持按住 Ctrl 的划词翻译
- 支持划词结果小弹窗
```

Update technical doc to include:

```md
- content script 监听 Selection 和 Ctrl 状态
- selection translation 通过独立消息链路走 background
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
node tests\p4-selection-translation.test.cjs
```

Expected:

- PASS with `selection translation contract test passed`

- [ ] **Step 6: Commit**

```bash
git add src/shared/types.ts src/shared/messaging.ts docs/2026-05-02-mvp-product-spec.md docs/2026-05-02-mvp-technical-design.md tests/p4-selection-translation.test.cjs
git commit -m "plan: define selection translation message contract"
```

---

## Task 2: Phase 1 Selection Popup UI

**Files:**
- Create: `src/content/selectionPopup.ts`
- Create: `src/content/selectionPopup.css`
- Test: `tests/p4-selection-translation.test.cjs`

- [ ] **Step 1: Extend the failing test for popup files**

Append these checks:

```js
const { existsSync } = require("node:fs");

assert.ok(existsSync(resolve(process.cwd(), "src/content/selectionPopup.ts")));
assert.ok(existsSync(resolve(process.cwd(), "src/content/selectionPopup.css")));
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node tests\p4-selection-translation.test.cjs
```

Expected:

- FAIL because popup files do not exist yet

- [ ] **Step 3: Create minimal popup module**

Create `src/content/selectionPopup.ts` with:

```ts
export type SelectionPopupState = "idle" | "loading" | "success" | "error";

export function ensureSelectionPopup(): HTMLDivElement {
  let popup = document.getElementById("imm-selection-popup") as HTMLDivElement | null;
  if (popup) return popup;

  popup = document.createElement("div");
  popup.id = "imm-selection-popup";
  popup.className = "imm-selection-popup hidden";
  popup.innerHTML = `
    <div class="imm-selection-popup-body">
      <div class="imm-selection-popup-status"></div>
      <div class="imm-selection-popup-text"></div>
    </div>
  `;
  document.documentElement.appendChild(popup);
  return popup;
}

export function hideSelectionPopup() {
  const popup = document.getElementById("imm-selection-popup");
  popup?.classList.add("hidden");
}
```

- [ ] **Step 4: Create minimal popup styles**

Create `src/content/selectionPopup.css` with:

```css
.imm-selection-popup {
  position: fixed;
  z-index: 2147483647;
  max-width: 320px;
  background: #ffffff;
  border: 1px solid #dbe1ea;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14);
  padding: 12px;
  font-size: 13px;
  color: #111827;
}

.imm-selection-popup.hidden {
  display: none;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
node tests\p4-selection-translation.test.cjs
```

Expected:

- PASS on popup file existence checks

- [ ] **Step 6: Commit**

```bash
git add src/content/selectionPopup.ts src/content/selectionPopup.css tests/p4-selection-translation.test.cjs
git commit -m "feat: scaffold selection translation popup"
```

---

## Task 3: Phase 1 Selection Detection and Trigger Logic

**Files:**
- Create: `src/content/selectionTranslation.ts`
- Modify: `src/content/index.ts`
- Test: `tests/p4-selection-translation.test.cjs`

- [ ] **Step 1: Extend the failing test for selection controller**

Append these checks:

```js
const indexSource = readFileSync(resolve(process.cwd(), "src/content/index.ts"), "utf8");
assert.match(indexSource, /selectionTranslation/);
assert.match(indexSource, /Ctrl/);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node tests\p4-selection-translation.test.cjs
```

Expected:

- FAIL because selection controller is not wired yet

- [ ] **Step 3: Create selection translation controller**

Create `src/content/selectionTranslation.ts`:

```ts
import { sendToBackground } from "../shared/messaging";

export function setupSelectionTranslation(getTargetLang: () => string) {
  let ctrlPressed = false;

  document.addEventListener("keydown", (event) => {
    if (event.key === "Control") {
      ctrlPressed = true;
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.key === "Control") {
      ctrlPressed = false;
    }
  });

  document.addEventListener("mouseup", async () => {
    if (!ctrlPressed) return;
    const selection = window.getSelection()?.toString().trim() || "";
    if (!selection) return;

    await sendToBackground({
      type: "SELECTION_TRANSLATE",
      text: selection,
      sourceLang: "auto",
      targetLang: getTargetLang(),
    });
  });
}
```

- [ ] **Step 4: Wire controller in `src/content/index.ts`**

Add:

```ts
import { setupSelectionTranslation } from "./selectionTranslation";
```

And initialize:

```ts
setupSelectionTranslation(() => currentTargetLang);
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
node tests\p4-selection-translation.test.cjs
```

Expected:

- PASS on file and wiring checks

- [ ] **Step 6: Commit**

```bash
git add src/content/selectionTranslation.ts src/content/index.ts tests/p4-selection-translation.test.cjs
git commit -m "feat: add selection translation trigger controller"
```

---

## Task 4: Phase 1 Background Handling for Selection Translation

**Files:**
- Modify: `src/background/index.ts`
- Modify: `src/background/translate.ts`
- Test: `tests/p4-selection-translation.test.cjs`

- [ ] **Step 1: Extend the failing test for background handling**

Append these checks:

```js
const backgroundIndex = readFileSync(resolve(process.cwd(), "src/background/index.ts"), "utf8");
const translateSource = readFileSync(resolve(process.cwd(), "src/background/translate.ts"), "utf8");

assert.match(backgroundIndex, /SELECTION_TRANSLATE/);
assert.match(backgroundIndex, /SELECTION_TRANSLATE_RESULT/);
assert.match(translateSource, /translateSelectionText/);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node tests\p4-selection-translation.test.cjs
```

Expected:

- FAIL because background flow does not exist yet

- [ ] **Step 3: Add minimal translation helper**

In `src/background/translate.ts`, add:

```ts
export async function translateSelectionText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const results = await translateBatch(
    [{ id: "selection", text }],
    sourceLang,
    targetLang
  );
  return results[0]?.translatedText || "";
}
```

- [ ] **Step 4: Handle `SELECTION_TRANSLATE` in background**

In `src/background/index.ts`, add:

```ts
if (message.type === "SELECTION_TRANSLATE") {
  try {
    const translatedText = await translateSelectionText(
      message.text,
      message.sourceLang,
      message.targetLang
    );
    return {
      type: "SELECTION_TRANSLATE_RESULT",
      translatedText,
    };
  } catch (err: any) {
    return {
      type: "TRANSLATE_ERROR",
      error: { code: err.code || "INTERNAL_ERROR", message: err.message || "Unknown error" },
    };
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
node tests\p4-selection-translation.test.cjs
```

Expected:

- PASS for background handler checks

- [ ] **Step 6: Commit**

```bash
git add src/background/index.ts src/background/translate.ts tests/p4-selection-translation.test.cjs
git commit -m "feat: add selection translation background flow"
```

---

## Task 5: Phase 1 Popup Rendering and Closing Behavior

**Files:**
- Modify: `src/content/selectionPopup.ts`
- Modify: `src/content/selectionTranslation.ts`
- Modify: `src/content/floating.css`
- Test: `tests/p4-selection-translation.test.cjs`

- [ ] **Step 1: Extend the failing test for popup rendering behavior hooks**

Append these checks:

```js
const popupSource = readFileSync(resolve(process.cwd(), "src/content/selectionPopup.ts"), "utf8");
assert.match(popupSource, /loading/);
assert.match(popupSource, /error/);
assert.match(popupSource, /success/);
assert.match(popupSource, /Escape/);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node tests\p4-selection-translation.test.cjs
```

Expected:

- FAIL because popup state transitions are incomplete

- [ ] **Step 3: Expand popup API**

Implement functions like:

```ts
export function showSelectionPopupLoading(x: number, y: number, text: string) {}
export function showSelectionPopupSuccess(x: number, y: number, translatedText: string) {}
export function showSelectionPopupError(x: number, y: number, message: string) {}
```

Each one updates:

- popup position
- status label
- body text
- hidden/visible class

- [ ] **Step 4: Bind popup state to translation flow**

In `src/content/selectionTranslation.ts`:

- Show loading before sending message
- Show success on `SELECTION_TRANSLATE_RESULT`
- Show error on translation failure
- Close on `Escape`
- Close on click outside

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
node tests\p4-selection-translation.test.cjs
```

Expected:

- PASS for popup state checks

- [ ] **Step 6: Commit**

```bash
git add src/content/selectionPopup.ts src/content/selectionTranslation.ts src/content/floating.css tests/p4-selection-translation.test.cjs
git commit -m "feat: render selection translation popup states"
```

---

## Task 6: Phase 2 PDF Support Discovery and Integration

**Files:**
- Create: `src/content/pdfDetection.ts`
- Create: `src/content/pdfTranslation.ts`
- Test: `tests/p5-pdf-support.test.cjs`

- [ ] **Step 1: Write the failing PDF support test**

Create `tests/p5-pdf-support.test.cjs`:

```js
const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

assert.ok(existsSync(resolve(process.cwd(), "src/content/pdfDetection.ts")));
assert.ok(existsSync(resolve(process.cwd(), "src/content/pdfTranslation.ts")));

const productSpec = readFileSync(resolve(process.cwd(), "docs/2026-05-02-mvp-product-spec.md"), "utf8");
const technicalSpec = readFileSync(resolve(process.cwd(), "docs/2026-05-02-mvp-technical-design.md"), "utf8");

assert.match(productSpec, /PDF/);
assert.match(technicalSpec, /PDF/);

console.log("pdf support test passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node tests\p5-pdf-support.test.cjs
```

Expected:

- FAIL because PDF modules do not exist yet

- [ ] **Step 3: Create minimal detection file**

Create `src/content/pdfDetection.ts`:

```ts
export function isPdfLikePage(): boolean {
  return location.pathname.toLowerCase().endsWith(".pdf") || document.contentType === "application/pdf";
}
```

- [ ] **Step 4: Create minimal PDF translation bridge**

Create `src/content/pdfTranslation.ts`:

```ts
import { isPdfLikePage } from "./pdfDetection";

export function setupPdfSelectionSupport() {
  if (!isPdfLikePage()) return;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
node tests\p5-pdf-support.test.cjs
```

Expected:

- PASS on file existence and doc checks

- [ ] **Step 6: Commit**

```bash
git add src/content/pdfDetection.ts src/content/pdfTranslation.ts tests/p5-pdf-support.test.cjs
git commit -m "feat: scaffold pdf support detection"
```

---

## Task 7: Phase 3 Live Status for Paragraph Translation

**Files:**
- Create: `src/content/translationStatus.ts`
- Modify: `src/content/inject.ts`
- Modify: `src/content/orchestrator.ts`
- Test: `tests/p6-live-status.test.cjs`

- [ ] **Step 1: Write the failing live-status test**

Create `tests/p6-live-status.test.cjs`:

```js
const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

assert.ok(existsSync(resolve(process.cwd(), "src/content/translationStatus.ts")));

const injectSource = readFileSync(resolve(process.cwd(), "src/content/inject.ts"), "utf8");
assert.match(injectSource, /pending|loading|failed/);

console.log("live status test passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node tests\p6-live-status.test.cjs
```

Expected:

- FAIL because live-status module is missing

- [ ] **Step 3: Create status helper**

Create `src/content/translationStatus.ts`:

```ts
export type TranslationBlockState = "pending" | "success" | "failed";
```

- [ ] **Step 4: Update injection flow**

Add placeholder insertion before batch completion, then replace with success or failed state in:

- `src/content/inject.ts`
- `src/content/orchestrator.ts`

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
node tests\p6-live-status.test.cjs
```

Expected:

- PASS with basic state hooks present

- [ ] **Step 6: Commit**

```bash
git add src/content/translationStatus.ts src/content/inject.ts src/content/orchestrator.ts tests/p6-live-status.test.cjs
git commit -m "feat: add live translation status placeholders"
```

---

## Task 8: Phase 4 Personal Vocabulary MVP

**Files:**
- Create: `src/shared/vocabulary.ts`
- Create: `src/options/vocabulary.html`
- Create: `src/options/vocabulary.ts`
- Create: `src/options/vocabulary.css`
- Test: `tests/p7-vocabulary.test.cjs`

- [ ] **Step 1: Write the failing vocabulary test**

Create `tests/p7-vocabulary.test.cjs`:

```js
const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

assert.ok(existsSync(resolve(process.cwd(), "src/shared/vocabulary.ts")));
assert.ok(existsSync(resolve(process.cwd(), "src/options/vocabulary.html")));

const productSpec = readFileSync(resolve(process.cwd(), "docs/2026-05-02-mvp-product-spec.md"), "utf8");
assert.match(productSpec, /词汇库/);

console.log("vocabulary test passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node tests\p7-vocabulary.test.cjs
```

Expected:

- FAIL because vocabulary files do not exist yet

- [ ] **Step 3: Create minimal storage helper**

Create `src/shared/vocabulary.ts`:

```ts
export type VocabularyItem = {
  term: string;
  translation: string;
  context: string;
  sourceUrl: string;
  createdAt: string;
};
```

- [ ] **Step 4: Create minimal options page scaffold**

Create:

- `src/options/vocabulary.html`
- `src/options/vocabulary.ts`
- `src/options/vocabulary.css`

with a simple list container and empty-state message.

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
node tests\p7-vocabulary.test.cjs
```

Expected:

- PASS with initial vocabulary scaffolding in place

- [ ] **Step 6: Commit**

```bash
git add src/shared/vocabulary.ts src/options/vocabulary.html src/options/vocabulary.ts src/options/vocabulary.css tests/p7-vocabulary.test.cjs
git commit -m "feat: scaffold personal vocabulary library"
```

---

## Verification Checklist per Phase

- [ ] Run the new phase-specific test
- [ ] Run:

```bash
node tests\manifest.test.cjs
node tests\translate.test.cjs
node .\node_modules\typescript\bin\tsc --noEmit
```

- [ ] Run full build:

```bash
npm run build
```

- [ ] Manually verify in Edge:
  - 普通网页翻译
  - 划词翻译
  - options 页
  - PDF 页面行为（从第二阶段开始）

---

## Self-Review

### Spec coverage

- 划词翻译：Task 1-5
- PDF 支持：Task 6
- 实时状态：Task 7
- 个人词汇库：Task 8

### Placeholder scan

- 没有使用 TBD/TODO
- 每个阶段都给出了明确文件路径
- 每个阶段都给出了最小测试与验证命令

### Type consistency

- selection translation 使用 `SELECTION_TRANSLATE` / `SELECTION_TRANSLATE_RESULT`
- connection test 使用现有 `TEST_CONNECTION` / `TEST_CONNECTION_RESULT`
- paragraph batch translation 保持 `TRANSLATE_BATCH` / `TRANSLATE_RESULT`

---

Plan complete and saved to `docs/superpowers/plans/2026-05-03-selection-pdf-status-vocab-roadmap.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
