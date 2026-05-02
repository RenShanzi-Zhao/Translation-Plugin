# AGENTS.md

## Project Overview

Edge browser translation extension (MVP). Provides immersive bilingual reading by inserting translated paragraphs below original text on web pages.

## Key Design Decisions

- **Language:** TypeScript
- **Build:** Vite (multi-entry: background ES module, content IIFE)
- **Extension spec:** Manifest V3
- **UI:** Draggable floating button injected by content script (no popup)
- **Storage:** Chrome Storage API + localStorage for floating button settings
- **Translation:** OpenAI-compatible LLM API (configurable via `.env`)

## Developer Commands

```bash
npm run build             # Full build → dist/ (runs 2 Vite builds + copies manifest/icons/CSS)
npm run build:background  # Background worker only
npm run build:content     # Content script only
```

Type check: `node ./node_modules/typescript/bin/tsc --noEmit` (npx has PowerShell execution policy issues on this machine)

## Build Architecture

Vite runs 2 separate builds via `scripts/build.ts`:
1. **Background** — ES module entry at `src/background/index.ts`, output to `dist/background/index.js`
2. **Content** — IIFE entry at `src/content/index.ts`, output to `dist/content/index.js`

After builds, `manifest.json`, `icons/`, and `src/content/floating.css` are copied to `dist/`.

## Directory Structure

```
src/
  background/
    index.ts          # Service worker entry, message handler
    translate.ts      # LLM API call, prompt construction, response parsing
  content/
    index.ts          # Main entry: batch orchestration, floating button init, lazy loading, SPA monitoring
    extract.ts        # Paragraph extraction with filtering
    floating.ts       # Floating button: drag, hover settings, keyboard shortcut, progress bar
    floating.css      # Floating button and settings panel styles
    inject.ts         # Translation block insertion/removal
    selectors.ts      # Content area detection (semantic + heuristic scoring)
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

- **Floating button** replaces popup. Click → translate. Hover → show gear icon, click gear → settings panel. Drag → move freely, near-edge auto semi-hide (70% off-screen). Settings stored in `localStorage`.
- **Keyboard shortcut** configurable via settings panel, default `Ctrl+Shift+A`. Also registered in manifest `commands`.
- Position uses `document.documentElement.clientWidth` (not `window.innerWidth`) to avoid scrollbar offset issues.
- Slide animation uses JS `requestAnimationFrame` with easeOut (not CSS transition on `left`) to prevent hover race conditions during semi-hide slide-out.
- `isDragging` flag is reset to `false` in `handleMouseUp` after drag ends.
- Content Script identifies main content area via semantic selectors (`article`, `main`, `[role="main"]`, etc.) then falls back to heuristic scoring.
- Translatable nodes: `p`, `li`, `blockquote`, `h1-h6`. Skip `code`, `pre`, `nav`, `footer`, `aside`, and nodes with nav/sidebar/footer/menu class names.
- Paragraph filter: min 15 chars, visible, not high link density, not in excluded regions.
- Batching: max 15 paragraphs OR 2500 chars per batch, max 5 concurrent batch requests.
- Translation blocks use `data-imm-translated="1"` on originals and `data-imm-translation-for="<id>"` on translated nodes. Idempotent — re-running skips already-translated nodes.
- Single batch failure marks that batch as failed without blocking others.
- Viewport lazy loading via IntersectionObserver (200px root margin).
- SPA dynamic content monitoring via MutationObserver (500ms debounce).
- Progress bar at top of page during translation (blue → green when done).

## Translation Flow

1. User clicks floating button (or presses Ctrl+Shift+A)
2. Content script finds main container, extracts translatable nodes
3. Splits into batches, sends `TRANSLATE_BATCH` to background worker (max 5 concurrent)
4. Background calls OpenAI `/chat/completions` with numbered prompt format
5. Parses numbered response, returns `TRANSLATE_RESULT` to content script
6. Content script injects translation blocks after each original paragraph
7. Progress bar updates as batches complete

## Reference Docs

- `docs/2026-05-02-mvp-product-spec.md` — product requirements and scope
- `docs/2026-05-02-mvp-technical-design.md` — architecture, selectors, batching, node marking
- `docs/2026-05-02-translation-api-spec.md` — API request/response format and error codes
- `docs/superpowers/plans/2026-05-02-mvp-implementation.md` — implementation plan
- `docs/superpowers/plans/2026-05-02-floating-button-ux.md` — floating button UX plan
