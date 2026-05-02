export type TranslateCallback = (targetLang: string) => void;
export type RemoveCallback = () => void;

let floatBtn: HTMLDivElement | null = null;
let settingsGear: HTMLDivElement | null = null;
let settingsPanel: HTMLDivElement | null = null;
let progressBar: HTMLDivElement | null = null;
let progressBarInner: HTMLDivElement | null = null;
let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let btnStartX = 0;
let btnStartY = 0;
let hasMoved = false;
let isSemiHidden = true;
let hideSide: "left" | "right" = "left";
let isAnimating = false;

let currentTargetLang = "zh-CN";
let currentShortcut = "Ctrl+Shift+A";
let currentOpacity = 0.6;
let currentIcon: string | null = null;

const TRANSLATE_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 5h12M9 3v2m1.048 3.5A18.024 18.024 0 003.186 13m2.87-5.5a18.02 18.02 0 005.89 8.243M12 21l3.75-7.5L19.5 21M14.25 18h5.25" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const GEAR_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="2"/>
  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="2"/>
</svg>`;

// ─── Settings persistence ───

function loadSettings() {
  try {
    const saved = localStorage.getItem("imm-settings");
    if (saved) {
      const s = JSON.parse(saved);
      if (s.targetLang) currentTargetLang = s.targetLang;
      if (s.shortcut) currentShortcut = s.shortcut;
      if (typeof s.opacity === "number") currentOpacity = s.opacity;
      if (s.icon) currentIcon = s.icon;
    }
  } catch {}
}

function saveSettings() {
  try {
    localStorage.setItem("imm-settings", JSON.stringify({
      targetLang: currentTargetLang,
      shortcut: currentShortcut,
      opacity: currentOpacity,
      icon: currentIcon,
    }));
  } catch {}
}

// ─── Icon ───

function applyIcon() {
  if (!floatBtn) return;
  if (currentIcon) {
    floatBtn.innerHTML = "";
    floatBtn.style.backgroundImage = `url(${currentIcon})`;
    floatBtn.style.backgroundSize = "cover";
    floatBtn.style.backgroundPosition = "center";
  } else {
    floatBtn.innerHTML = TRANSLATE_SVG;
    floatBtn.style.backgroundImage = "none";
  }
}

// ─── Progress bar ───

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

function getViewportW(): number {
  return document.documentElement.clientWidth;
}

function animateLeft(from: number, to: number, duration: number, onDone?: () => void) {
  if (!floatBtn) return;
  const startTime = performance.now();

  function frame(time: number) {
    if (!floatBtn) return;
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    floatBtn.style.left = `${from + (to - from) * eased}px`;

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      floatBtn.style.left = `${to}px`;
      onDone?.();
    }
  }

  isAnimating = true;
  requestAnimationFrame(frame);
}

// ─── Semi-hide behavior ───

function semiHide() {
  if (!floatBtn || !isSemiHidden) return;
  const btnW = 48;
  const current = parseFloat(floatBtn.style.left) || 6;
  const target = hideSide === "right" ? getViewportW() - btnW * 0.3 : -btnW * 0.7;
  animateLeft(current, target, 250, () => { isAnimating = false; });
  floatBtn.style.opacity = String(currentOpacity);
}

function slideOut() {
  if (!floatBtn) return;
  const btnW = 48;
  const current = parseFloat(floatBtn.style.left) || -btnW * 0.7;
  const target = hideSide === "right" ? getViewportW() - btnW - 6 : 6;
  animateLeft(current, target, 250, () => { updateGearPosition(); });
  floatBtn.style.right = "auto";
  floatBtn.style.opacity = "1";
}

// ─── Settings gear icon ───

function createSettingsGear() {
  if (settingsGear) return;
  settingsGear = document.createElement("div");
  settingsGear.className = "imm-settings-gear";
  settingsGear.innerHTML = GEAR_SVG;
  settingsGear.title = "设置";
  settingsGear.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleSettings();
  });
  settingsGear.addEventListener("mousedown", (e) => e.stopPropagation());
  document.documentElement.appendChild(settingsGear);
}

function positionGear() {
  if (!floatBtn || !settingsGear) return;
  const rect = floatBtn.getBoundingClientRect();
  settingsGear.style.left = `${rect.left + rect.width / 2 - 14}px`;
  settingsGear.style.top = `${rect.bottom + 6}px`;
}

function showGear() {
  createSettingsGear();
  positionGear();
  settingsGear?.classList.add("visible");
}

function hideGear() {
  settingsGear?.classList.remove("visible");
}

// ─── Settings panel ───

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
    <label class="imm-setting-label">自定义图标</label>
    <div style="display:flex;gap:6px;align-items:center">
      <label style="font-size:11px;padding:4px 8px;background:#f1f3f4;border-radius:4px;cursor:pointer;display:inline-block">
        选择图片
        <input type="file" accept="image/*" id="imm-icon-input" style="display:none" />
      </label>
      <button id="imm-icon-reset" style="font-size:11px;padding:4px 8px;background:none;border:1px solid #ddd;border-radius:4px;cursor:pointer">恢复默认</button>
    </div>
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
  const iconInput = panel.querySelector("#imm-icon-input") as HTMLInputElement;
  const iconReset = panel.querySelector("#imm-icon-reset") as HTMLButtonElement;

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
    if (floatBtn && !isSemiHidden) {
      floatBtn.style.opacity = String(currentOpacity);
    }
    saveSettings();
  });

  iconInput.addEventListener("change", () => {
    const file = iconInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      currentIcon = reader.result as string;
      applyIcon();
      saveSettings();
    };
    reader.readAsDataURL(file);
  });

  iconReset.addEventListener("click", () => {
    currentIcon = null;
    applyIcon();
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

  // Prevent clicks inside panel from bubbling
  panel.addEventListener("mousedown", (e) => e.stopPropagation());
  panel.addEventListener("click", (e) => e.stopPropagation());

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
  let left = rect.left + rect.width / 2 - panelWidth / 2;
  if (left < 10) left = 10;
  if (left + panelWidth > window.innerWidth - 10) left = window.innerWidth - panelWidth - 10;

  let top = rect.bottom + 40;
  if (top + 240 > window.innerHeight) {
    top = rect.top - 250;
  }
  if (top < 10) top = 10;

  settingsPanel.style.left = `${left}px`;
  settingsPanel.style.top = `${top}px`;
  settingsPanel.classList.add("visible");
}

function hideSettings() {
  settingsPanel?.classList.remove("visible");
}

function toggleSettings() {
  if (settingsPanel?.classList.contains("visible")) {
    hideSettings();
  } else {
    showSettings();
  }
}

// ─── Close on outside click ───

function handleDocumentClick() {
  hideSettings();
  // Check if mouse is still over button — if not, return to semi-hide
  if (!floatBtn?.matches(":hover")) {
    hideGear();
    if (isSemiHidden) {
      semiHide();
    }
  }
}

// ─── Drag & interaction ───

function handleMouseDown(e: MouseEvent) {
  if (e.button !== 0) return;
  isDragging = false;
  hasMoved = false;
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
    hasMoved = true;
    hideSettings();
    hideGear();
    isSemiHidden = false;
  }

  if (isDragging) {
    const vw = getViewportW();
    const newLeft = Math.max(0, Math.min(vw - 48, btnStartX + dx));
    const newTop = Math.max(0, Math.min(window.innerHeight - 48, btnStartY + dy));
    floatBtn!.style.left = `${newLeft}px`;
    floatBtn!.style.top = `${newTop}px`;
    floatBtn!.style.right = "auto";
    floatBtn!.style.bottom = "auto";
    floatBtn!.style.opacity = "1";
  }
}

function handleMouseUp() {
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);

  if (!hasMoved) {
    // Click — translate
    if (onTranslateCallback) onTranslateCallback(currentTargetLang);
  } else {
    // After drag — check if near either edge to re-enable semi-hide
    const vw = getViewportW();
    const rect = floatBtn!.getBoundingClientRect();
    if (rect.left < 20) {
      hideSide = "left";
      isSemiHidden = true;
      semiHide();
    } else if (rect.right > vw - 20) {
      hideSide = "right";
      isSemiHidden = true;
      semiHide();
    } else {
      isSemiHidden = false;
    }
  }
}

function handleMouseEnter() {
  if (isDragging) return;
  if (isSemiHidden) {
    slideOut();
  }
  showGear();
}

function updateGearPosition() {
  positionGear();
}

function handleMouseLeave() {
  setTimeout(() => {
    if (isAnimating) return;
    const overBtn = floatBtn?.matches(":hover") ?? false;
    const overGear = settingsGear?.matches(":hover") ?? false;
    const overPanel = settingsPanel?.matches(":hover") ?? false;

    if (!overBtn && !overGear && !overPanel) {
      hideGear();
      hideSettings();
      if (isSemiHidden) {
        semiHide();
      }
    }
  }, 100);
}

function handleGearMouseLeave() {
  setTimeout(() => {
    if (isAnimating) return;
    const overBtn = floatBtn?.matches(":hover") ?? false;
    const overGear = settingsGear?.matches(":hover") ?? false;
    const overPanel = settingsPanel?.matches(":hover") ?? false;

    if (!overBtn && !overGear && !overPanel) {
      hideGear();
      hideSettings();
      if (isSemiHidden) {
        semiHide();
      }
    }
  }, 100);
}

// ─── Public API ───

export function createFloatingButton(
  onTranslate: TranslateCallback,
  onRemove: RemoveCallback
) {
  loadSettings();
  onTranslateCallback = onTranslate;
  onRemoveCallback = onRemove;

  floatBtn = document.createElement("div");
  floatBtn.className = "imm-float-btn";
  floatBtn.title = "点击翻译 | 悬停显示设置";
  applyIcon();

  floatBtn.addEventListener("mousedown", handleMouseDown);
  floatBtn.addEventListener("mouseenter", handleMouseEnter);
  floatBtn.addEventListener("mouseleave", handleMouseLeave);
  floatBtn.addEventListener("click", (e) => e.stopPropagation());

  document.documentElement.appendChild(floatBtn);

  // Start semi-hidden on left side
  isSemiHidden = true;
  hideSide = "left";
  semiHide();

  // Close settings on click outside
  document.addEventListener("click", handleDocumentClick);

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
