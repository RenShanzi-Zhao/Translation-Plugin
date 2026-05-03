export type VocabularyItem = {
  id: string;
  term: string;
  translation: string;
  context: string;
  sourceUrl: string;
  createdAt: string;
};

const STORAGE_KEY = "imm-vocabulary";

export async function getVocabulary(): Promise<VocabularyItem[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
}

export async function hasVocabularyItem(term: string, sourceUrl: string): Promise<boolean> {
  const items = await getVocabulary();
  return items.some((item) => item.term === term && item.sourceUrl === sourceUrl);
}

export async function addVocabularyItem(item: VocabularyItem): Promise<void> {
  const items = await getVocabulary();
  const exists = items.some(
    (existing) => existing.term === item.term && existing.sourceUrl === item.sourceUrl
  );
  if (exists) return;
  items.push(item);
  await chrome.storage.local.set({ [STORAGE_KEY]: items });
}

export async function removeVocabularyItem(id: string): Promise<void> {
  const items = await getVocabulary();
  const filtered = items.filter((item) => item.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
}
