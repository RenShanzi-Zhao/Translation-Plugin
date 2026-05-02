import { TRANSLATED_ATTR, MAX_BATCH_ITEMS } from "../shared/constants";
import type { TranslateItem } from "../shared/types";

type TranslateBatch = (batch: TranslateItem[], targetLang: string) => Promise<void>;
type IsBusy = () => boolean;

export function createLazyTranslationController(translateBatch: TranslateBatch, isBusy: IsBusy) {
  let observer: IntersectionObserver | null = null;
  let pendingNodes: HTMLElement[] = [];
  let nodeMapRef = new Map<string, HTMLElement>();
  let itemMapRef = new Map<string, TranslateItem>();

  function reset() {
    observer?.disconnect();
    observer = null;
    pendingNodes = [];
    nodeMapRef = new Map();
    itemMapRef = new Map();
  }

  function setup(targetLang: string, nodes: HTMLElement[], items: TranslateItem[], nodeMap: Map<string, HTMLElement>) {
    reset();
    nodeMapRef = nodeMap;
    itemMapRef = new Map(items.map((item) => [item.id, item]));

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          const node = entry.target as HTMLElement;
          const id = findNodeId(nodeMapRef, node);
          if (id && itemMapRef.has(id)) {
            pendingNodes.push(node);
          }

          observer?.unobserve(node);
        }

        void processNext(targetLang);
      },
      { rootMargin: "200px" }
    );

    for (const node of nodes) {
      if (!node.hasAttribute(TRANSLATED_ATTR)) {
        observer.observe(node);
      }
    }
  }

  async function processNext(targetLang: string) {
    if (isBusy() || pendingNodes.length === 0) {
      return;
    }

    const batch: TranslateItem[] = [];
    while (pendingNodes.length > 0 && batch.length < MAX_BATCH_ITEMS) {
      const node = pendingNodes.shift();
      if (!node) {
        continue;
      }

      const id = findNodeId(nodeMapRef, node);
      if (!id || node.hasAttribute(TRANSLATED_ATTR)) {
        continue;
      }

      const item = itemMapRef.get(id);
      if (item) {
        batch.push(item);
      }
    }

    if (batch.length === 0) {
      return;
    }

    await translateBatch(batch, targetLang);

    if (pendingNodes.length > 0) {
      await processNext(targetLang);
    }
  }

  return { setup, reset };
}

function findNodeId(nodeMap: Map<string, HTMLElement>, target: HTMLElement): string | undefined {
  for (const [id, node] of nodeMap.entries()) {
    if (node === target) {
      return id;
    }
  }

  return undefined;
}
