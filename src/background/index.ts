import { onMessage } from "../shared/messaging";
import { testConnection, translateBatch } from "./translate";
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

  return {
    type: "TRANSLATE_ERROR",
    error: { code: "INVALID_REQUEST", message: "Unsupported message type" },
  };
});
