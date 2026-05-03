import { isPdfLikePage } from "./pdfDetection";

export function setupPdfSelectionSupport() {
  if (!isPdfLikePage()) return;
}
