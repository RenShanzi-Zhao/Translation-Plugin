# Page Translation Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore previously translated paragraph results when the user returns to the same page URL and target language.

**Architecture:** Add a lightweight content-side page cache backed by `chrome.storage.local`, keyed by normalized page URL and target language. Store successful paragraph translations by source text, then restore them before any new translation requests so existing paragraph injection and lazy translation logic continue to work unchanged.

**Tech Stack:** TypeScript, Chrome extension content script, `chrome.storage.local`, Node assert-based source contract tests

---

### Task 1: Lock cache integration contract

**Files:**
- Create: `tests/p16-page-translation-cache.test.cjs`
- Test: `tests/p16-page-translation-cache.test.cjs`

- [ ] **Step 1: Write the failing source-contract test**
- [ ] **Step 2: Run the test to verify it fails**

### Task 2: Add page translation cache module

**Files:**
- Create: `src/content/core/pageTranslationCache.ts`
- Test: `tests/p16-page-translation-cache.test.cjs`

- [ ] **Step 1: Add URL normalization and cache key helpers**
- [ ] **Step 2: Add load/save/prune helpers backed by `chrome.storage.local`**
- [ ] **Step 3: Add translation restore mapping by paragraph source text**

### Task 3: Integrate restore and persistence into content flow

**Files:**
- Modify: `src/content/index.ts`
- Modify: `src/content/core/orchestrator.ts`
- Test: `tests/p16-page-translation-cache.test.cjs`

- [ ] **Step 1: Restore cached translations during page setup and SPA refresh**
- [ ] **Step 2: Persist successful batch translations after translation requests complete**
- [ ] **Step 3: Keep existing lazy translation behavior for untranslated nodes**

### Task 4: Verify implementation

**Files:**
- Test: `tests/p16-page-translation-cache.test.cjs`
- Test: `node ./node_modules/typescript/bin/tsc --noEmit`

- [ ] **Step 1: Run the focused page-cache contract test**
- [ ] **Step 2: Run type checking**
- [ ] **Step 3: Summarize behavior and follow-up opportunities**
