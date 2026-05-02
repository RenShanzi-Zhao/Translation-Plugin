export type TranslateCallback = (targetLang: string) => void;
export type RemoveCallback = () => void;

let floatBtn: HTMLDivElement | null = null;
let settingsPanel: HTMLDivElement | null = null;
let progressBar: HTMLDivElement | null = null;
let progressBarInner: HTMLDivElement | null = null;
let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let btnStartX = 0;
let btnStartY = 0;

let currentTargetLang = "zh-CN";
let currentShortcut = "Ctrl+Shift+A";
let currentOpacity = 0.6;
let isEdgeHidden = false;
let edgeSide: "left" | "right" | null = null;
const EDGE_THRESHOLD = 10;

const TRANSLATE_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 5h12M9 3v2m1.048 3.5A18.024 18.024 0 003.186 13m2.87-5.5a18.02 18.02 0 005.89 8.243M12 21l3.75-7.5L19.5 21M14.25 18h5.25" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function loadSettings() {
  try {
    const saved = localStorage.getItem("imm-settings");
    if (saved) {
      const s = JSON.parse(saved);
      if (s.targetLang) currentTargetLang = s.targetLang;
      if (s.shortcut) currentShortcut = s.shortcut;
      if (typeof s.opacity === "number") currentOpacity = s.opacity;
    }
  } catch {}
}

function saveSettings() {
  try {
    localStorage.setItem("imm-settings", JSON.stringify({
      targetLang: currentTargetLang,
      shortcut: currentShortcut,
      opacity: currentOpacity,
    }));
  } catch {}
}

function createProgressBar() {
  if (progressBar) return;
  progressBar = document.createElement("div");
  progressBar.className = "imm-progress";
  progressBarInner = document.createElement("div");
  progressBarInner.className = "imm-progress-bar";
  progressBar.appendChild(progressBarInner);
  document.documentElement.appendChild(progressBar);
}

export function updateProgress(done: number, total: number) {
  if (!progressBar || !progressBarInner) return;
  const pct = total > 0 ? (done / total) * 100 : 0;
  progressBarInner.style.width = `${pct}%`;
}

export function markProgressDone() {
  if (!progressBar) return;
  progressBar.classList.add("done");
  setTimeout(() => {
    progressBar?.remove();
    progressBar = null;
    progressBarInner = null;
  }, 1500);
}

function createSettingsPanel(): HTMLDivElement {
  const panel = document.createElement("div");
  panel.className = "imm-settings-panel";

  panel.innerHTML = `
    <label class="imm-setting-label">目标语言</label>
    <select id="imm-lang-select">
      <option value="zh-CN">英文 → 中文</option>
      <option value="en">中文 → 英文</option>
    </select>
    <label class="imm-setting-label">透明度 <span id="imm-opacity-val">${Math.round(currentOpacity * 100)}%</span></label>
    <input type="range" min="20" max="100" value="${Math.round(currentOpacity * 100)}" id="imm-opacity-slider" style="width:100%;margin:4px 0" />
    <label class="imm-setting-label">快捷键</label>
    <input type="text" class="imm-shortcut-input" id="imm-shortcut-input" readonly />
    <div class="imm-btn-row">
      <button class="imm-action-btn imm-translate-btn" id="imm-panel-translate">翻译</button>
      <button class="imm-action-btn imm-remove-btn" id="imm-panel-remove">移除</button>
    </div>
  `;

  document.documentElement.appendChild(panel);

  const langSelect = panel.querySelector("#imm-lang-select") as HTMLSelectElement;
  const shortcutInput = panel.querySelector("#imm-shortcut-input") as HTMLInputElement;
  const translateBtn = panel.querySelector("#imm-panel-translate") as HTMLButtonElement;
  const removeBtn = panel.querySelector("#imm-panel-remove") as HTMLButtonElement;

  langSelect.value = currentTargetLang;
  shortcutInput.value = currentShortcut;

  const opacitySlider = panel.querySelector("#imm-opacity-slider") as HTMLInputElement;
  const opacityVal = panel.querySelector("#imm-opacity-val") as HTMLSpanElement;

  langSelect.addEventListener("change", () => {
    currentTargetLang = langSelect.value;
    saveSettings();
  });

  opacitySlider.addEventListener("input", () => {
    currentOpacity = parseInt(opacitySlider.value) / 100;
    opacityVal.textContent = `${opacitySlider.value}%`;
    if (floatBtn && !isEdgeHidden) {
      floatBtn.style.opacity = String(currentOpacity);
    }
    saveSettings();
  });

  shortcutInput.addEventListener("keydown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const parts: string[] = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    if (e.metaKey) parts.push("Meta");
    if (!["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
      parts.push(e.key.toUpperCase());
    }
    if (parts.length >= 2) {
      currentShortcut = parts.join("+");
      shortcutInput.value = currentShortcut;
      saveSettings();
    }
  });

  translateBtn.addEventListener("click", () => {
    hideSettings();
    if (onTranslateCallback) onTranslateCallback(currentTargetLang);
  });

  removeBtn.addEventListener("click", () => {
    hideSettings();
    if (onRemoveCallback) onRemoveCallback();
  });

  return panel;
}

let onTranslateCallback: TranslateCallback | null = null;
let onRemoveCallback: RemoveCallback | null = null;

function showSettings() {
  if (!settingsPanel) {
    settingsPanel = createSettingsPanel();
  }
  if (!floatBtn) return;

  const rect = floatBtn.getBoundingClientRect();
  const panelWidth = 220;
  let left = rect.left - panelWidth - 10;
  if (left < 10) left = rect.right + 10;

  let top = rect.top;
  if (top + 200 > window.innerHeight) {
    top = window.innerHeight - 210;
  }
  if (top < 10) top = 10;

  settingsPanel.style.left = `${left}px`;
  settingsPanel.style.top = `${top}px`;
  settingsPanel.classList.add("visible");
}

function hideSettings() {
  settingsPanel?.classList.remove("visible");
}

function handleMouseDown(e: MouseEvent) {
  if (e.button !== 0) return;
  isDragging = false;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  const rect = floatBtn!.getBoundingClientRect();
  btnStartX = rect.left;
  btnStartY = rect.top;

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
}

function handleMouseMove(e: MouseEvent) {
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;

  if (!isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
    isDragging = true;
    hideSettings();
  }

  if (isDragging) {
    const newLeft = Math.max(0, Math.min(window.innerWidth - 48, btnStartX + dx));
    const newTop = Math.max(0, Math.min(window.innerHeight - 48, btnStartY + dy));
    floatBtn!.style.left = `${newLeft}px`;
    floatBtn!.style.top = `${newTop}px`;
    floatBtn!.style.right = "auto";
    floatBtn!.style.bottom = "auto";
  }
}

function handleMouseUp() {
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);

  if (!isDragging) {
    if (onTranslateCallback) onTranslateCallback(currentTargetLang);
  } else {
    snapToEdge();
  }
}

function snapToEdge() {
  if (!floatBtn) return;
  const rect = floatBtn.getBoundingClientRect();
  const btnW = rect.width;
  const winW = window.innerWidth;

  if (rect.left < EDGE_THRESHOLD) {
    // Snap to left edge, hide left half
    floatBtn.style.left = `${-btnW / 2}px`;
    floatBtn.style.right = "auto";
    floatBtn.classList.add("edge-hidden");
    isEdgeHidden = true;
    edgeSide = "left";
  } else if (rect.right > winW - EDGE_THRESHOLD) {
    // Snap to right edge, hide right half
    floatBtn.style.left = `${winW - btnW / 2}px`;
    floatBtn.style.right = "auto";
    floatBtn.classList.add("edge-hidden");
    isEdgeHidden = true;
    edgeSide = "right";
  } else {
    floatBtn.classList.remove("edge-hidden");
    isEdgeHidden = false;
    edgeSide = null;
  }
}

function slideOut() {
  if (!floatBtn || !isEdgeHidden) return;
  const rect = floatBtn.getBoundingClientRect();
  const btnW = rect.width;

  if (edgeSide === "left") {
    floatBtn.style.left = "0px";
  } else if (edgeSide === "right") {
    floatBtn.style.left = `${window.innerWidth - btnW}px`;
  }
  floatBtn.classList.remove("edge-hidden");
}

function slideBack() {
  if (!floatBtn || !isEdgeHidden) return;
  const btnW = floatBtn.getBoundingClientRect().width;

  if (edgeSide === "left") {
    floatBtn.style.left = `${-btnW / 2}px`;
  } else if (edgeSide === "right") {
    floatBtn.style.left = `${window.innerWidth - btnW / 2}px`;
  }
  floatBtn.classList.add("edge-hidden");
}

function handleMouseEnter() {
  if (isDragging) return;
  if (isEdgeHidden) {
    slideOut();
  }
  hoverTimeout = setTimeout(() => showSettings(), 300);
}

function handleMouseLeave() {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
  }
  setTimeout(() => {
    if (!settingsPanel?.matches(":hover") && !floatBtn?.matches(":hover")) {
      hideSettings();
      if (isEdgeHidden) {
        slideBack();
      }
    }
  }, 200);
}

export function createFloatingButton(
  onTranslate: TranslateCallback,
  onRemove: RemoveCallback
) {
  loadSettings();
  onTranslateCallback = onTranslate;
  onRemoveCallback = onRemove;

  floatBtn = document.createElement("div");
  floatBtn.className = "imm-float-btn";
  floatBtn.innerHTML = TRANSLATE_SVG;
  floatBtn.title = "点击翻译 | 悬停设置";
  floatBtn.style.opacity = String(currentOpacity);

  floatBtn.addEventListener("mousedown", handleMouseDown);
  floatBtn.addEventListener("mouseenter", handleMouseEnter);
  floatBtn.addEventListener("mouseleave", handleMouseLeave);

  document.documentElement.appendChild(floatBtn);

  createProgressBar();
}

export function setFloatingButtonTranslating(isTranslating: boolean) {
  if (!floatBtn) return;
  if (isTranslating) {
    floatBtn.classList.add("translating");
  } else {
    floatBtn.classList.remove("translating");
  }
}

export function getTargetLang(): string {
  return currentTargetLang;
}

export function getShortcut(): string {
  return currentShortcut;
}

export function setupKeyboardShortcut(onTranslate: TranslateCallback) {
  document.addEventListener("keydown", (e) => {
    const parts: string[] = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    if (e.metaKey) parts.push("Meta");
    if (!["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
      parts.push(e.key.toUpperCase());
    }
    const pressed = parts.join("+");

    if (pressed === currentShortcut) {
      e.preventDefault();
      onTranslate(currentTargetLang);
    }
  });
}
