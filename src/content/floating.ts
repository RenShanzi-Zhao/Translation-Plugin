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

function loadSettings() {
  try {
    const saved = localStorage.getItem("imm-settings");
    if (saved) {
      const s = JSON.parse(saved);
      if (s.targetLang) currentTargetLang = s.targetLang;
      if (s.shortcut) currentShortcut = s.shortcut;
    }
  } catch {}
}

function saveSettings() {
  try {
    localStorage.setItem("imm-settings", JSON.stringify({
      targetLang: currentTargetLang,
      shortcut: currentShortcut,
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

  langSelect.addEventListener("change", () => {
    currentTargetLang = langSelect.value;
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
  }
}

function handleMouseEnter() {
  if (isDragging) return;
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
  floatBtn.textContent = "译";
  floatBtn.title = "点击翻译 | 悬停设置";

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
