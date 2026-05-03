import { MAX_CONCURRENT_BATCHES } from "../../shared/constants";
import { sendToBackground } from "../../shared/messaging";
import type { BgResponse, TranslateItem, TranslationResult } from "../../shared/types";
import { splitIntoBatches } from "./batching";
import { injectTranslations, insertPendingBlock, markBatchFailed } from "./inject";

type ProgressCallback = (done: number, total: number) => void;

function isTranslateResult(response: BgResponse): response is { type: "TRANSLATE_RESULT"; translations: TranslationResult[] } {
  return "type" in response && response.type === "TRANSLATE_RESULT";
}

export async function translateOneBatch(
  batch: TranslateItem[],
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult[]> {
  const response = await sendToBackground({
    type: "TRANSLATE_BATCH",
    items: batch,
    sourceLang,
    targetLang,
  });

  if ("error" in response && response.error) {
    throw new Error(response.error.message || "Translation failed");
  }

  if (!isTranslateResult(response)) {
    throw new Error("Unexpected background response");
  }

  return response.translations;
}

export async function translateBatches(
  items: TranslateItem[],
  nodeMap: Map<string, HTMLElement>,
  sourceLang: string,
  targetLang: string,
  onProgress: ProgressCallback
) {
  const batches = splitIntoBatches(items);
  let index = 0;
  let completed = 0;

  async function runNext() {
    while (index < batches.length) {
      const batch = batches[index++];

      for (const item of batch) {
        insertPendingBlock(item.id, nodeMap);
      }

      try {
        const results = await translateOneBatch(batch, sourceLang, targetLang);
        injectTranslations(results, nodeMap);
      } catch {
        markBatchFailed(batch, nodeMap);
      }

      completed++;
      onProgress(completed, batches.length);
    }
  }

  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENT_BATCHES, Math.max(1, batches.length)) },
    () => runNext()
  );

  await Promise.all(workers);
  return { totalBatches: batches.length };
}
