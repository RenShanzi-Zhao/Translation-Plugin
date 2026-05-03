import { sendToBackground } from "../shared/messaging";
import {
  showSelectionPopupLoading,
  showSelectionPopupSuccess,
  showSelectionPopupError,
  hideSelectionPopup,
} from "./selectionPopup";
import type { BgResponse } from "../shared/types";

function isSelectionResult(response: BgResponse): response is { type: "SELECTION_TRANSLATE_RESULT"; translatedText: string } {
  return "type" in response && response.type === "SELECTION_TRANSLATE_RESULT";
}

export function setupSelectionTranslation(getTargetLang: () => string) {
  let ctrlPressed = false;

  document.addEventListener("keydown", (event) => {
    if (event.key === "Control") {
      ctrlPressed = true;
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.key === "Control") {
      ctrlPressed = false;
    }
  });

  document.addEventListener("mouseup", async (event: MouseEvent) => {
    if (!ctrlPressed) return;
    const selection = window.getSelection()?.toString().trim() || "";
    if (!selection) return;

    showSelectionPopupLoading(event.clientX, event.clientY, selection);

    try {
      const response = await sendToBackground({
        type: "SELECTION_TRANSLATE",
        text: selection,
        sourceLang: "auto",
        targetLang: getTargetLang(),
      }) as BgResponse;

      if ("error" in response && response.error) {
        showSelectionPopupError(event.clientX, event.clientY, response.error.message || "翻译失败");
        return;
      }

      if (isSelectionResult(response)) {
        showSelectionPopupSuccess(event.clientX, event.clientY, response.translatedText);
      } else {
        showSelectionPopupError(event.clientX, event.clientY, "未知响应类型");
      }
    } catch (err: any) {
      showSelectionPopupError(event.clientX, event.clientY, err.message || "翻译失败");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideSelectionPopup();
    }
  });

  document.addEventListener("mousedown", (event) => {
    const popup = document.getElementById("imm-selection-popup");
    if (!popup) return;
    if (!popup.classList.contains("hidden") && !popup.contains(event.target as Node)) {
      hideSelectionPopup();
    }
  });
}
