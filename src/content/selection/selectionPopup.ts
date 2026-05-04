export type SelectionPopupState = "idle" | "loading" | "success" | "error";

function setPopupPosition(popup: HTMLDivElement, x: number, y: number) {
  popup.style.left = `${Math.min(x, window.innerWidth - 380)}px`;
  popup.style.top = `${Math.min(y + 12, window.innerHeight - 240)}px`;
}

function getActionRow(popup: HTMLDivElement): HTMLDivElement {
  return popup.querySelector(".imm-selection-popup-actions") as HTMLDivElement;
}

function setPopupSource(popup: HTMLDivElement, text: string) {
  popup.querySelector(".imm-selection-popup-source")!.textContent = text;
}

function setPopupTranslation(popup: HTMLDivElement, text: string) {
  popup.querySelector(".imm-selection-popup-translation")!.textContent = text;
}

export function ensureSelectionPopup(): HTMLDivElement {
  let popup = document.getElementById("imm-selection-popup") as HTMLDivElement | null;
  if (popup) return popup;

  popup = document.createElement("div");
  popup.id = "imm-selection-popup";
  popup.className = "imm-selection-popup hidden";
  popup.innerHTML = `
    <div class="imm-selection-popup-top">
      <div class="imm-selection-popup-status-wrap">
        <div class="imm-selection-popup-status"></div>
        <h3 class="imm-selection-popup-title">划词翻译</h3>
      </div>
      <button class="imm-selection-popup-close" type="button" aria-label="关闭">×</button>
    </div>
    <div class="imm-selection-popup-section">
      <p class="imm-selection-popup-label">Selected text</p>
      <p class="imm-selection-popup-source"></p>
    </div>
    <div class="imm-selection-popup-section">
      <p class="imm-selection-popup-label">翻译结果</p>
      <p class="imm-selection-popup-translation"></p>
    </div>
    <div class="imm-selection-popup-actions"></div>
  `;
  popup.querySelector(".imm-selection-popup-close")?.addEventListener("click", (event) => {
    event.stopPropagation();
    hideSelectionPopup();
  });
  document.documentElement.appendChild(popup);
  return popup;
}

export function showSelectionPopupLoading(x: number, y: number, text: string) {
  const popup = ensureSelectionPopup();
  popup.querySelector(".imm-selection-popup-status")!.innerHTML =
    '<span class="imm-selection-pulse"></span> 正在生成翻译';
  setPopupSource(popup, text);
  setPopupTranslation(popup, "请稍候，结果会在这里出现。");
  getActionRow(popup).innerHTML = "";
  setPopupPosition(popup, x, y);
  popup.classList.remove("hidden");
}

type SuccessActions = {
  onAddVocabulary?: () => void;
  added?: boolean;
  sourceText?: string;
};

export function showSelectionPopupSuccess(
  x: number,
  y: number,
  translatedText: string,
  actions?: SuccessActions
) {
  const popup = ensureSelectionPopup();
  popup.querySelector(".imm-selection-popup-status")!.textContent = "翻译完成";
  setPopupSource(popup, actions?.sourceText || "");
  setPopupTranslation(popup, translatedText);

  const actionRow = getActionRow(popup);
  actionRow.innerHTML = "";

  const button = document.createElement("button");
  button.className = "imm-selection-popup-add";
  button.textContent = actions?.added ? "已加入词汇库" : "加入词汇库";
  button.disabled = Boolean(actions?.added);
  if (actions?.onAddVocabulary && !actions?.added) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      actions.onAddVocabulary?.();
    });
  }
  actionRow.appendChild(button);

  setPopupPosition(popup, x, y);
  popup.classList.remove("hidden");
}

export function showSelectionPopupError(x: number, y: number, message: string) {
  const popup = ensureSelectionPopup();
  popup.querySelector(".imm-selection-popup-status")!.textContent = "翻译失败";
  setPopupTranslation(popup, message);
  getActionRow(popup).innerHTML = "";
  setPopupPosition(popup, x, y);
  popup.classList.remove("hidden");
}

export function hideSelectionPopup() {
  const popup = document.getElementById("imm-selection-popup");
  popup?.classList.add("hidden");
}
