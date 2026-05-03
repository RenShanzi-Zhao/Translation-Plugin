export const TRANSLATED_ATTR = "data-imm-translated";
export const TRANSLATION_FOR_ATTR = "data-imm-translation-for";
export const TRANSLATION_BLOCK_CLASS = "imm-translation-block";
export const FAILED_CLASS = "imm-translation-failed";

export const MIN_PARAGRAPH_LENGTH = 5;
export const MAX_BATCH_ITEMS = 15;
export const MAX_BATCH_CHARS = 2500;
export const MAX_CONCURRENT_BATCHES = 10;
export const REQUEST_TIMEOUT_MS = 20_000;
export const MAX_RETRIES = 1;

export const EXCLUDED_TAGS = new Set([
  "code", "pre", "textarea", "input", "button", "label",
  "select", "option", "script", "style", "noscript",
]);

export const EXCLUDED_CONTAINER_TAGS = new Set([
  "footer", "aside",
]);

export const EXCLUDED_SELECTORS = [
  '[role="navigation"]',
  ".sidebar",
  ".comments",
  ".comment",
  ".menu",
  ".toolbar",
  ".breadcrumb",
  ".recommend",
  ".related",
];

export const CONTENT_SELECTORS = [
  "article",
  "main",
  '[role="main"]',
  ".article",
  ".post",
  ".content",
  ".entry-content",
  ".markdown-body",
  ".doc-content",
];
