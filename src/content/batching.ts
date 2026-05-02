import { MAX_BATCH_ITEMS, MAX_BATCH_CHARS } from "../shared/constants";
import type { TranslateItem } from "../shared/types";

export function splitIntoBatches(items: TranslateItem[]): TranslateItem[][] {
  const batches: TranslateItem[][] = [];
  let currentBatch: TranslateItem[] = [];
  let currentChars = 0;

  for (const item of items) {
    if (
      currentBatch.length >= MAX_BATCH_ITEMS ||
      (currentBatch.length > 0 && currentChars + item.text.length > MAX_BATCH_CHARS)
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentChars = 0;
    }

    currentBatch.push(item);
    currentChars += item.text.length;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}
