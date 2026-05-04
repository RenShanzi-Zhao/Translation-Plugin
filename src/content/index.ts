import { findMainContentContainer } from "./core/selectors";
import { extractAllTextNodes, buildTranslateItems } from "./core/extract";
import { injectTranslations, markBatchFailed, removeAllTranslations } from "./core/inject";
import {
  createFloatingButton,
  getTargetLang,
  setFloatingButtonTranslating,
  setupKeyboardShortcut,
  updateProgress,
  markProgressDone,
} from "./floating/floating";
import { translateOneBatch, translateBatches } from "./core/orchestrator";
import { restoreCachedTranslations, savePageTranslations } from "./core/pageTranslationCache";
import { createLazyTranslationController } from "./runtime/lazyTranslation";
import { createSPAMonitoring } from "./runtime/spaMonitoring";
import { setupSelectionTranslation } from "./selection/selectionTranslation";

let isTranslating = false;
let currentTargetLang = "zh-CN";
let currentNodeMap = new Map<string, HTMLElement>();

const lazyTranslation = createLazyTranslationController(
  async (batch, targetLang) => {
    isTranslating = true;
    try {
      const results = await translateOneBatch(batch, "auto", targetLang);
      injectTranslations(results, currentNodeMap);
    } catch {
      markBatchFailed(batch, currentNodeMap);
    } finally {
      isTranslating = false;
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

  const { items, nodeMap } = buildTranslateItems(nodes);
  currentNodeMap = nodeMap;

  setFloatingButtonTranslating(true);
  updateProgress(0, 1);

  try {
    const { totalBatches } = await translateBatches(
      items,
      nodeMap,
      "auto",
      targetLang,
      (done, total) => updateProgress(done, total),
      (batch, results) => savePageTranslations(batch, results, targetLang)
    );

    if (totalBatches === 0) {
      updateProgress(1, 1);
    }
    markProgressDone();
  } finally {
    isTranslating = false;
    setFloatingButtonTranslating(false);
  }

  lazyTranslation.setup(targetLang, nodes, items, nodeMap);
  spaMonitoring.start(container);
}

function handleTranslate(targetLang: string) {
  void startTranslation(targetLang);
}

function handleRemove() {
  lazyTranslation.reset();
  spaMonitoring.stop();
  removeAllTranslations();
}

export { updateProgress, markProgressDone };

async function initializeContentUi() {
  await createFloatingButton(handleTranslate, handleRemove);
  currentTargetLang = getTargetLang();
  await restoreCurrentPageTranslations(currentTargetLang);
}

initializeContentUi().catch(console.error);
setupKeyboardShortcut(handleTranslate);
setupSelectionTranslation(() => currentTargetLang);
