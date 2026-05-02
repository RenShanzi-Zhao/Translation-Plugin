import { onMessage } from "../shared/messaging";
import { findMainContentContainer } from "./selectors";
import { extractTranslatableNodes, buildTranslateItems } from "./extract";
import { injectTranslations, removeAllTranslations, hasExistingTranslations, markBatchFailed } from "./inject";
import { sendToBackground } from "../shared/messaging";
import { MAX_BATCH_ITEMS, MAX_BATCH_CHARS, MAX_CONCURRENT_BATCHES, TRANSLATED_ATTR } from "../shared/constants";
import type { PopupMessage, TranslateItem, TranslationResult } from "../shared/types";

let isTranslating = false;

function splitIntoBatches(items: TranslateItem[]): TranslateItem[][] {
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

async function translateOneBatch(
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

  if (response?.error) {
    throw new Error(response.error.message || "Translation failed");
  }

  return response.translations;
}

async function translateAllBatches(
  batches: TranslateItem[][],
  nodeMap: Map<string, HTMLElement>,
  sourceLang: string,
  targetLang: string,
  onProgress: (done: number, total: number) => void
) {
  let index = 0;
  let completed = 0;

  async function runNext() {
    while (index < batches.length) {
      const batchIndex = index++;
      const batch = batches[batchIndex];

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

  const workers: Promise<void>[] = [];
  for (let i = 0; i < MAX_CONCURRENT_BATCHES; i++) {
    workers.push(runNext());
  }

  await Promise.all(workers);
}

async function startTranslation(targetLang: string) {
  if (isTranslating) return;

  const container = findMainContentContainer();
  if (!container) {
    chrome.runtime.sendMessage({
      type: "TRANSLATE_STATUS",
      status: "error",
      message: "未检测到可翻译正文",
    });
    return;
  }

  const nodes = extractTranslatableNodes(container);
  if (nodes.length === 0) {
    chrome.runtime.sendMessage({
      type: "TRANSLATE_STATUS",
      status: "error",
      message: "未找到可翻译段落",
    });
    return;
  }

  isTranslating = true;

  const { items, nodeMap } = buildTranslateItems(nodes);
  const batches = splitIntoBatches(items);

  const sourceLang = "auto";

  chrome.runtime.sendMessage({
    type: "TRANSLATE_STATUS",
    status: "translating",
    total: batches.length,
    done: 0,
  });

  try {
    await translateAllBatches(batches, nodeMap, sourceLang, targetLang, (done, total) => {
      chrome.runtime.sendMessage({
        type: "TRANSLATE_STATUS",
        status: "translating",
        total,
        done,
      });
    });

    chrome.runtime.sendMessage({
      type: "TRANSLATE_STATUS",
      status: "done",
    });
  } catch {
    chrome.runtime.sendMessage({
      type: "TRANSLATE_STATUS",
      status: "error",
      message: "翻译过程中发生错误",
    });
  } finally {
    isTranslating = false;
  }

  setupSPAMonitoring(targetLang);
}

onMessage(async (message: PopupMessage) => {
  if (message.type === "START_TRANSLATE") {
    if (hasExistingTranslations()) {
      chrome.runtime.sendMessage({
        type: "TRANSLATE_STATUS",
        status: "done",
        message: "页面已有译文，跳过已翻译段落",
      });
    }
    await startTranslation(message.targetLang);
  }

  if (message.type === "REMOVE_TRANSLATION") {
    removeAllTranslations();
    chrome.runtime.sendMessage({
      type: "TRANSLATE_STATUS",
      status: "removed",
    });
  }
});

let observer: IntersectionObserver | null = null;
let pendingNodes: HTMLElement[] = [];
let nodeMapRef: Map<string, HTMLElement> = new Map();

function setupLazyTranslation(targetLang: string) {
  const container = findMainContentContainer();
  if (!container) return;

  const nodes = extractTranslatableNodes(container);
  if (nodes.length === 0) return;

  const { items, nodeMap } = buildTranslateItems(nodes);
  nodeMapRef = nodeMap;

  const itemMap = new Map<string, TranslateItem>();
  for (const item of items) {
    itemMap.set(item.id, item);
  }

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const node = entry.target as HTMLElement;
          const id = Array.from(nodeMap.entries()).find(([_, n]) => n === node)?.[0];
          if (id) {
            const item = itemMap.get(id);
            if (item) pendingNodes.push(node);
          }
          observer?.unobserve(node);
        }
      }

      processLazyBatch(targetLang);
    },
    { rootMargin: "200px" }
  );

  for (const node of nodes) {
    if (!node.hasAttribute(TRANSLATED_ATTR)) {
      observer.observe(node);
    }
  }
}

async function processLazyBatch(targetLang: string) {
  if (isTranslating || pendingNodes.length === 0) return;

  const batch: TranslateItem[] = [];
  const batchNodes: HTMLElement[] = [];

  while (pendingNodes.length > 0 && batch.length < MAX_BATCH_ITEMS) {
    const node = pendingNodes.shift()!;
    const id = Array.from(nodeMapRef.entries()).find(([_, n]) => n === node)?.[0];
    if (id && !node.hasAttribute(TRANSLATED_ATTR)) {
      batch.push({ id, text: node.textContent?.trim() || "" });
      batchNodes.push(node);
    }
  }

  if (batch.length === 0) return;

  isTranslating = true;
  try {
    const results = await translateOneBatch(batch, "auto", targetLang);
    injectTranslations(results, nodeMapRef);
  } catch {
    markBatchFailed(batch, nodeMapRef);
  } finally {
    isTranslating = false;
    if (pendingNodes.length > 0) {
      processLazyBatch(targetLang);
    }
  }
}

let spaObserver: MutationObserver | null = null;
let currentTargetLang = "zh-CN";

function setupSPAMonitoring(targetLang: string) {
  currentTargetLang = targetLang;

  if (spaObserver) spaObserver.disconnect();

  spaObserver = new MutationObserver((mutations) => {
    let hasNewContent = false;

    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          if (
            el.tagName.toLowerCase() === "p" ||
            el.querySelector("p, li, blockquote, h1, h2, h3, h4, h5, h6")
          ) {
            hasNewContent = true;
            break;
          }
        }
      }
      if (hasNewContent) break;
    }

    if (hasNewContent && !isTranslating) {
      setTimeout(() => setupLazyTranslation(currentTargetLang), 500);
    }
  });

  const container = findMainContentContainer() || document.body;
  spaObserver.observe(container, { childList: true, subtree: true });
}
