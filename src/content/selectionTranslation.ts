import { sendToBackground } from "../shared/messaging";

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

  document.addEventListener("mouseup", async () => {
    if (!ctrlPressed) return;
    const selection = window.getSelection()?.toString().trim() || "";
    if (!selection) return;

    await sendToBackground({
      type: "SELECTION_TRANSLATE",
      text: selection,
      sourceLang: "auto",
      targetLang: getTargetLang(),
    });
  });
}
