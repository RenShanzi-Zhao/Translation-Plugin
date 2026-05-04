export type VocabularyItem = {
  id: string;
  term: string;
  normalizedTerm: string;
  translation: string;
  exampleSentence: string;
  exampleTranslation: string;
  selectionCount: number;
  mastered: boolean;
  sourceUrl: string;
  sourceTitle: string;
  sourceLang: string;
  targetLang: string;
  createdAt: string;
  updatedAt: string;
};

export type VocabularySeed = {
  id: string;
  term: string;
  translation: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  sourceUrl: string;
  sourceTitle?: string;
  sourceLang?: string;
  targetLang?: string;
  createdAt: string;
};

export function normalizeTerm(term: string): string {
  return term.trim().toLowerCase();
}

export function buildFallbackId(term: string, createdAt: string): string {
  return `legacy-${normalizeTerm(term).replace(/[^a-z0-9]+/gi, "-")}-${createdAt}`;
}

export function isMastered(raw: any): boolean {
  return raw?.mastered === true || raw?.status === "mastered";
}

export function matchesVocabularyItem(
  item: VocabularyItem,
  normalizedTerm: string,
  sourceUrl: string,
  targetLang: string
): boolean {
  return (
    item.normalizedTerm === normalizedTerm &&
    item.sourceUrl === sourceUrl &&
    item.targetLang === targetLang
  );
}

export function normalizeVocabularyItem(raw: any): VocabularyItem | null {
  if (!raw || typeof raw.term !== "string" || !raw.term.trim()) {
    return null;
  }

  const now = new Date().toISOString();
  const createdAt = typeof raw.createdAt === "string" && raw.createdAt ? raw.createdAt : now;
  const updatedAt = typeof raw.updatedAt === "string" && raw.updatedAt ? raw.updatedAt : createdAt;

  return {
    id:
      typeof raw.id === "string" && raw.id
        ? raw.id
        : buildFallbackId(raw.term, createdAt),
    term: raw.term,
    normalizedTerm:
      typeof raw.normalizedTerm === "string" && raw.normalizedTerm
        ? raw.normalizedTerm
        : normalizeTerm(raw.term),
    translation: typeof raw.translation === "string" ? raw.translation : "",
    exampleSentence: typeof raw.exampleSentence === "string" ? raw.exampleSentence : "",
    exampleTranslation: typeof raw.exampleTranslation === "string" ? raw.exampleTranslation : "",
    selectionCount: typeof raw.selectionCount === "number" ? raw.selectionCount : 1,
    mastered: isMastered(raw),
    sourceUrl: typeof raw.sourceUrl === "string" ? raw.sourceUrl : "",
    sourceTitle: typeof raw.sourceTitle === "string" ? raw.sourceTitle : "",
    sourceLang: typeof raw.sourceLang === "string" ? raw.sourceLang : "auto",
    targetLang: typeof raw.targetLang === "string" ? raw.targetLang : "zh-CN",
    createdAt,
    updatedAt,
  };
}
