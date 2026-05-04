# Edge Immersive Translator

Browser translation extension for immersive bilingual reading on normal web pages. It inserts translated paragraphs below original content, supports selection translation, and includes a personal vocabulary library.

## Features

- Full-page paragraph translation for article-like pages
- Selection translation with inline popup
- Page translation cache for same-page return visits
- Live pending/success/failed translation states
- Personal vocabulary storage with example generation
- Floating action button with in-page settings panel

## Tech Stack

- TypeScript
- Vite multi-entry build
- Chrome/Edge Extension Manifest V3
- `chrome.storage.local` for runtime data
- OpenAI-compatible chat completions API

## Project Structure

```text
src/
  background/                  Service worker and translation API calls
  content/
    core/                      Extraction, injection, batching, caching
    runtime/                   Page/session orchestration and observers
    floating/                  Floating button, settings, progress UI
    selection/                 Selection translation popup and vocabulary save
  options/                     Runtime config page and vocabulary library page
  shared/                      Shared config, types, constants, stores
tests/                         Lightweight source and structure contract tests
```

## Development

Install dependencies:

```bash
npm install
```

Build the extension into `dist/`:

```bash
npm run build
```

Build individual targets:

```bash
npm run build:background
npm run build:content
npm run build:options
```

Type check:

```bash
node ./node_modules/typescript/bin/tsc --noEmit
```

## Load In Edge

1. Run `npm run build`
2. Open `edge://extensions`
3. Enable Developer mode
4. Click `Load unpacked`
5. Select the `dist/` directory

## Runtime Configuration

The extension prefers runtime API settings saved from the options page. When runtime config is missing, development builds can fall back to `.env`.

Example `.env`:

```bash
VITE_API_BASE_URL=https://api.openai.com/v1
VITE_API_KEY=sk-xxx
VITE_MODEL=gpt-4o-mini
```

## Current Notes

- Page translation cache is scoped to normalized page URL + target language
- Cache limits are 30 pages, 200 paragraphs per page, and 6000 paragraphs total
- Content extraction uses semantic container detection plus lightweight hostname-aware overrides
- Native Edge PDF translation remains deferred
