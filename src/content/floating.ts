import {
  createSettingsPanel,
  loadSettings,
  saveSettings,
  type FloatingSettingsState,
} from "./floatingSettings";
import {
  createProgressBar,
  updateProgress,
  markProgressDone,
} from "./floatingProgress";
import { setupKeyboardShortcut as registerKeyboardShortcut } from "./floatingShortcut";

export type TranslateCallback = (targetLang: string) => void;
export type RemoveCallback = () => void;

let floatBtn: HTMLDivElement | null = null;
let settingsGear: HTMLDivElement | null = null;
let settingsPanel: HTMLDivElement | null = null;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let btnStartX = 0;
let btnStartY = 0;
let hasMoved = false;
let isSemiHiddenValue = true;
let hideSide: "left" | "right" = "left";
let isAnimating = false;

let settingsState: FloatingSettingsState = {
  targetLang: "zh-CN",
  shortcut: "Ctrl+Shift+A",
  opacity: 0.6,
  icon: null,
};

let onTranslateCallback: TranslateCallback | null = null;
let onRemoveCallback: RemoveCallback | null = null;

const TRANSLATE_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 5h12M9 3v2m1.048 3.5A18.024 18.024 0 003.186 13m2.87-5.5a18.02 18.02 0 005.89 8.243M12 21l3.75-7.5L19.5 21M14.25 18h5.25" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const GEAR_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="2"/>
  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="2"/>
</svg>`;

function persistSettings() {
  saveSettings(settingsState);
}

function applyIcon() {
  if (!floatBtn) return;
  if (settingsState.icon) {
    floatBtn.innerHTML = "";
    floatBtn.style.backgroundImage = `url(${settingsState.icon})`;
    floatBtn.style.backgroundSize = "cover";
    floatBtn.style.backgroundPosition = "center";
  } else {
    floatBtn.innerHTML = TRANSLATE_SVG;
    floatBtn.style.backgroundImage = "none";
  }
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

function semiHide() {
  if (!floatBtn || !isSemiHiddenValue) return;
  const btnW = 48;
  const current = parseFloat(floatBtn.style.left) || 6;
  const target = hideSide === "right" ? getViewportW() - btnW * 0.3 : -btnW * 0.7;
  animateLeft(current, target, 250, () => {
    isAnimating = false;
  });
  floatBtn.style.opacity = String(settingsState.opacity);
}

function slideOut() {
  if (!floatBtn) return;
  const btnW = 48;
  const current = parseFloat(floatBtn.style.left) || -btnW * 0.7;
  const target = hideSide === "right" ? getViewportW() - btnW - 6 : 6;
  animateLeft(current, target, 250, () => {
    isAnimating = false;
    if (floatBtn?.matches(":hover")) {
      showGear();
    }
  });
  floatBtn.style.right = "auto";
  floatBtn.style.opacity = "1";
}

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
  settingsGear.addEventListener("mouseleave", handleGearMouseLeave);
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

function ensureSettingsPanel() {
  if (settingsPanel) {
    return settingsPanel;
  }

  settingsPanel = createSettingsPanel(settingsState, {
    onTranslate: () => {
      hideSettings();
      onTranslateCallback?.(settingsState.targetLang);
    },
    onRemove: () => {
      hideSettings();
      onRemoveCallback?.();
    },
    onStateChange: persistSettings,
    applyIcon,
    getButton: () => floatBtn,
    isSemiHidden: () => isSemiHiddenValue,
  });

  return settingsPanel;
}

function showSettings() {
  const panel = ensureSettingsPanel();
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

  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
  panel.classList.add("visible");
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

function handleDocumentClick() {
  hideSettings();
  if (!floatBtn?.matches(":hover")) {
    hideGear();
    if (isSemiHiddenValue) {
      semiHide();
    }
  }
}

function handleMouseDown(e: MouseEvent) {
  if (e.button !== 0 || !floatBtn) return;
  isDragging = false;
  hasMoved = false;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  const rect = floatBtn.getBoundingClientRect();
  btnStartX = rect.left;
  btnStartY = rect.top;

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
}

function handleMouseMove(e: MouseEvent) {
  if (!floatBtn) return;
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;

  if (!isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
    isDragging = true;
    hasMoved = true;
    hideSettings();
    hideGear();
    isSemiHiddenValue = false;
  }

  if (isDragging) {
    const vw = getViewportW();
    const newLeft = Math.max(0, Math.min(vw - 48, btnStartX + dx));
    const newTop = Math.max(0, Math.min(window.innerHeight - 48, btnStartY + dy));
    floatBtn.style.left = `${newLeft}px`;
    floatBtn.style.top = `${newTop}px`;
    floatBtn.style.right = "auto";
    floatBtn.style.bottom = "auto";
    floatBtn.style.opacity = "1";
  }
}

function handleMouseUp() {
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
  isDragging = false;

  if (!floatBtn) return;

  if (!hasMoved) {
    onTranslateCallback?.(settingsState.targetLang);
  } else {
    const vw = getViewportW();
    const rect = floatBtn.getBoundingClientRect();
    if (rect.left < 20) {
      hideSide = "left";
      isSemiHiddenValue = true;
      semiHide();
    } else if (rect.right > vw - 20) {
      hideSide = "right";
      isSemiHiddenValue = true;
      semiHide();
    } else {
      isSemiHiddenValue = false;
    }
  }
}

function handleMouseEnter() {
  if (isDragging) return;
  if (isSemiHiddenValue) {
    slideOut();
  }
  showGear();
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
      if (isSemiHiddenValue) {
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
      if (isSemiHiddenValue) {
        semiHide();
      }
    }
  }, 100);
}

export async function createFloatingButton(onTranslate: TranslateCallback, onRemove: RemoveCallback) {
  onTranslateCallback = onTranslate;
  onRemoveCallback = onRemove;

  const saved = await loadSettings(settingsState);
  Object.assign(settingsState, saved);

  floatBtn = document.createElement("div");
  floatBtn.className = "imm-float-btn";
  floatBtn.title = "点击翻译 | 悬停显示设置";
  applyIcon();

  floatBtn.addEventListener("mousedown", handleMouseDown);
  floatBtn.addEventListener("mouseenter", handleMouseEnter);
  floatBtn.addEventListener("mouseleave", handleMouseLeave);
  floatBtn.addEventListener("click", (e) => e.stopPropagation());

  document.documentElement.appendChild(floatBtn);

  isSemiHiddenValue = true;
  hideSide = "left";
  semiHide();

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
  return settingsState.targetLang;
}

export function getShortcut(): string {
  return settingsState.shortcut;
}

export function setupKeyboardShortcut(onTranslate: TranslateCallback) {
  registerKeyboardShortcut(getShortcut, onTranslate, getTargetLang);
}

export { updateProgress, markProgressDone };
