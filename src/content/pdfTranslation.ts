import { isPdfLikePage } from "./pdfDetection";

export function setupPdfSelectionSupport(getTargetLang: () => string, setupSelectionTranslation: (getTargetLang: () => string) => void) {
  if (!isPdfLikePage()) return;
  setupSelectionTranslation(getTargetLang);
}
