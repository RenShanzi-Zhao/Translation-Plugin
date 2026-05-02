# Edge 翻译插件 MVP 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从零搭建一个 Edge 浏览器翻译扩展，实现沉浸式双语阅读体验。

**Architecture:** TypeScript + Vite 多入口构建 + Manifest V3。四个模块：Popup（触发翻译）、Content Script（DOM 提取与注入）、Background Service Worker（LLM API 调用）、Shared（类型与工具）。翻译通过 OpenAI 兼容 API 完成，支持中英互译。

**Tech Stack:** TypeScript, Vite, Manifest V3, Chrome Extension APIs, OpenAI-compatible LLM API

---

## 文件结构总览

```
D:\翻译插件\
├── .env.example
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
├── manifest.json
├── vite.config.ts
├── scripts/
│   └── build.ts
└── src/
    ├── background/
    │   ├── index.ts          # Service Worker 入口
    │   └── translate.ts      # LLM 翻译逻辑
    ├── content/
    │   ├── index.ts          # Content Script 入口
    │   ├── extract.ts        # 段落提取
    │   ├── inject.ts         # 译文注入与移除
    │   └── selectors.ts      # 正文区域识别
    ├── popup/
    │   ├── index.html
    │   ├── main.ts
    │   └── style.css
    └── shared/
        ├── constants.ts
        ├── messaging.ts
        └── types.ts
```

---

## Task 1: 项目脚手架

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `manifest.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `.env`
- Create: `vite.config.ts`
- Create: `scripts/build.ts`

- [ ] **Step 1: 初始化项目**

```bash
cd "D:\翻译插件"
git init
```

- [ ] **Step 2: 创建 package.json**

```json
{
  "name": "edge-immersive-translator",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsx scripts/build.ts",
    "build:popup": "vite build --config vite.config.ts",
    "build:background": "vite build --config vite.config.ts --mode background",
    "build:content": "vite build --config vite.config.ts --mode content"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.4.0",
    "tsx": "^4.7.0",
    "@types/chrome": "^0.0.268"
  }
}
```

- [ ] **Step 3: 安装依赖**

```bash
cd "D:\翻译插件"
npm install
```

- [ ] **Step 4: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": ["chrome"]
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 5: 创建 manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Immersive Translator",
  "version": "0.1.0",
  "description": "沉浸式双语翻译扩展",
  "permissions": ["storage", "activeTab", "scripting"],
  "action": {
    "default_popup": "popup/index.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
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

- [ ] **Step 6: 创建 .env.example**

```
VITE_API_BASE_URL=https://api.openai.com/v1
VITE_API_KEY=sk-your-key-here
VITE_MODEL=gpt-4o-mini
```

- [ ] **Step 7: 创建 .env（复制 .env.example 并填入实际值）**

```bash
cp .env.example .env
```

- [ ] **Step 8: 创建 .gitignore**

```
node_modules
dist
.env
*.local
```

- [ ] **Step 9: 创建 vite.config.ts**

```ts
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const entry = mode === "background"
    ? { input: resolve(__dirname, "src/background/index.ts"), output: { dir: resolve(__dirname, "dist/background"), format: "es", entryFileNames: "index.js" } }
    : mode === "content"
    ? { input: resolve(__dirname, "src/content/index.ts"), output: { dir: resolve(__dirname, "dist/content"), format: "iife", entryFileNames: "index.js" } }
    : null;

  if (entry) {
    return {
      build: {
        rollupOptions: entry,
        emptyOutDir: false,
        sourcemap: false,
        minify: true,
      },
      define: {
        "process.env": {},
      },
    };
  }

  return {
    build: {
      rollupOptions: {
        input: resolve(__dirname, "src/popup/index.html"),
        output: { dir: resolve(__dirname, "dist/popup"), entryFileNames: "[name].js" },
      },
      emptyOutDir: false,
      sourcemap: false,
      minify: true,
    },
    define: {
      "process.env": {},
    },
  };
});
```

- [ ] **Step 10: 创建 scripts/build.ts**

```ts
import { execSync } from "child_process";
import { cpSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";

const root = resolve(import.meta.dirname, "..");

function run(cmd: string) {
  console.log(`\n>>> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit" });
}

// Clean dist
if (existsSync(resolve(root, "dist"))) {
  execSync(`rm -rf ${resolve(root, "dist")}`, { cwd: root });
}

mkdirSync(resolve(root, "dist"), { recursive: true });

// Build all three entry points
run("npx vite build --config vite.config.ts");
run("npx vite build --config vite.config.ts --mode background");
run("npx vite build --config vite.config.ts --mode content");

// Copy manifest and icons
cpSync(resolve(root, "manifest.json"), resolve(root, "dist/manifest.json"));

if (existsSync(resolve(root, "icons"))) {
  cpSync(resolve(root, "icons"), resolve(root, "dist/icons"), { recursive: true });
}

console.log("\n✅ Build complete → dist/");
```

- [ ] **Step 11: 验证构建**

```bash
cd "D:\翻译插件"
npm run build
```

Expected: `dist/` 目录生成，包含 `manifest.json`、`popup/`、`background/`、`content/`。

- [ ] **Step 12: 提交**

```bash
git add -A
git commit -m "chore: project scaffolding with Vite + Manifest V3"
```

---

## Task 2: 共享类型和常量

**Files:**
- Create: `src/shared/types.ts`
- Create: `src/shared/constants.ts`
- Create: `src/shared/messaging.ts`

- [ ] **Step 1: 创建 src/shared/types.ts**

```ts
export type TranslateItem = {
  id: string;
  text: string;
};

export type TranslationResult = {
  id: string;
  translatedText: string;
};

export type BatchTranslateRequest = {
  items: TranslateItem[];
  sourceLang: string;
  targetLang: string;
};

export type BatchTranslateResponse = {
  translations: TranslationResult[];
};

export type TranslateError = {
  code: string;
  message: string;
};

export type PopupMessage =
  | { type: "START_TRANSLATE"; targetLang: string }
  | { type: "REMOVE_TRANSLATION" };

export type ContentToBgMessage =
  | { type: "TRANSLATE_BATCH"; items: TranslateItem[]; sourceLang: string; targetLang: string }
  | { type: "PING" };

export type BgToContentMessage =
  | { type: "TRANSLATE_RESULT"; translations: TranslationResult[] }
  | { type: "TRANSLATE_ERROR"; error: TranslateError };
```

- [ ] **Step 2: 创建 src/shared/constants.ts**

```ts
export const TRANSLATED_ATTR = "data-imm-translated";
export const TRANSLATION_FOR_ATTR = "data-imm-translation-for";
export const TRANSLATION_BLOCK_CLASS = "imm-translation-block";
export const FAILED_CLASS = "imm-translation-failed";

export const MIN_PARAGRAPH_LENGTH = 15;
export const MAX_BATCH_ITEMS = 8;
export const MAX_BATCH_CHARS = 2500;
export const MAX_CONCURRENT_BATCHES = 2;
export const REQUEST_TIMEOUT_MS = 20_000;
export const MAX_RETRIES = 1;

export const EXCLUDED_TAGS = new Set([
  "code", "pre", "textarea", "input", "button", "label",
  "select", "option", "script", "style", "noscript",
]);

export const EXCLUDED_CONTAINER_TAGS = new Set([
  "nav", "footer", "aside",
]);

export const EXCLUDED_SELECTORS = [
  '[role="navigation"]',
  ".sidebar",
  ".comments",
  ".comment",
  ".menu",
  ".toolbar",
  ".breadcrumb",
  ".recommend",
  ".related",
];

export const CONTENT_SELECTORS = [
  "article",
  "main",
  '[role="main"]',
  ".article",
  ".post",
  ".content",
  ".entry-content",
  ".markdown-body",
  ".doc-content",
];
```

- [ ] **Step 3: 创建 src/shared/messaging.ts**

```ts
import type { PopupMessage, ContentToBgMessage, BgToContentMessage } from "./types";

export function sendToContent(tabId: number, message: PopupMessage): Promise<void> {
  return chrome.tabs.sendMessage(tabId, message);
}

export function sendToBackground(message: ContentToBgMessage): Promise<any> {
  return chrome.runtime.sendMessage(message);
}

export function onMessage<T extends PopupMessage | ContentToBgMessage | BgToContentMessage>(
  handler: (message: T, sender: chrome.runtime.MessageSender) => Promise<any> | void
) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const result = handler(message as T, sender);
    if (result instanceof Promise) {
      result.then(sendResponse).catch((err) => sendResponse({ error: err.message }));
      return true;
    }
  });
}
```

- [ ] **Step 4: 类型检查**

```bash
cd "D:\翻译插件"
npx tsc --noEmit
```

Expected: 无错误。

- [ ] **Step 5: 提交**

```bash
git add src/shared/
git commit -m "feat: add shared types, constants, and messaging helpers"
```

---

## Task 3: Background Service Worker（LLM 翻译）

**Files:**
- Create: `src/background/translate.ts`
- Create: `src/background/index.ts`

- [ ] **Step 1: 创建 src/background/translate.ts**

```ts
import type { TranslateItem, TranslationResult, TranslateError } from "../shared/types";
import { REQUEST_TIMEOUT_MS, MAX_RETRIES } from "../shared/constants";

interface EnvConfig {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
}

function getConfig(): EnvConfig {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const apiKey = import.meta.env.VITE_API_KEY;
  const model = import.meta.env.VITE_MODEL;

  if (!apiBaseUrl || !apiKey) {
    throw new Error("Missing VITE_API_BASE_URL or VITE_API_KEY in environment");
  }

  return { apiBaseUrl, apiKey, model: model || "gpt-4o-mini" };
}

function buildPrompt(items: TranslateItem[], sourceLang: string, targetLang: string): string {
  const numbered = items.map((item, i) => `${i + 1}. ${item.text}`).join("\n");
  return `Translate the following paragraphs from ${sourceLang} to ${targetLang}.
Output ONLY the translations, one per line, numbered to match the input.
Do not add explanations, notes, or extra formatting.

${numbered}`;
}

function parseResponse(raw: string, itemCount: number): string[] {
  const lines = raw.trim().split("\n");
  const results: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\d+\.\s*(.*)/);
    if (match) {
      results.push(match[1].trim());
    } else if (line.trim()) {
      results.push(line.trim());
    }
  }

  while (results.length < itemCount) {
    results.push("");
  }

  return results.slice(0, itemCount);
}

export async function translateBatch(
  items: TranslateItem[],
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult[]> {
  const config = getConfig();
  const prompt = buildPrompt(items, sourceLang, targetLang);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(`${config.apiBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: "You are a professional translator. Output only translations, no explanations." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        const error: TranslateError = {
          code: response.status >= 500 ? "TRANSLATE_UPSTREAM_ERROR" : "INVALID_REQUEST",
          message: `API returned ${response.status}: ${errorText}`,
        };

        if (response.status >= 500 && attempt < MAX_RETRIES) {
          lastError = new Error(error.message);
          continue;
        }

        throw error;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      const translatedTexts = parseResponse(content, items.length);

      return items.map((item, i) => ({
        id: item.id,
        translatedText: translatedTexts[i],
      }));
    } catch (err: any) {
      if (err.code === "ABORT_ERR") {
        lastError = new Error("Request timeout");
        if (attempt < MAX_RETRIES) continue;
        throw { code: "TRANSLATE_TIMEOUT", message: "Request timed out after retries" } as TranslateError;
      }

      if (err.code && err.message) throw err;

      lastError = err;
      if (attempt < MAX_RETRIES) continue;
      throw { code: "INTERNAL_ERROR", message: err.message } as TranslateError;
    }
  }

  throw { code: "INTERNAL_ERROR", message: lastError?.message || "Unknown error" } as TranslateError;
}
```

- [ ] **Step 2: 创建 src/background/index.ts**

```ts
import { onMessage } from "../shared/messaging";
import { translateBatch } from "./translate";
import type { ContentToBgMessage } from "../shared/types";

onMessage(async (message: ContentToBgMessage) => {
  if (message.type === "TRANSLATE_BATCH") {
    try {
      const translations = await translateBatch(
        message.items,
        message.sourceLang,
        message.targetLang
      );
      return { type: "TRANSLATE_RESULT", translations };
    } catch (err: any) {
      return {
        type: "TRANSLATE_ERROR",
        error: { code: err.code || "INTERNAL_ERROR", message: err.message || "Unknown error" },
      };
    }
  }

  if (message.type === "PING") {
    return { type: "PONG" };
  }
});
```

- [ ] **Step 3: 类型检查**

```bash
cd "D:\翻译插件"
npx tsc --noEmit
```

Expected: 无错误。

- [ ] **Step 4: 提交**

```bash
git add src/background/
git commit -m "feat: background service worker with LLM translation"
```

---

## Task 4: Content Script — 区域识别与段落提取

**Files:**
- Create: `src/content/selectors.ts`
- Create: `src/content/extract.ts`

- [ ] **Step 1: 创建 src/content/selectors.ts**

```ts
import { CONTENT_SELECTORS, EXCLUDED_CONTAINER_TAGS, EXCLUDED_SELECTORS } from "../shared/constants";

function scoreCandidate(el: Element): number {
  let score = 0;

  const textLength = el.textContent?.trim().length || 0;
  score += Math.min(textLength / 100, 10);

  const paragraphs = el.querySelectorAll("p, li, blockquote, h1, h2, h3, h4, h5, h6");
  score += paragraphs.length * 2;

  const links = el.querySelectorAll("a");
  const linkDensity = links.length / Math.max(paragraphs.length, 1);
  if (linkDensity > 0.5) score -= 5;

  const buttons = el.querySelectorAll("button, input, select");
  score -= buttons.length;

  const className = (el.className || "").toLowerCase();
  const id = (el.id || "").toLowerCase();
  const badWords = ["nav", "sidebar", "footer", "menu", "comments", "share", "recommend"];
  for (const word of badWords) {
    if (className.includes(word) || id.includes(word)) score -= 3;
  }

  return score;
}

export function findMainContentContainer(): Element | null {
  for (const selector of CONTENT_SELECTORS) {
    const candidates = document.querySelectorAll(selector);
    if (candidates.length === 1) return candidates[0];
    if (candidates.length > 1) {
      let best = candidates[0];
      let bestScore = -Infinity;
      for (const c of Array.from(candidates)) {
        const s = scoreCandidate(c);
        if (s > bestScore) {
          bestScore = s;
          best = c;
        }
      }
      return best;
    }
  }

  const allCandidates = document.querySelectorAll("main, article, section, div");
  let best: Element | null = null;
  let bestScore = -Infinity;

  for (const el of Array.from(allCandidates)) {
    const s = scoreCandidate(el);
    if (s > bestScore) {
      bestScore = s;
      best = el;
    }
  }

  return best;
}

export function isInsideExcludedRegion(el: Element): boolean {
  let current: Element | null = el;
  while (current) {
    const tag = current.tagName.toLowerCase();
    if (EXCLUDED_CONTAINER_TAGS.has(tag)) return true;
    if (current.getAttribute("role") === "navigation") return true;

    for (const selector of EXCLUDED_SELECTORS) {
      if (current.matches(selector)) return true;
    }

    current = current.parentElement;
  }
  return false;
}
```

- [ ] **Step 2: 创建 src/content/extract.ts**

```ts
import { EXCLUDED_TAGS, MIN_PARAGRAPH_LENGTH, TRANSLATED_ATTR } from "../shared/constants";
import { isInsideExcludedRegion } from "./selectors";
import type { TranslateItem } from "../shared/types";

let idCounter = 0;

function generateId(): string {
  return `p_${++idCounter}`;
}

function isVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    el.offsetHeight > 0
  );
}

function isHighLinkDensity(el: Element): boolean {
  const links = el.querySelectorAll("a");
  const totalText = el.textContent?.trim().length || 0;
  const linkText = Array.from(links).reduce((sum, a) => sum + (a.textContent?.trim().length || 0), 0);
  return totalText > 0 && linkText / totalText > 0.5;
}

function shouldTranslateNode(el: Element): boolean {
  const tag = el.tagName.toLowerCase();

  if (EXCLUDED_TAGS.has(tag)) return false;
  if (el.hasAttribute(TRANSLATED_ATTR)) return false;
  if (isInsideExcludedRegion(el)) return false;

  const text = el.textContent?.trim() || "";
  if (text.length < MIN_PARAGRAPH_LENGTH) return false;
  if (/^[\s\W]+$/.test(text)) return false;
  if (!isVisible(el as HTMLElement)) return false;
  if (isHighLinkDensity(el)) return false;

  return true;
}

const TRANSLATABLE_TAGS = new Set(["p", "li", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6"]);

export function extractTranslatableNodes(container: Element): HTMLElement[] {
  const nodes: HTMLElement[] = [];
  const all = container.querySelectorAll(Array.from(TRANSLATABLE_TAGS).join(", "));

  for (const el of Array.from(all)) {
    if (TRANSLATABLE_TAGS.has(el.tagName.toLowerCase()) && shouldTranslateNode(el)) {
      nodes.push(el as HTMLElement);
    }
  }

  return nodes;
}

export function buildTranslateItems(nodes: HTMLElement[]): {
  items: TranslateItem[];
  nodeMap: Map<string, HTMLElement>;
} {
  const items: TranslateItem[] = [];
  const nodeMap = new Map<string, HTMLElement>();

  for (const node of nodes) {
    const id = generateId();
    items.push({ id, text: node.textContent?.trim() || "" });
    nodeMap.set(id, node);
  }

  return { items, nodeMap };
}
```

- [ ] **Step 3: 类型检查**

```bash
cd "D:\翻译插件"
npx tsc --noEmit
```

Expected: 无错误。

- [ ] **Step 4: 提交**

```bash
git add src/content/selectors.ts src/content/extract.ts
git commit -m "feat: content area detection and paragraph extraction"
```

---

## Task 5: Content Script — 译文注入与移除

**Files:**
- Create: `src/content/inject.ts`

- [ ] **Step 1: 创建 src/content/inject.ts**

```ts
import {
  TRANSLATED_ATTR,
  TRANSLATION_FOR_ATTR,
  TRANSLATION_BLOCK_CLASS,
  FAILED_CLASS,
} from "../shared/constants";
import type { TranslationResult } from "../shared/types";

export function injectTranslations(results: TranslationResult[], nodeMap: Map<string, HTMLElement>) {
  for (const result of results) {
    const originalNode = nodeMap.get(result.id);
    if (!originalNode) continue;

    if (originalNode.hasAttribute(TRANSLATED_ATTR)) continue;

    const translationBlock = document.createElement("div");
    translationBlock.className = TRANSLATION_BLOCK_CLASS;
    translationBlock.setAttribute(TRANSLATION_FOR_ATTR, result.id);

    if (result.translatedText) {
      translationBlock.textContent = result.translatedText;
    } else {
      translationBlock.textContent = "[翻译失败]";
      translationBlock.classList.add(FAILED_CLASS);
    }

    originalNode.parentNode?.insertBefore(translationBlock, originalNode.nextSibling);
    originalNode.setAttribute(TRANSLATED_ATTR, "1");
  }
}

export function markBatchFailed(items: { id: string }[], nodeMap: Map<string, HTMLElement>) {
  for (const item of items) {
    const originalNode = nodeMap.get(item.id);
    if (!originalNode || originalNode.hasAttribute(TRANSLATED_ATTR)) continue;

    const failedBlock = document.createElement("div");
    failedBlock.className = `${TRANSLATION_BLOCK_CLASS} ${FAILED_CLASS}`;
    failedBlock.setAttribute(TRANSLATION_FOR_ATTR, item.id);
    failedBlock.textContent = "[翻译失败]";

    originalNode.parentNode?.insertBefore(failedBlock, originalNode.nextSibling);
    originalNode.setAttribute(TRANSLATED_ATTR, "1");
  }
}

export function removeAllTranslations() {
  const blocks = document.querySelectorAll(`.${TRANSLATION_BLOCK_CLASS}`);
  blocks.forEach((block) => block.remove());

  const translated = document.querySelectorAll(`[${TRANSLATED_ATTR}]`);
  translated.forEach((el) => el.removeAttribute(TRANSLATED_ATTR));
}

export function hasExistingTranslations(): boolean {
  return document.querySelectorAll(`[${TRANSLATED_ATTR}]`).length > 0;
}
```

- [ ] **Step 2: 类型检查**

```bash
cd "D:\翻译插件"
npx tsc --noEmit
```

Expected: 无错误。

- [ ] **Step 3: 提交**

```bash
git add src/content/inject.ts
git commit -m "feat: translation injection and removal"
```

---

## Task 6: Content Script — 主入口与批量翻译编排

**Files:**
- Create: `src/content/index.ts`

- [ ] **Step 1: 创建 src/content/index.ts**

```ts
import { onMessage } from "../shared/messaging";
import { findMainContentContainer } from "./selectors";
import { extractTranslatableNodes, buildTranslateItems } from "./extract";
import { injectTranslations, removeAllTranslations, hasExistingTranslations, markBatchFailed } from "./inject";
import { sendToBackground } from "../shared/messaging";
import { MAX_BATCH_ITEMS, MAX_BATCH_CHARS, MAX_CONCURRENT_BATCHES } from "../shared/constants";
import type { PopupMessage, TranslateItem, TranslationResult } from "../shared/types";

let isTranslating = false;

function splitIntoBatches(items: TranslateItem[]): TranslateItem[][] {
  const batches: TranslateItem[][] = [];
  let currentBatch: TranslateItem[] = [];
  let currentChars = 0;

  for (const item of items) {
    if (
      currentBatch.length >= MAX_BATCH_ITEMS ||
      (currentBatch.length > 0 && currentChars + item.text.length > MAX_BATCH_CHARS)
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentChars = 0;
    }
    currentBatch.push(item);
    currentChars += item.text.length;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

async function translateOneBatch(
  batch: TranslateItem[],
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult[]> {
  const response = await sendToBackground({
    type: "TRANSLATE_BATCH",
    items: batch,
    sourceLang,
    targetLang,
  });

  if (response?.error) {
    throw new Error(response.error.message || "Translation failed");
  }

  return response.translations;
}

async function translateAllBatches(
  batches: TranslateItem[][],
  nodeMap: Map<string, HTMLElement>,
  sourceLang: string,
  targetLang: string,
  onProgress: (done: number, total: number) => void
) {
  let index = 0;
  let completed = 0;

  async function runNext() {
    while (index < batches.length) {
      const batchIndex = index++;
      const batch = batches[batchIndex];

      try {
        const results = await translateOneBatch(batch, sourceLang, targetLang);
        injectTranslations(results, nodeMap);
      } catch {
        markBatchFailed(batch, nodeMap);
      }

      completed++;
      onProgress(completed, batches.length);
    }
  }

  const workers: Promise<void>[] = [];
  for (let i = 0; i < MAX_CONCURRENT_BATCHES; i++) {
    workers.push(runNext());
  }

  await Promise.all(workers);
}

async function startTranslation(targetLang: string) {
  if (isTranslating) return;

  const container = findMainContentContainer();
  if (!container) {
    chrome.runtime.sendMessage({
      type: "TRANSLATE_STATUS",
      status: "error",
      message: "未检测到可翻译正文",
    });
    return;
  }

  const nodes = extractTranslatableNodes(container);
  if (nodes.length === 0) {
    chrome.runtime.sendMessage({
      type: "TRANSLATE_STATUS",
      status: "error",
      message: "未找到可翻译段落",
    });
    return;
  }

  isTranslating = true;

  const { items, nodeMap } = buildTranslateItems(nodes);
  const batches = splitIntoBatches(items);

  const sourceLang = "auto";

  chrome.runtime.sendMessage({
    type: "TRANSLATE_STATUS",
    status: "translating",
    total: batches.length,
    done: 0,
  });

  try {
    await translateAllBatches(batches, nodeMap, sourceLang, targetLang, (done, total) => {
      chrome.runtime.sendMessage({
        type: "TRANSLATE_STATUS",
        status: "translating",
        total,
        done,
      });
    });

    chrome.runtime.sendMessage({
      type: "TRANSLATE_STATUS",
      status: "done",
    });
  } catch {
    chrome.runtime.sendMessage({
      type: "TRANSLATE_STATUS",
      status: "error",
      message: "翻译过程中发生错误",
    });
  } finally {
    isTranslating = false;
  }
}

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

- [ ] **Step 2: 类型检查**

```bash
cd "D:\翻译插件"
npx tsc --noEmit
```

Expected: 无错误。

- [ ] **Step 3: 提交**

```bash
git add src/content/index.ts
git commit -m "feat: content script main entry with batch orchestration"
```

---

## Task 7: Popup UI

**Files:**
- Create: `src/popup/index.html`
- Create: `src/popup/main.ts`
- Create: `src/popup/style.css`

- [ ] **Step 1: 创建 src/popup/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Immersive Translator</title>
  <link rel="stylesheet" href="./style.css" />
</head>
<body>
  <div class="popup">
    <h1 class="title">沉浸式翻译</h1>

    <div class="controls">
      <label class="label" for="targetLang">目标语言</label>
      <select id="targetLang" class="select">
        <option value="zh-CN">英文 → 中文</option>
        <option value="en">中文 → 英文</option>
      </select>
    </div>

    <div class="actions">
      <button id="translateBtn" class="btn btn-primary">翻译当前页面</button>
      <button id="removeBtn" class="btn btn-secondary">移除本页译文</button>
    </div>

    <div id="status" class="status"></div>
  </div>

  <script type="module" src="./main.ts"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 src/popup/style.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #333;
  background: #fff;
}

.popup {
  width: 280px;
  padding: 16px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  text-align: center;
}

.controls {
  margin-bottom: 12px;
}

.label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  background: #fff;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary {
  background: #1a73e8;
  color: #fff;
}

.btn-primary:hover {
  background: #1557b0;
}

.btn-primary:disabled {
  background: #93b8e8;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f3f4;
  color: #333;
}

.btn-secondary:hover {
  background: #e2e4e6;
}

.status {
  font-size: 12px;
  color: #666;
  min-height: 18px;
  text-align: center;
}

.status.error {
  color: #d93025;
}

.status.done {
  color: #188038;
}
```

- [ ] **Step 3: 创建 src/popup/main.ts**

```ts
const translateBtn = document.getElementById("translateBtn") as HTMLButtonElement;
const removeBtn = document.getElementById("removeBtn") as HTMLButtonElement;
const targetLangSelect = document.getElementById("targetLang") as HTMLSelectElement;
const statusEl = document.getElementById("status") as HTMLDivElement;

function setStatus(text: string, type?: "error" | "done" | "translating") {
  statusEl.textContent = text;
  statusEl.className = "status" + (type ? ` ${type}` : "");
}

async function getCurrentTabId(): Promise<number | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id ?? null;
}

translateBtn.addEventListener("click", async () => {
  const tabId = await getCurrentTabId();
  if (!tabId) return;

  const targetLang = targetLangSelect.value;
  translateBtn.disabled = true;
  setStatus("翻译中...", "translating");

  chrome.tabs.sendMessage(tabId, {
    type: "START_TRANSLATE",
    targetLang,
  });
});

removeBtn.addEventListener("click", async () => {
  const tabId = await getCurrentTabId();
  if (!tabId) return;

  chrome.tabs.sendMessage(tabId, { type: "REMOVE_TRANSLATION" });
  setStatus("已移除译文", "done");
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "TRANSLATE_STATUS") {
    switch (message.status) {
      case "translating":
        setStatus(`翻译中 (${message.done}/${message.total})...`, "translating");
        break;
      case "done":
        setStatus("翻译完成", "done");
        translateBtn.disabled = false;
        break;
      case "error":
        setStatus(message.message || "翻译失败", "error");
        translateBtn.disabled = false;
        break;
      case "removed":
        setStatus("已移除译文", "done");
        break;
    }
  }
});
```

- [ ] **Step 4: 类型检查**

```bash
cd "D:\翻译插件"
npx tsc --noEmit
```

Expected: 无错误。

- [ ] **Step 5: 提交**

```bash
git add src/popup/
git commit -m "feat: popup UI with translate/remove controls"
```

---

## Task 8: 视口懒加载翻译

**Files:**
- Modify: `src/content/index.ts`

- [ ] **Step 1: 在 src/content/index.ts 中添加懒加载逻辑**

在文件末尾添加：

```ts
let observer: IntersectionObserver | null = null;
let pendingNodes: HTMLElement[] = [];
let nodeMapRef: Map<string, HTMLElement> = new Map();

function setupLazyTranslation(targetLang: string) {
  const container = findMainContentContainer();
  if (!container) return;

  const nodes = extractTranslatableNodes(container);
  if (nodes.length === 0) return;

  const { items, nodeMap } = buildTranslateItems(nodes);
  nodeMapRef = nodeMap;

  const itemMap = new Map<string, TranslateItem>();
  for (const item of items) {
    itemMap.set(item.id, item);
  }

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const node = entry.target as HTMLElement;
          const id = Array.from(nodeMap.entries()).find(([_, n]) => n === node)?.[0];
          if (id) {
            const item = itemMap.get(id);
            if (item) pendingNodes.push(node);
          }
          observer?.unobserve(node);
        }
      }

      processLazyBatch(targetLang);
    },
    { rootMargin: "200px" }
  );

  for (const node of nodes) {
    if (!node.hasAttribute(TRANSLATED_ATTR)) {
      observer.observe(node);
    }
  }
}

async function processLazyBatch(targetLang: string) {
  if (isTranslating || pendingNodes.length === 0) return;

  const batch: TranslateItem[] = [];
  const batchNodes: HTMLElement[] = [];

  while (pendingNodes.length > 0 && batch.length < MAX_BATCH_ITEMS) {
    const node = pendingNodes.shift()!;
    const id = Array.from(nodeMapRef.entries()).find(([_, n]) => n === node)?.[0];
    if (id && !node.hasAttribute(TRANSLATED_ATTR)) {
      batch.push({ id, text: node.textContent?.trim() || "" });
      batchNodes.push(node);
    }
  }

  if (batch.length === 0) return;

  isTranslating = true;
  try {
    const results = await translateOneBatch(batch, "auto", targetLang);
    injectTranslations(results, nodeMapRef);
  } catch {
    markBatchFailed(batch, nodeMapRef);
  } finally {
    isTranslating = false;
    if (pendingNodes.length > 0) {
      processLazyBatch(targetLang);
    }
  }
}
```

- [ ] **Step 2: 类型检查**

```bash
cd "D:\翻译插件"
npx tsc --noEmit
```

Expected: 无错误。

- [ ] **Step 3: 提交**

```bash
git add src/content/index.ts
git commit -m "feat: viewport lazy loading translation with IntersectionObserver"
```

---

## Task 9: SPA 动态内容监听

**Files:**
- Modify: `src/content/index.ts`

- [ ] **Step 1: 在 src/content/index.ts 末尾添加 MutationObserver**

```ts
let spaObserver: MutationObserver | null = null;
let currentTargetLang = "zh-CN";

function setupSPAMonitoring(targetLang: string) {
  currentTargetLang = targetLang;

  if (spaObserver) spaObserver.disconnect();

  spaObserver = new MutationObserver((mutations) => {
    let hasNewContent = false;

    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          if (
            el.tagName.toLowerCase() === "p" ||
            el.querySelector("p, li, blockquote, h1, h2, h3, h4, h5, h6")
          ) {
            hasNewContent = true;
            break;
          }
        }
      }
      if (hasNewContent) break;
    }

    if (hasNewContent && !isTranslating) {
      setTimeout(() => setupLazyTranslation(currentTargetLang), 500);
    }
  });

  const container = findMainContentContainer() || document.body;
  spaObserver.observe(container, { childList: true, subtree: true });
}
```

- [ ] **Step 2: 修改 startTranslation 函数，在末尾调用 SPA 监听**

在 `startTranslation` 函数的 `finally` 块之后添加调用：

```ts
setupSPAMonitoring(targetLang);
```

- [ ] **Step 3: 类型检查**

```bash
cd "D:\翻译插件"
npx tsc --noEmit
```

Expected: 无错误。

- [ ] **Step 4: 提交**

```bash
git add src/content/index.ts
git commit -m "feat: SPA dynamic content monitoring with MutationObserver"
```

---

## Task 10: 最终集成与验证

- [ ] **Step 1: 完整类型检查**

```bash
cd "D:\翻译插件"
npx tsc --noEmit
```

Expected: 无错误。

- [ ] **Step 2: 完整构建**

```bash
cd "D:\翻译插件"
npm run build
```

Expected: `dist/` 目录包含所有构建产物。

- [ ] **Step 3: 验证 dist 结构**

```bash
ls -R dist/
```

Expected:
```
dist/
├── manifest.json
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── popup/
│   ├── index.html
│   ├── main.js
│   └── style.css
├── background/
│   └── index.js
└── content/
    └── index.js
```

- [ ] **Step 4: 在 Edge 中加载扩展进行手动测试**

1. 打开 Edge，访问 `edge://extensions/`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展"
4. 选择 `dist/` 目录
5. 打开一个英文文章页面
6. 点击扩展图标，选择"英文 → 中文"
7. 点击"翻译当前页面"
8. 验证译文插入在原文下方
9. 点击"移除本页译文"验证清除功能

- [ ] **Step 5: 最终提交**

```bash
git add -A
git commit -m "feat: MVP complete — immersive bilingual translation extension"
```

---

## 补充说明

### LLM 翻译 Prompt 设计

当前 prompt 简单直接，后续可优化：
- 添加术语表支持
- 添加上下文感知（传入前后段落）
- 添加格式保持指令
- 根据目标语言调整语气

### .env 配置说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_API_BASE_URL` | OpenAI 兼容 API 地址 | `https://api.openai.com/v1` |
| `VITE_API_KEY` | API 密钥 | `sk-xxx` |
| `VITE_MODEL` | 模型名称 | `gpt-4o-mini` |

### 后续上线需改事项

1. `.env` 配置改为 `options_page` 动态配置
2. 添加扩展图标资源（当前 manifest 引用了 icons/ 但未创建）
3. 添加错误日志上报
4. 添加翻译缓存以减少 API 调用
