# AGENTS.md

## Project Overview

Edge browser translation extension (MVP). Provides immersive bilingual reading by inserting translated paragraphs below original text on web pages.

**Status:** Pre-implementation. Only design docs exist in `docs/`. No source code, build config, or dependencies yet.

## Key Design Decisions

- **Language:** TypeScript
- **Build:** Vite
- **Extension spec:** Manifest V3
- **UI:** Vanilla HTML/CSS/TS (no framework)
- **Storage:** Chrome Storage API
- **Architecture:** 4 modules — Popup, Content Script, Background Service Worker, shared utilities

## Planned Directory Structure

```
src/
  manifest.ts
  background/
    index.ts
    translate.ts
  content/
    index.ts
    extract.ts
    inject.ts
    selectors.ts
  popup/
    index.html
    main.ts
    style.css
  shared/
    constants.ts
    messaging.ts
    types.ts
```

## Critical Implementation Notes

- Content Script identifies main content area via semantic selectors (`article`, `main`, `[role="main"]`, etc.) then falls back to heuristic scoring.
- Translatable nodes: `p`, `li`, `blockquote`, `h1-h6`. Skip `code`, `pre`, `nav`, `footer`, `aside`, and nodes with nav/sidebar/footer/menu class names.
- Paragraph filter: min 15 chars, visible, not high link density, not in excluded regions.
- Batching: max 8 paragraphs OR 2500 chars per batch, max 2 concurrent batch requests.
- Translation blocks use `data-imm-translated="1"` on originals and `data-imm-translation-for="<id>"` on translated nodes. Idempotent — re-running skips already-translated nodes.
- Single batch failure retries once; second failure marks that batch as failed without blocking others.

## Translation API Contract

- `POST /v1/translate` with `{ sourceLang, targetLang, items: [{ id, text }] }`
- Response: `{ translations: [{ id, translatedText }] }`
- Server timeout: 20s. Client retries failed batches once (timeout/5xx only, not 4xx).
- Auth via `Authorization: Bearer <token>` or `X-API-Key` header.

## Reference Docs

- `docs/2026-05-02-mvp-product-spec.md` — product requirements and scope
- `docs/2026-05-02-mvp-technical-design.md` — architecture, selectors, batching, node marking
- `docs/2026-05-02-translation-api-spec.md` — API request/response format and error codes
