import { sendToBackground } from "../../shared/messaging";
import {
  hasVocabularyItem,
  recordVocabularySelection,
  upsertVocabularyItem,
} from "../../shared/vocabulary";
import type { BgResponse } from "../../shared/types";

function isVocabularyExampleResult(
  response: BgResponse
): response is {
  type: "GENERATE_VOCAB_EXAMPLE_RESULT";
  exampleSentence: string;
  exampleTranslation: string;
} {
  return "type" in response && response.type === "GENERATE_VOCAB_EXAMPLE_RESULT";
}

export async function getVocabularySelectionState(
  selection: string,
  sourceUrl: string,
  targetLang: string
): Promise<boolean> {
  await recordVocabularySelection(selection, sourceUrl, targetLang);
  return hasVocabularyItem(selection, sourceUrl, targetLang);
}

export async function saveSelectionToVocabulary(params: {
  selection: string;
  translatedText: string;
  sourceUrl: string;
  sourceTitle: string;
  targetLang: string;
}): Promise<void> {
  const { selection, translatedText, sourceUrl, sourceTitle, targetLang } = params;
  let exampleSentence = "";
  let exampleTranslation = "";

  try {
    const exampleResponse = await sendToBackground({
      type: "GENERATE_VOCAB_EXAMPLE",
      term: selection,
      translation: translatedText,
      targetLang,
    });

    if (isVocabularyExampleResult(exampleResponse)) {
      exampleSentence = exampleResponse.exampleSentence;
      exampleTranslation = exampleResponse.exampleTranslation;
    }
  } catch {}

  await upsertVocabularyItem({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    term: selection,
    translation: translatedText,
    exampleSentence,
    exampleTranslation,
    sourceUrl,
    sourceTitle,
    sourceLang: "auto",
    targetLang,
    createdAt: new Date().toISOString(),
  });
}
