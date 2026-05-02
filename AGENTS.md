# AGENTS.md

## Project Overview

Edge browser translation extension (MVP). Provides immersive bilingual reading by inserting translated paragraphs below original text on web pages.

## Key Design Decisions

- **Language:** TypeScript
- **Build:** Vite (multi-entry: popup HTML, background ES module, content IIFE)
- **Extension spec:** Manifest V3
- **UI:** Vanilla HTML/CSS/TS (no framework)
- **Storage:** Chrome Storage API
- **Translation:** OpenAI-compatible LLM API (configurable via `.env`)

## Developer Commands

```bash
npm run build          # Full build → dist/ (runs 3 Vite builds + copies manifest)
npm run build:popup    # Popup only
npm run build:background  # Background worker only
npm run build:content  # Content script only
```

Type check: `node ./node_modules/typescript/bin/tsc --noEmit` (npx has PowerShell execution policy issues on this machine)

## Build Architecture

Vite runs 3 separate builds via `scripts/build.ts`:
1. **Popup** — HTML entry at `src/popup/index.html`, output to `dist/popup/`, uses `base: "./"` for relative paths (critical for extension loading)
2. **Background** — ES module entry at `src/background/index.ts`, output to `dist/background/index.js`
3. **Content** — IIFE entry at `src/content/index.ts`, output to `dist/content/index.js`

After builds, `manifest.json` and `icons/` are copied to `dist/`.

## Directory Structure

```
src/
  background/
    index.ts          # Service worker entry, message handler
    translate.ts      # LLM API call, prompt construction, response parsing
  content/
    index.ts          # Main entry: batch orchestration, lazy loading, SPA monitoring
    extract.ts        # Paragraph extraction with filtering
    inject.ts         # Translation block insertion/removal
    selectors.ts      # Content area detection (semantic + heuristic scoring)
  popup/
    index.html
    main.ts
    style.css
  shared/
    constants.ts      # DOM attrs, batch limits, excluded tags/selectors
    messaging.ts      # Chrome messaging wrappers
    types.ts          # TranslateItem, TranslationResult, message types
```

## Environment Configuration

`.env` (not committed, copy from `.env.example`):
```
VITE_API_BASE_URL=https://api.openai.com/v1
VITE_API_KEY=sk-xxx
VITE_MODEL=gpt-4o-mini
```

API key is baked into the build via `import.meta.env`. For production, switch to an options page.

## Critical Implementation Notes

- Content Script identifies main content area via semantic selectors (`article`, `main`, `[role="main"]`, etc.) then falls back to heuristic scoring.
- Translatable nodes: `p`, `li`, `blockquote`, `h1-h6`. Skip `code`, `pre`, `nav`, `footer`, `aside`, and nodes with nav/sidebar/footer/menu class names.
- Paragraph filter: min 15 chars, visible, not high link density, not in excluded regions.
- Batching: max 8 paragraphs OR 2500 chars per batch, max 2 concurrent batch requests.
- Translation blocks use `data-imm-translated="1"` on originals and `data-imm-translation-for="<id>"` on translated nodes. Idempotent — re-running skips already-translated nodes.
- Single batch failure retries once; second failure marks that batch as failed without blocking others.
- Viewport lazy loading via IntersectionObserver (200px root margin).
- SPA dynamic content monitoring via MutationObserver (500ms debounce).

## Translation Flow

1. Popup sends `START_TRANSLATE` with `targetLang` to content script
2. Content script finds main container, extracts translatable nodes
3. Splits into batches, sends `TRANSLATE_BATCH` to background worker (max 2 concurrent)
4. Background calls OpenAI `/chat/completions` with numbered prompt format
5. Parses numbered response, returns `TRANSLATE_RESULT` to content script
6. Content script injects translation blocks after each original paragraph

## Reference Docs

- `docs/2026-05-02-mvp-product-spec.md` — product requirements and scope
- `docs/2026-05-02-mvp-technical-design.md` — architecture, selectors, batching, node marking
- `docs/2026-05-02-translation-api-spec.md` — API request/response format and error codes
- `docs/superpowers/plans/2026-05-02-mvp-implementation.md` — implementation plan
