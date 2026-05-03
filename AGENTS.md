# AGENTS.md

## Project Overview

Edge browser translation extension. Provides immersive bilingual reading by inserting translated paragraphs below original text on web pages. The current project supports:

- full-page immersive translation on normal web pages
- selection translation
- live translation status
- personal vocabulary storage and management

Native Edge PDF translation is currently deferred.

## Key Design Decisions

- **Language:** TypeScript
- **Build:** Vite (multi-entry: background ES module, content IIFE, options page)
- **Extension spec:** Manifest V3
- **UI:** Draggable floating button injected by content script. No popup UI. Uses options pages for API configuration and vocabulary management.
- **Storage:** `localStorage` for floating button UI settings, `chrome.storage.local` for API config and vocabulary
- **Translation:** OpenAI-compatible LLM API (configurable via options page, fallback to `.env`)

## Developer Commands

```bash
npm run build             # Full build -> dist/ (runs 3 Vite builds + copies manifest/icons/CSS)
npm run build:background  # Background worker only
npm run build:content     # Content script only
npm run build:options     # Options page only
```

Type check: `node ./node_modules/typescript/bin/tsc --noEmit` (`npx` has PowerShell execution policy issues on this machine)

## Build Architecture

Vite runs 3 separate builds via `scripts/build.mjs`:

1. **Background** - ES module entry at `src/background/index.ts`, output to `dist/background/index.js`
2. **Content** - IIFE entry at `src/content/index.ts`, output to `dist/content/index.js`
3. **Options** - entry at `src/options/main.ts` and `src/options/vocabulary.ts`, output to `dist/options/`

After builds, `manifest.json`, `icons/`, `src/content/floating.css`, and `src/content/selectionPopup.css` are copied to `dist/`.

## Directory Structure

```text
src/
  background/
    index.ts                     # Service worker entry and message handler
    translate.ts                 # LLM API call, prompt construction, response parsing
  content/
    index.ts                     # Main entry: orchestrates translation, button init, lazy loading, SPA monitoring
    extract.ts                   # Paragraph extraction with filtering
    inject.ts                    # Translation block insertion/removal and status transitions
    selectors.ts                 # Content area detection (semantic + heuristic scoring)
    batching.ts                  # Batch splitting logic
    orchestrator.ts              # Batch translation dispatch with concurrency control
    lazyTranslation.ts           # IntersectionObserver controller for viewport lazy loading
    spaMonitoring.ts             # MutationObserver controller for SPA dynamic content
    floating.ts                  # Floating UI composition entrypoint and public API
    floatingButtonController.ts  # Floating button DOM, drag, edge hide, and animation behavior
    floatingOverlayController.ts # Gear and settings panel coordination
    floatingSettings.ts          # Settings panel UI, load/save settings, FloatingSettingsState type
    floatingProgress.ts          # Progress bar creation and updates
    floatingShortcut.ts          # Keyboard shortcut formatting and binding
    floating.css                 # Floating button and settings panel styles
    selectionTranslation.ts      # Ctrl+selection detection and popup binding
    selectionPopup.ts            # Selection translation popup UI (loading/success/error states)
    selectionPopup.css           # Selection popup styles
    translationStatus.ts         # TranslationBlockState type (pending/success/failed)
  shared/
    config.ts                    # Runtime config loading
    constants.ts                 # DOM attrs, batch limits, excluded tags/selectors
    messaging.ts                 # Chrome messaging wrappers
    types.ts                     # Shared request/response/message types
    vocabulary.ts                # VocabularyItem type + chrome.storage.local CRUD
  options/
    index.html                   # API config page
    main.ts                      # Config form logic
    style.css                    # Options page styles
    vocabulary.html              # Personal vocabulary list page
    vocabulary.ts                # Vocabulary list render + delete
    vocabulary.css               # Vocabulary list styles
```

## Environment Configuration

`.env` (not committed, copy from `.env.example`):

```bash
VITE_API_BASE_URL=https://api.openai.com/v1
VITE_API_KEY=sk-xxx
VITE_MODEL=gpt-4o-mini
```

API key is baked into the build via `import.meta.env`. For production, switch to an options-page-driven configuration flow.

## Critical Implementation Notes

- **Floating button** replaces popup UI. Click -> translate. Hover -> show gear icon. Click gear -> settings panel. Drag -> move freely. Near screen edges it auto semi-hides to about 70% off-screen. Settings are persisted in `localStorage`.
- **Keyboard shortcut** is configurable via settings panel. Default is `Ctrl+Shift+A`. It is also declared in manifest `commands`.
- Position math uses `document.documentElement.clientWidth` instead of `window.innerWidth` to avoid scrollbar offset issues.
- Slide animation uses JS `requestAnimationFrame` with ease-out instead of CSS transition on `left`, to avoid hover race conditions during semi-hide slide-out.
- `isDragging` must be reset to `false` during mouseup cleanup after drag ends.
- Gear appearance happens after slide-out finishes, and only if the button is still hovered.
- Content script identifies main content area via semantic selectors (`article`, `main`, `[role="main"]`, etc.) and then falls back to heuristic scoring.
- Translatable nodes: `p`, `li`, `blockquote`, `h1-h6`.
- Excluded content: `code`, `pre`, `nav`, `footer`, `aside`, and nodes with nav/sidebar/footer/menu class names.
- Paragraph filter: minimum 15 chars, visible, not high link density, not in excluded regions.
- Batching: max 15 paragraphs or 2500 chars per batch, max 5 concurrent batch requests.
- Translation blocks use `data-imm-translated="1"` on originals and `data-imm-translation-for="<id>"` on translated nodes. Re-running skips already translated nodes.
- Single batch failure marks only that batch as failed and does not block other batches.
- Viewport lazy loading uses `IntersectionObserver` with a 200px root margin.
- SPA dynamic content monitoring uses `MutationObserver` with 500ms debounce.
- Progress bar is shown at the top of the page during translation, then turns done-state on completion.
- `handleRemove()` in `index.ts` resets lazy translation state and stops SPA monitoring.
- `orchestrator.ts` uses `isTranslateResult()` type guard for safe response handling.
- **Selection translation**: hold `Ctrl` and select text -> popup appears near the selection with loading state -> popup shows translated result. `SELECTION_TRANSLATE` goes to background and returns `SELECTION_TRANSLATE_RESULT`. Popup closes on `Esc` or click outside.
- **Live translation status**: paragraph translation inserts pending blocks before batch results arrive, then replaces them with success or failed state. Pending insertion is handled through `insertPendingBlock()` in `inject.ts`.
- **Personal vocabulary**: `VocabularyItem` values are stored in `chrome.storage.local["imm-vocabulary"]`. CRUD lives in `src/shared/vocabulary.ts`. `options/vocabulary.html` renders the vocabulary list and supports deletion. The "add to vocabulary" action is not yet wired into the selection popup.
- **PDF status**: native Edge PDF translation is currently deferred. Investigation showed that native PDF text selection is not exposed through standard `window.getSelection()` even when script injection succeeds.

## Translation Flow

1. User clicks the floating button or presses `Ctrl+Shift+A`
2. Content script finds the main container and extracts translatable nodes
3. Nodes are split into batches and sent to background as `TRANSLATE_BATCH`
4. Background calls OpenAI-compatible `/chat/completions`
5. Background parses the structured result and returns `TRANSLATE_RESULT`
6. Content script injects translation blocks after each original paragraph
7. Progress bar updates as batches complete

## Reference Docs

- `docs/2026-05-02-mvp-product-spec.md` - product requirements and scope
- `docs/2026-05-02-mvp-technical-design.md` - architecture, selectors, batching, node marking
- `docs/2026-05-02-translation-api-spec.md` - API request/response format and error codes
- `docs/superpowers/plans/2026-05-03-selection-pdf-status-vocab-roadmap.md` - selection translation, PDF support, live status, vocabulary roadmap
