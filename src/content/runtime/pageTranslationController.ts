import { findMainContentContainer } from "../core/selectors";
import { extractAllTextNodes, buildTranslateItems } from "../core/extract";
import { injectTranslations, markBatchFailed, removeAllTranslations } from "../core/inject";
import { translateOneBatch, translateBatches } from "../core/orchestrator";
import { restoreCachedTranslations, savePageTranslations } from "../core/pageTranslationCache";
import { createLazyTranslationController } from "./lazyTranslation";
import { createSPAMonitoring } from "./spaMonitoring";

type ProgressHandler = (done: number, total: number) => void;
type DoneHandler = () => void;
type TranslatingHandler = (isTranslating: boolean) => void;

type PageTranslationControllerOptions = {
  onProgress: ProgressHandler;
  onProgressDone: DoneHandler;
  onTranslatingChange: TranslatingHandler;
};

export type PageTranslationController = {
  initialize: (targetLang: string) => Promise<void>;
  startTranslation: (targetLang: string) => Promise<void>;
  handleRemove: () => void;
  getTargetLang: () => string;
};

export function createPageTranslationController(
  options: PageTranslationControllerOptions
): PageTranslationController {
  let isTranslating = false;
  let currentTargetLang = "zh-CN";
  let currentNodeMap = new Map<string, HTMLElement>();

  const lazyTranslation = createLazyTranslationController(
    async (batch, targetLang) => {
      isTranslating = true;
      options.onTranslatingChange(true);
      try {
        const results = await translateOneBatch(batch, "auto", targetLang);
        injectTranslations(results, currentNodeMap);
      } catch {
        markBatchFailed(batch, currentNodeMap);
      } finally {
        isTranslating = false;
        options.onTranslatingChange(false);
      }
    },
    () => isTranslating
  );

  const spaMonitoring = createSPAMonitoring(() => {
    const container = findMainContentContainer();
    if (!container) return;

    const nodes = extractAllTextNodes(container);
    if (nodes.length === 0) return;

    const { items, nodeMap } = buildTranslateItems(nodes);
    currentNodeMap = nodeMap;
    void restoreCurrentPageTranslations(currentTargetLang, items, nodeMap);
    lazyTranslation.setup(currentTargetLang, nodes, items, nodeMap);
  }, () => isTranslating);

  async function restoreCurrentPageTranslations(
    targetLang: string,
    items?: ReturnType<typeof buildTranslateItems>["items"],
    nodeMap?: ReturnType<typeof buildTranslateItems>["nodeMap"]
  ) {
    const container = findMainContentContainer();
    if (!container) return;

    const extractedNodes = extractAllTextNodes(container);
    if (extractedNodes.length === 0) return;

    const translatedData = items && nodeMap
      ? { items, nodeMap }
      : buildTranslateItems(extractedNodes);

    currentNodeMap = translatedData.nodeMap;
    const cachedTranslations = await restoreCachedTranslations(translatedData.items, targetLang);
    if (cachedTranslations.length > 0) {
      injectTranslations(cachedTranslations, currentNodeMap);
      spaMonitoring.start(container);
    }
  }

  async function startTranslation(targetLang: string) {
    if (isTranslating) return;

    const container = findMainContentContainer();
    if (!container) return;

    const nodes = extractAllTextNodes(container);
    if (nodes.length === 0) return;

    isTranslating = true;
    currentTargetLang = targetLang;
    currentNodeMap = buildTranslateItems(nodes).nodeMap;
    options.onTranslatingChange(true);
    options.onProgress(0, 1);

    const { items, nodeMap } = buildTranslateItems(nodes);
    currentNodeMap = nodeMap;

    try {
      const { totalBatches } = await translateBatches(
        items,
        nodeMap,
        "auto",
        targetLang,
        (done, total) => options.onProgress(done, total),
        (batch, results) => savePageTranslations(batch, results, targetLang)
      );

      if (totalBatches === 0) {
        options.onProgress(1, 1);
      }
      options.onProgressDone();
    } finally {
      isTranslating = false;
      options.onTranslatingChange(false);
    }

    lazyTranslation.setup(targetLang, nodes, items, nodeMap);
    spaMonitoring.start(container);
  }

  function handleRemove() {
    lazyTranslation.reset();
    spaMonitoring.stop();
    removeAllTranslations();
  }

  async function initialize(targetLang: string) {
    currentTargetLang = targetLang;
    await restoreCurrentPageTranslations(currentTargetLang);
  }

  return {
    initialize,
    startTranslation,
    handleRemove,
    getTargetLang: () => currentTargetLang,
  };
}
