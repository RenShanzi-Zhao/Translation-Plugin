export type VocabularyItem = {
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

export async function addVocabularyItem(item: VocabularyItem): Promise<void> {
  const items = await getVocabulary();
  items.push(item);
  await chrome.storage.local.set({ [STORAGE_KEY]: items });
}

export async function removeVocabularyItem(term: string): Promise<void> {
  const items = await getVocabulary();
  const filtered = items.filter((v) => v.term !== term);
  await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
}
