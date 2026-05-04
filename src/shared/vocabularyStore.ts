import {
  matchesVocabularyItem,
  normalizeTerm,
  normalizeVocabularyItem,
  type VocabularyItem,
  type VocabularySeed,
} from "./vocabularyModel";

const STORAGE_KEY = "imm-vocabulary";

async function saveVocabulary(items: VocabularyItem[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: items });
}

export async function getVocabulary(): Promise<VocabularyItem[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const rawItems = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
  return rawItems
    .map((raw) => normalizeVocabularyItem(raw))
    .filter((item): item is VocabularyItem => Boolean(item));
}

export async function hasVocabularyItem(
  term: string,
  sourceUrl: string,
  targetLang = "zh-CN"
): Promise<boolean> {
  const items = await getVocabulary();
  const normalizedTerm = normalizeTerm(term);
  return items.some((item) => matchesVocabularyItem(item, normalizedTerm, sourceUrl, targetLang));
}

export async function upsertVocabularyItem(item: VocabularySeed): Promise<VocabularyItem> {
  const items = await getVocabulary();
  const normalizedTerm = normalizeTerm(item.term);
  const targetLang = item.targetLang || "zh-CN";
  const now = new Date().toISOString();
  const existingIndex = items.findIndex((entry) =>
    matchesVocabularyItem(entry, normalizedTerm, item.sourceUrl, targetLang)
  );

  if (existingIndex >= 0) {
    const existing = items[existingIndex];
    const updated: VocabularyItem = {
      ...existing,
      translation: existing.translation || item.translation,
      exampleSentence: existing.exampleSentence || item.exampleSentence || "",
      exampleTranslation: existing.exampleTranslation || item.exampleTranslation || "",
      updatedAt: now,
    };
    items[existingIndex] = updated;
    await saveVocabulary(items);
    return updated;
  }

  const created: VocabularyItem = {
    id: item.id,
    term: item.term,
    normalizedTerm,
    translation: item.translation,
    exampleSentence: item.exampleSentence || "",
    exampleTranslation: item.exampleTranslation || "",
    selectionCount: 1,
    mastered: false,
    sourceUrl: item.sourceUrl,
    sourceTitle: item.sourceTitle || "",
    sourceLang: item.sourceLang || "auto",
    targetLang,
    createdAt: item.createdAt,
    updatedAt: now,
  };
  items.push(created);
  await saveVocabulary(items);
  return created;
}

export async function addVocabularyItem(item: VocabularySeed): Promise<void> {
  await upsertVocabularyItem(item);
}

export async function recordVocabularySelection(
  term: string,
  sourceUrl: string,
  targetLang = "zh-CN"
): Promise<boolean> {
  const items = await getVocabulary();
  const normalizedTerm = normalizeTerm(term);
  const index = items.findIndex((item) =>
    matchesVocabularyItem(item, normalizedTerm, sourceUrl, targetLang)
  );
  if (index < 0) {
    return false;
  }

  items[index] = {
    ...items[index],
    selectionCount: items[index].selectionCount + 1,
    updatedAt: new Date().toISOString(),
  };
  await saveVocabulary(items);
  return true;
}

export async function toggleVocabularyMastered(id: string): Promise<void> {
  const items = await getVocabulary();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return;

  items[index] = {
    ...items[index],
    mastered: !items[index].mastered,
    updatedAt: new Date().toISOString(),
  };
  await saveVocabulary(items);
}

export async function removeVocabularyItem(id: string): Promise<void> {
  const items = await getVocabulary();
  const filtered = items.filter((item) => item.id !== id);
  await saveVocabulary(filtered);
}
