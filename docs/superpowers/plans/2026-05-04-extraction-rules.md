# Extraction Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lightweight site-aware extraction overrides and tighten fallback node extraction for webpage translation.

**Architecture:** Keep the current article-oriented translation flow intact, but insert a small hostname rule layer ahead of selector fallback and narrow the extraction fallback to block-like candidates only. Reuse existing visibility and exclusion heuristics instead of introducing a second filtering model.

**Tech Stack:** TypeScript, Chrome extension content script, Node assert-based source contract tests

---

### Task 1: Add failing contract tests

**Files:**
- Create: `tests/p14-extraction-rules.test.cjs`
- Test: `tests/p14-extraction-rules.test.cjs`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement minimal production changes**
- [ ] **Step 4: Run test to verify it passes**

### Task 2: Add lightweight site-aware extraction rules

**Files:**
- Create: `src/content/core/siteRules.ts`
- Modify: `src/content/core/selectors.ts`
- Test: `tests/p14-extraction-rules.test.cjs`

- [ ] **Step 1: Add hostname-aware selector overrides**
- [ ] **Step 2: Wire selectors into content container discovery**
- [ ] **Step 3: Re-run focused contract test**

### Task 3: Tighten fallback extraction

**Files:**
- Modify: `src/content/core/extract.ts`
- Test: `tests/p14-extraction-rules.test.cjs`

- [ ] **Step 1: Add block-candidate resolution for text-node extraction**
- [ ] **Step 2: Reuse existing node filtering when returning fallback candidates**
- [ ] **Step 3: Re-run focused contract test**

### Task 4: Verify end state

**Files:**
- Test: `tests/p14-extraction-rules.test.cjs`
- Test: `node ./node_modules/typescript/bin/tsc --noEmit`

- [ ] **Step 1: Run focused extraction contract test**
- [ ] **Step 2: Run full type check**
- [ ] **Step 3: Summarize behavior change and any remaining gaps**
