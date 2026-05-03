import { sendToBackground } from "../shared/messaging";

export type SelectionPopupState = "idle" | "loading" | "success" | "error";

export function ensureSelectionPopup(): HTMLDivElement {
  let popup = document.getElementById("imm-selection-popup") as HTMLDivElement | null;
  if (popup) return popup;

  popup = document.createElement("div");
  popup.id = "imm-selection-popup";
  popup.className = "imm-selection-popup hidden";
  popup.innerHTML = `
    <div class="imm-selection-popup-body">
      <div class="imm-selection-popup-status"></div>
      <div class="imm-selection-popup-text"></div>
    </div>
  `;
  document.documentElement.appendChild(popup);
  return popup;
}

export function showSelectionPopupLoading(x: number, y: number, text: string) {
  const popup = ensureSelectionPopup();
  popup.querySelector(".imm-selection-popup-status")!.textContent = "翻译中...";
  popup.querySelector(".imm-selection-popup-text")!.textContent = text;
  popup.style.left = `${Math.min(x, window.innerWidth - 340)}px`;
  popup.style.top = `${y + 10}px`;
  popup.classList.remove("hidden");
}

export function showSelectionPopupSuccess(x: number, y: number, translatedText: string) {
  const popup = ensureSelectionPopup();
  popup.querySelector(".imm-selection-popup-status")!.textContent = "译文";
  popup.querySelector(".imm-selection-popup-text")!.textContent = translatedText;
  popup.style.left = `${Math.min(x, window.innerWidth - 340)}px`;
  popup.style.top = `${y + 10}px`;
  popup.classList.remove("hidden");
}

export function showSelectionPopupError(x: number, y: number, message: string) {
  const popup = ensureSelectionPopup();
  popup.querySelector(".imm-selection-popup-status")!.textContent = "翻译失败";
  popup.querySelector(".imm-selection-popup-text")!.textContent = message;
  popup.style.left = `${Math.min(x, window.innerWidth - 340)}px`;
  popup.style.top = `${y + 10}px`;
  popup.classList.remove("hidden");
}

export function hideSelectionPopup() {
  const popup = document.getElementById("imm-selection-popup");
  popup?.classList.add("hidden");
}
