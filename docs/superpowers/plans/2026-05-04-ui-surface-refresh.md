# UI Surface Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the floating settings panel and selection translation popup so they visually align with the vocabulary page's calm, warm, Claude-like product style.

**Architecture:** Keep the existing interaction flow and wiring intact, and change only presentation-layer CSS plus the minimum popup/panel markup needed to support a more editorial card layout. Reuse a shared warm-neutral token palette inside the content-script surfaces rather than touching background or translation logic.

**Tech Stack:** TypeScript, CSS, Chrome extension content script, Node assert-based source contract tests

---

### Task 1: Lock the target UI surface contract

**Files:**
- Create: `tests/p15-ui-surface-style.test.cjs`
- Test: `tests/p15-ui-surface-style.test.cjs`

- [ ] **Step 1: Write the failing source-contract test**
- [ ] **Step 2: Run the test to verify it fails**

### Task 2: Refresh floating settings surface

**Files:**
- Modify: `src/content/floating/floating.css`
- Modify: `src/content/floating/floatingSettings.ts`
- Test: `tests/p15-ui-surface-style.test.cjs`

- [ ] **Step 1: Add warm neutral tokens and revised panel/button styling**
- [ ] **Step 2: Update settings panel markup to support heading, grouped sections, and calmer actions**
- [ ] **Step 3: Run the focused UI contract test**

### Task 3: Refresh selection translation popup

**Files:**
- Modify: `src/content/selection/selectionPopup.css`
- Modify: `src/content/selection/selectionPopup.ts`
- Test: `tests/p15-ui-surface-style.test.cjs`

- [ ] **Step 1: Add popup card styling that matches the vocabulary surface**
- [ ] **Step 2: Update popup markup for label, source text, translation text, close action, and quiet CTA**
- [ ] **Step 3: Run the focused UI contract test**

### Task 4: Verify implementation

**Files:**
- Test: `tests/p15-ui-surface-style.test.cjs`
- Test: `node ./node_modules/typescript/bin/tsc --noEmit`

- [ ] **Step 1: Run the focused UI contract test**
- [ ] **Step 2: Run type checking**
- [ ] **Step 3: Summarize the visual changes and any follow-up polish opportunities**
