import { onMessage } from "../shared/messaging";
import { testConnection, translateBatch, translateSelectionText } from "./translate";
import { generateVocabularyExample } from "./vocabularyExample";
import type { ContentToBgMessage } from "../shared/types";

onMessage(async (message: ContentToBgMessage) => {
  if (message.type === "TRANSLATE_BATCH") {
    try {
      const translations = await translateBatch(
        message.items,
        message.sourceLang,
        message.targetLang
      );
      return { type: "TRANSLATE_RESULT", translations };
    } catch (err: any) {
      return {
        type: "TRANSLATE_ERROR",
        error: { code: err.code || "INTERNAL_ERROR", message: err.message || "Unknown error" },
      };
    }
  }

  if (message.type === "PING") {
    return { type: "PONG" };
  }

  if (message.type === "TEST_CONNECTION") {
    try {
      await testConnection(message.config);
      return {
        type: "TEST_CONNECTION_RESULT",
        ok: true,
        message: "Connection succeeded.",
      };
    } catch (err: any) {
      return {
        type: "TEST_CONNECTION_RESULT",
        ok: false,
        message: err.message || "Connection failed.",
      };
    }
  }

  if (message.type === "SELECTION_TRANSLATE") {
    try {
      const translatedText = await translateSelectionText(
        message.text,
        message.sourceLang,
        message.targetLang
      );
      return {
        type: "SELECTION_TRANSLATE_RESULT",
        translatedText,
      };
    } catch (err: any) {
      return {
        type: "TRANSLATE_ERROR",
        error: { code: err.code || "INTERNAL_ERROR", message: err.message || "Unknown error" },
      };
    }
  }

  if (message.type === "GENERATE_VOCAB_EXAMPLE") {
    try {
      const result = await generateVocabularyExample(message.term, message.translation);
      return {
        type: "GENERATE_VOCAB_EXAMPLE_RESULT",
        exampleSentence: result.exampleSentence,
        exampleTranslation: result.exampleTranslation,
      };
    } catch {
      return {
        type: "GENERATE_VOCAB_EXAMPLE_RESULT",
        exampleSentence: "",
        exampleTranslation: "",
      };
    }
  }

  if (message.type === "OPEN_VOCABULARY_PAGE") {
    const url = chrome.runtime.getURL("options/vocabulary.html");
    await chrome.tabs.create({ url });
    return {
      type: "OPEN_VOCABULARY_PAGE_RESULT",
      ok: true,
    };
  }

  return {
    type: "TRANSLATE_ERROR",
    error: { code: "INVALID_REQUEST", message: "Unsupported message type" },
  };
});
