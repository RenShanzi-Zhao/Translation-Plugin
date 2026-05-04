import type { TranslateItem, TranslationResult } from "../../shared/types";

export const PAGE_TRANSLATION_CACHE_KEY = "imm-page-translation-cache-v1";
const MAX_CACHED_PAGES = 50;

type PageTranslationCacheEntry = {
  pageUrl: string;
  targetLang: string;
  updatedAt: string;
  translations: Record<string, string>;
};

function isCacheEntry(value: unknown): value is PageTranslationCacheEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Record<string, unknown>;
  return (
    typeof entry.pageUrl === "string" &&
    typeof entry.targetLang === "string" &&
    typeof entry.updatedAt === "string" &&
    typeof entry.translations === "object" &&
    entry.translations !== null
  );
}

export function normalizePageUrl(rawUrl = globalThis.location?.href || ""): string {
  try {
    const url = new URL(rawUrl);
    return `${url.origin}${url.pathname}${url.search}`;
  } catch {
    return rawUrl;
  }
}

async function loadCacheEntries(): Promise<PageTranslationCacheEntry[]> {
  try {
    const result = await chrome.storage.local.get(PAGE_TRANSLATION_CACHE_KEY);
    const rawEntries = Array.isArray(result[PAGE_TRANSLATION_CACHE_KEY])
      ? result[PAGE_TRANSLATION_CACHE_KEY]
      : [];
    return rawEntries.filter(isCacheEntry);
  } catch {
    return [];
  }
}

async function saveCacheEntries(entries: PageTranslationCacheEntry[]): Promise<void> {
  try {
    await chrome.storage.local.set({
      [PAGE_TRANSLATION_CACHE_KEY]: entries,
    });
  } catch {}
}

function pruneCacheEntries(entries: PageTranslationCacheEntry[]): PageTranslationCacheEntry[] {
  return [...entries]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, MAX_CACHED_PAGES);
}

function findCacheEntry(
  entries: PageTranslationCacheEntry[],
  pageUrl: string,
  targetLang: string
): PageTranslationCacheEntry | undefined {
  return entries.find((entry) => entry.pageUrl === pageUrl && entry.targetLang === targetLang);
}

export async function restoreCachedTranslations(
  items: TranslateItem[],
  targetLang: string,
  pageUrl = normalizePageUrl()
): Promise<TranslationResult[]> {
  const entries = await loadCacheEntries();
  const cacheEntry = findCacheEntry(entries, pageUrl, targetLang);
  if (!cacheEntry) {
    return [];
  }

  const restored: TranslationResult[] = [];
  for (const item of items) {
    const translatedText = cacheEntry.translations[item.text];
    if (translatedText) {
      restored.push({
        id: item.id,
        translatedText,
      });
    }
  }

  return restored;
}

export async function savePageTranslations(
  batch: TranslateItem[],
  results: TranslationResult[],
  targetLang: string,
  pageUrl = normalizePageUrl()
): Promise<void> {
  const successfulTranslations = new Map<string, string>();
  for (const result of results) {
    if (result.translatedText) {
      successfulTranslations.set(result.id, result.translatedText);
    }
  }

  if (successfulTranslations.size === 0) {
    return;
  }

  const entries = await loadCacheEntries();
  const now = new Date().toISOString();
  const existing = findCacheEntry(entries, pageUrl, targetLang);
  const translations = { ...(existing?.translations ?? {}) };

  for (const item of batch) {
    const translatedText = successfulTranslations.get(item.id);
    if (translatedText) {
      translations[item.text] = translatedText;
    }
  }

  const nextEntry: PageTranslationCacheEntry = {
    pageUrl,
    targetLang,
    updatedAt: now,
    translations,
  };

  const nextEntries = pruneCacheEntries([
    nextEntry,
    ...entries.filter((entry) => !(entry.pageUrl === pageUrl && entry.targetLang === targetLang)),
  ]);

  await saveCacheEntries(nextEntries);
}
