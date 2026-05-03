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
  popup.querySelector(".imm-selection-popup-status")!.innerHTML = '<span class="imm-selection-pulse"></span> 翻译官正在路上...';
  popup.querySelector(".imm-selection-popup-text")!.textContent = text;
  popup.style.left = `${Math.min(x, window.innerWidth - 340)}px`;
  popup.style.top = `${y + 10}px`;
  popup.classList.remove("hidden");
}

type SuccessActions = {
  onAddVocabulary?: () => void;
  added?: boolean;
};

export function showSelectionPopupSuccess(
  x: number,
  y: number,
  translatedText: string,
  actions?: SuccessActions
) {
  const popup = ensureSelectionPopup();
  popup.querySelector(".imm-selection-popup-status")!.textContent = "译文";
  popup.querySelector(".imm-selection-popup-text")!.textContent = translatedText;

  let actionRow = popup.querySelector(".imm-selection-popup-actions") as HTMLDivElement | null;
  if (!actionRow) {
    actionRow = document.createElement("div");
    actionRow.className = "imm-selection-popup-actions";
    popup.appendChild(actionRow);
  }

  actionRow.innerHTML = "";
  const button = document.createElement("button");
  button.className = "imm-selection-popup-add";
  button.textContent = actions?.added ? "已加入词库" : "加入词库";
  button.disabled = Boolean(actions?.added);
  if (actions?.onAddVocabulary && !actions?.added) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      actions.onAddVocabulary?.();
    });
  }
  actionRow.appendChild(button);

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
