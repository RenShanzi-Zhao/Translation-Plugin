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
- **Storage:** `chrome.storage.local` for runtime API config, vocabulary, floating UI settings, and page translation cache
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

After builds, `manifest.json`, `icons/`, `src/content/floating/floating.css`, and `src/content/selection/selectionPopup.css` are copied to `dist/`.

## Directory Structure

```text
src/
  background/
    index.ts                     # Service worker entry and message handler
    llmClient.ts                 # Shared chat-completions helpers and runtime config wiring
    translate.ts                 # Paragraph and selection translation logic
    vocabularyExample.ts         # Save-time vocabulary example generation
  content/
    index.ts                     # Main entry: orchestrates translation, button init, lazy loading, SPA monitoring
    core/
      extract.ts                 # Paragraph extraction with filtering
      inject.ts                  # Translation block insertion/removal and status transitions
      selectors.ts               # Content area detection (semantic + heuristic scoring)
      batching.ts                # Batch splitting logic
      orchestrator.ts            # Batch translation dispatch with concurrency control
      pageTranslationCache.ts    # Same-page translation cache restore/persist with pruning
      siteRules.ts               # Lightweight hostname-aware extraction overrides
      translationStatus.ts       # TranslationBlockState type (pending/success/failed)
    runtime/
      lazyTranslation.ts         # IntersectionObserver controller for viewport lazy loading
      pageTranslationController.ts # Page-level translation session and cache restore orchestration
      spaMonitoring.ts           # MutationObserver controller for SPA dynamic content
    floating/
      floating.ts                # Floating UI composition entrypoint and public API
      floatingButtonController.ts  # Floating button DOM, drag, edge hide, and animation behavior
      floatingOverlayController.ts # Gear and settings panel coordination
      floatingSettings.ts        # Settings panel UI, load/save settings, FloatingSettingsState type
      floatingProgress.ts        # Progress bar creation and updates
      floatingShortcut.ts        # Keyboard shortcut formatting and binding
      floating.css               # Floating button and settings panel styles
    selection/
      selectionTranslation.ts    # Ctrl+selection detection and popup binding
      selectionVocabulary.ts     # Vocabulary save orchestration for selection translation
      selectionPopup.ts          # Selection translation popup UI (loading/success/error states)
      selectionPopup.css         # Selection popup styles
  shared/
    config.ts                    # Runtime config loading
    constants.ts                 # DOM attrs, batch limits, excluded tags/selectors
    messaging.ts                 # Chrome messaging wrappers
    types.ts                     # Shared request/response/message types
    vocabulary.ts                # Facade exports for vocabulary model and store
    vocabularyModel.ts           # Vocabulary types, normalization, and match rules
    vocabularyStore.ts           # Vocabulary storage reads/writes and behavior helpers
  options/
    index.html                   # API config page
    main.ts                      # Config form logic
    style.css                    # Options page styles
    vocabulary.html              # Personal vocabulary list page
    vocabulary.ts                # Compact vocabulary card render, mastery toggle, delete
    vocabulary.css               # Vocabulary library visual design
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

- **Floating button** replaces popup UI. Click -> translate. Hover -> show gear icon. Click gear -> settings panel. Drag -> move freely. Near screen edges it auto semi-hides to about 70% off-screen. Settings are persisted in `chrome.storage.local`.
- **Keyboard shortcut** is configurable via settings panel. Default is `Ctrl+Shift+A`. It is also declared in manifest `commands`.
- Position math uses `document.documentElement.clientWidth` instead of `window.innerWidth` to avoid scrollbar offset issues.
- Slide animation uses JS `requestAnimationFrame` with ease-out instead of CSS transition on `left`, to avoid hover race conditions during semi-hide slide-out.
- `isDragging` must be reset to `false` during mouseup cleanup after drag ends.
- Gear appearance happens after slide-out finishes, and only if the button is still hovered.
- Content script identifies main content area via semantic selectors (`article`, `main`, `[role="main"]`, etc.), applies hostname-aware overrides from `siteRules.ts` when available, and then falls back to heuristic scoring.
- Translatable nodes: `p`, `li`, `blockquote`, `h1-h6`.
- Excluded content: `code`, `pre`, `nav`, `footer`, `aside`, and nodes with nav/sidebar/footer/menu class names.
- Paragraph filter: minimum 5 chars, visible, not high link density, not in excluded regions. `extractAllTextNodes()` also resolves text-node parents upward to a safer block candidate before accepting them.
- Batching: max 15 paragraphs or 2500 chars per batch, max 20 concurrent batch requests.
- Translation blocks use `data-imm-translated="1"` on originals and `data-imm-translation-for="<id>"` on translated nodes. Re-running skips already translated nodes.
- Single batch failure marks only that batch as failed and does not block other batches.
- Viewport lazy loading uses `IntersectionObserver` with a 200px root margin.
- SPA dynamic content monitoring uses `MutationObserver` with 500ms debounce.
- Progress bar is shown at the top of the page during translation, then turns done-state on completion.
- `pageTranslationController.ts` owns page-level translation session state, cache restore, lazy translation wiring, and SPA monitoring orchestration.
- `handleRemove()` resets lazy translation state and stops SPA monitoring.
- `orchestrator.ts` uses `isTranslateResult()` type guard for safe response handling.
- **Page translation cache**: successful paragraph translations are cached in `chrome.storage.local` by normalized page URL + target language, keyed by original paragraph text. Returning to the same page restores cached translations before issuing new requests. Cache limits are 30 pages, 200 paragraphs per page, and 6000 paragraphs total, with recent-use pruning.
- **Selection translation**: hold `Ctrl` and select text -> popup appears near the selection with loading state -> popup shows translated result. `SELECTION_TRANSLATE` goes to background and returns `SELECTION_TRANSLATE_RESULT`. Popup closes on `Esc` or click outside.
- **Content UI style**: the floating settings panel and selection translation popup use the same warm, restrained visual language as the vocabulary page rather than a utility-style chrome.
- **Live translation status**: paragraph translation inserts pending blocks before batch results arrive, then replaces them with success or failed state. Pending insertion is handled through `insertPendingBlock()` in `inject.ts`.
- **Personal vocabulary**: vocabulary entries are stored in `chrome.storage.local["imm-vocabulary"]`. `src/shared/vocabularyModel.ts` owns normalization and matching rules, `src/shared/vocabularyStore.ts` owns reads/writes and helper actions, and `src/shared/vocabulary.ts` re-exports the public surface. Selection translation delegates vocabulary save orchestration to `src/content/selection/selectionVocabulary.ts`, and save-time example generation lives in `src/background/vocabularyExample.ts`.
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

- `docs/product-spec.md` - product requirements and scope
- `docs/technical-design.md` - architecture, selectors, batching, node marking
- `docs/translation-api-spec.md` - API request/response format and error codes
- `docs/vocabulary-library-redesign.md` - current vocabulary library direction and UI/content model
