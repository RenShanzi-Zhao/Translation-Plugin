# Vocabulary Library Redesign

## Goal

Redesign the personal vocabulary library into a cleaner, more compact, more product-quality reading page with a restrained visual style, simplified information architecture, and AI-generated example content at save time.

## Why This Redesign

The current vocabulary page has three problems:

1. the visual style is too plain and form-like
2. the information shown is too noisy and mixed-language
3. each item is too tall for high-frequency browsing

The new design should feel calm, compact, readable, and deliberate. The target visual direction is closer to the restrained, warm, minimal style of Claude's official product pages rather than a utility dashboard.

## Scope

This redesign covers:

- vocabulary page layout and styling
- visible vocabulary fields
- mastered toggle interaction
- delete interaction
- example sentence generation at save time
- simplified vocabulary item shape used by the page

This redesign does not cover:

- search or filtering
- tags
- review scheduling
- review counts
- timestamps in the UI
- source URL or source title in the UI
- PDF support

## Product Direction

The vocabulary library should stop behaving like a study admin panel and start behaving like a high-quality personal collection page.

The page should emphasize:

- the saved word or sentence
- the translation
- a useful example
- a simple mastery state
- lightweight frequency information

The page should hide everything that feels internal, technical, or noisy.

## Visual Direction

### Overall Tone

The page should use:

- a warm light background
- soft off-white cards
- thin neutral borders
- dark gray typography instead of strong blue accents
- generous but controlled whitespace
- a compact vertical rhythm

The page should avoid:

- loud accent colors
- large utility buttons
- admin-panel density
- mixed visual emphasis

### Reference Style

The target feel is:

- calm
- premium
- editorial
- product-polished

It should resemble a restrained product page more than a data table.

## Layout

Use a single-column compact card list.

This is intentionally not:

- a table
- a split master-detail interface
- a dense analytics panel

### Page Frame

The page should have:

- a centered content column
- a modest page title
- a short supporting line under the title
- a compact list of low-height cards

### Card Density

Each card should be much shorter than the current implementation.

The goal is:

- multiple entries visible per screen
- no large empty interior space
- no oversized button rows

## Card Information Design

Each vocabulary card should contain only the following visible fields:

1. word or sentence
2. translation
3. English example sentence
4. Chinese explanation of the example sentence
5. underline count
6. mastered toggle
7. delete action

## Card Structure

Each card should be arranged in five rows:

### Row 1

- left: saved word or sentence
- right: single mastery toggle button

### Row 2

- translation in Chinese

### Row 3

- English example sentence

### Row 4

- Chinese explanation of the example sentence

### Row 5

- left: underline count, such as `划线 3 次`
- right: weak delete text button

This structure keeps the reading flow stable and reduces clutter.

## Interaction Design

### Mastery Toggle

Use one toggle-style button rather than two separate actions.

States:

- `未掌握`
- `已掌握`

Behavior:

- one click toggles between the two states
- the visual difference should be clear but understated
- mastered should not dominate the page with strong color

### Delete

Use a lightweight text button at the bottom-right of each card.

Design goals:

- visible enough to find
- weak enough not to compete with the main content
- less visually heavy than the current button row

### Empty State

The empty state should be calm and encouraging.

Recommended message direction:

- explain that saved vocabulary will appear here
- mention that users can add items from selection translation
- keep the copy short and entirely in Chinese

## Language Strategy

The visible UI should be Chinese-first and consistent.

That means:

- no `Continue Learning`
- no `Mark Mastered`
- no `Remove`
- no `word / phrase / sentence`
- no `selected / reviewed / next`

English should appear only where it belongs:

- saved term if it is English
- English example sentence

Everything else in the interface should be Chinese.

## Data Model for the Page

The visible page should be driven by a simplified presentation model.

Required fields:

- `id`
- `term`
- `translation`
- `exampleSentence`
- `exampleTranslation`
- `selectionCount`
- `mastered`

Internal fields may still exist in storage, but the page should not surface them unless they become necessary later.

## Storage Direction

Storage should remain local in `chrome.storage.local`.

No SQLite or external database is needed for this redesign.

This redesign is about:

- simplifying the visible model
- improving page structure
- enriching the saved content

It is not a storage scalability project.

## Save-Time Example Generation

### Why Save-Time Generation

Generate example content when the user adds an item to the vocabulary, not when the vocabulary page opens.

Reasons:

- page load stays fast and static
- the vocabulary page only renders stored data
- users do not wait for AI on every page visit
- generated content becomes part of the saved item

### Generated Fields

When the user saves an item, request:

- one English example sentence
- one Chinese explanation or translation of that example

### Prompt Intent

The generation request should aim for:

- short
- natural
- easy-to-understand
- relevant to the saved word or sentence

The output should feel like a language-learning example, not a dictionary dump.

## Failure Handling

If example generation fails:

- still allow the item to be saved
- leave `exampleSentence` empty
- leave `exampleTranslation` empty

This is important for robustness. Save must not become blocked by a secondary enrichment step.

## Save Flow

The save flow should become:

1. user selects text and gets translation
2. user clicks `加入词汇库`
3. system generates example content in the background
4. system saves:
   - term
   - translation
   - exampleSentence
   - exampleTranslation
   - selectionCount
   - mastered
5. vocabulary page later renders the stored result directly

## Frequency Semantics

The page should display only one frequency signal:

- `划线 X 次`

This value represents how many times the saved unit has been selected and translated.

The page should not expose:

- review counts
- save counts
- next review times

Those belong to a heavier learning system, which is intentionally out of scope here.

## Mastery Semantics

The visible mastery model should be binary:

- mastered
- not mastered

The page does not need to expose:

- `new`
- `learning`
- `reviewed`

If the storage layer still needs compatibility with older status fields, the UI layer should map them into this simpler binary model.

Recommended mapping:

- `mastered` -> mastered
- anything else -> not mastered

## Compatibility With Existing Vocabulary Data

Existing stored items may not yet contain:

- `exampleSentence`
- `exampleTranslation`
- `mastered`

The page should normalize missing values safely:

- missing example fields -> empty strings
- missing mastered state -> `false`
- missing selection count -> `1`

Older metadata may stay in storage for compatibility, but the redesigned page should ignore it visually.

## Module Changes

### `src/shared/vocabulary.ts`

Should evolve toward a simpler visible model while still supporting normalization.

Needed responsibilities:

- normalize old items
- expose simplified read values for the page
- support mastery toggle
- support save-time example fields

### `src/content/selectionTranslation.ts`

Should:

- keep the current add-to-vocabulary flow
- request example generation during save
- save the new example fields with the item

### `src/background`

Should add a lightweight example-generation path, likely alongside existing translation infrastructure.

This should be a separate request path from paragraph translation so the prompt and response shape stay small and explicit.

### `src/options/vocabulary.ts`

Should:

- render the simplified card structure
- render fully Chinese UI copy
- support binary mastered toggle
- support delete

### `src/options/vocabulary.css`

Should be substantially redesigned.

This file is responsible for most of the visible improvement:

- page frame
- card density
- typography
- button tone
- spacing rhythm
- empty state polish

## Testing Strategy

Add or update tests around:

- vocabulary items storing example fields
- example generation failure still allowing save
- vocabulary page using Chinese-first labels
- vocabulary page rendering mastery toggle
- vocabulary page hiding old noisy metadata

Regression coverage should preserve:

- open vocabulary page still works
- add-to-vocabulary still works
- delete still works

## Trade-Offs

### Why This Is Recommended

- much better reading experience
- cleaner emotional feel
- lower cognitive load
- stronger alignment with how users actually browse a personal vocabulary collection
- no extra storage complexity

### What We Are Giving Up

- rich study analytics
- visible review scheduling
- extra metadata in the UI

This is intentional. The redesign favors quality, focus, and usability over feature surface.

## Follow-On Work

After this redesign ships, natural next steps are:

1. search
2. simple mastered filter
3. inline note support
4. export

These should only be added if they preserve the compact, clean reading experience.
