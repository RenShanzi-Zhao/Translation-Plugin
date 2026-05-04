import {
  createFloatingButton,
  getTargetLang,
  setFloatingButtonTranslating,
  setupKeyboardShortcut,
  updateProgress,
  markProgressDone,
} from "./floating/floating";
import { createPageTranslationController } from "./runtime/pageTranslationController";
import { setupSelectionTranslation } from "./selection/selectionTranslation";

const pageTranslationController = createPageTranslationController({
  onProgress: updateProgress,
  onProgressDone: markProgressDone,
  onTranslatingChange: setFloatingButtonTranslating,
});

export { updateProgress, markProgressDone };

async function initializeContentUi() {
  await createFloatingButton(
    (targetLang) => {
      void pageTranslationController.startTranslation(targetLang);
    },
    () => {
      pageTranslationController.handleRemove();
    }
  );
  await pageTranslationController.initialize(getTargetLang());
}

initializeContentUi().catch(console.error);
setupKeyboardShortcut((targetLang) => {
  void pageTranslationController.startTranslation(targetLang);
});
setupSelectionTranslation(() => pageTranslationController.getTargetLang());
