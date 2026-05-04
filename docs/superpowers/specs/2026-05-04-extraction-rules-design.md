# Extraction Rules Design

## Goal

Improve webpage paragraph extraction for article-like pages without turning the extension into a general-purpose in-place translator.

## Scope

This change is intentionally narrow:

- add lightweight site-aware extraction overrides keyed by hostname
- allow overrides to customize content root selectors, content selectors, and ignore selectors
- tighten fallback extraction so broad container elements are less likely to be translated as paragraphs
- keep the existing paragraph-under-original rendering model

This change does not include:

- rich-text placeholder preservation
- per-site UI or options-page rule editing
- full DOM-group translation like `kiss-translator`

## Design

### Site-aware overrides

Add a small content-side rule module that maps hostnames to extraction hints:

- `contentSelectors`
- `containerSelectors`
- `excludedSelectors`

The selectors module should consult these hints before falling back to the shared defaults. This keeps the feature lightweight and local to extraction.

### Stricter extraction

Keep `extractTranslatableNodes()` as the explicit paragraph-style path.

Refine `extractAllTextNodes()` so it no longer accepts any parent element that merely contains text. Instead it should:

- gather text-node parents with a `TreeWalker`
- resolve each text node upward to a stable block-level candidate
- reject inline-only or overly broad wrapper nodes
- apply the same visibility, exclusion, and link-density checks used by normal extraction before returning candidates

This preserves current behavior for article pages while reducing accidental translation of UI fragments.

## Risks and mitigations

- Site rules can become brittle. Keep the initial rule set tiny and limited to obvious targets such as GitHub-style markdown containers.
- Stricter extraction could miss some content. Keep the fallback logic conservative and still allow semantic container discovery.

## Testing

Use lightweight source-contract tests in the existing project style to verify:

- the new rule module exists and includes hostname-aware overrides
- selectors read from the rule module
- extraction now resolves text nodes through a block-candidate helper and reuses shared filtering
