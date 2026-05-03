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

export function hideSelectionPopup() {
  const popup = document.getElementById("imm-selection-popup");
  popup?.classList.add("hidden");
}
