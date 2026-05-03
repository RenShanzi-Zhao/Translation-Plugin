import { findMainContentContainer } from "./selectors";
import { extractTranslatableNodes, buildTranslateItems } from "./extract";
import { injectTranslations, markBatchFailed, removeAllTranslations } from "./inject";
import {
  createFloatingButton,
  setFloatingButtonTranslating,
  setupKeyboardShortcut,
  updateProgress,
  markProgressDone,
} from "./floating";
import { translateOneBatch, translateBatches } from "./orchestrator";
import { createLazyTranslationController } from "./lazyTranslation";
import { createSPAMonitoring } from "./spaMonitoring";
import { setupSelectionTranslation } from "./selectionTranslation";
import { setupPdfSelectionSupport } from "./pdfTranslation";

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
  const nodes = extractTranslatableNodes(container);
  if (nodes.length === 0) return;
  const { items, nodeMap } = buildTranslateItems(nodes);
  currentNodeMap = nodeMap;
  lazyTranslation.setup(currentTargetLang, nodes, items, nodeMap);
}, () => isTranslating);

async function startTranslation(targetLang: string) {
  if (isTranslating) return;

  const container = findMainContentContainer();
  if (!container) return;

  const nodes = extractTranslatableNodes(container);
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
      (done, total) => updateProgress(done, total)
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

createFloatingButton(handleTranslate, handleRemove).catch(console.error);
setupKeyboardShortcut(handleTranslate);
// Ctrl+click to translate selected text
setupSelectionTranslation(() => currentTargetLang);
// PDF selection translation support
setupPdfSelectionSupport(() => currentTargetLang, setupSelectionTranslation);
