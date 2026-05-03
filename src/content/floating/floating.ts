import {
  loadSettings,
  type FloatingSettingsState,
} from "./floatingSettings";
import {
  createProgressBar,
  updateProgress,
  markProgressDone,
} from "./floatingProgress";
import { setupKeyboardShortcut as registerKeyboardShortcut } from "./floatingShortcut";
import { createFloatingButtonController } from "./floatingButtonController";
import { createFloatingOverlayController } from "./floatingOverlayController";

export type TranslateCallback = (targetLang: string) => void;
export type RemoveCallback = () => void;

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

const buttonController = createFloatingButtonController({
  settingsState,
  translateSvg: TRANSLATE_SVG,
  onTranslate: () => {
    onTranslateCallback?.(settingsState.targetLang);
  },
  onDragStart: () => {
    overlayController.hideSettings();
    overlayController.hideGear();
  },
  onHoverVisible: () => {
    overlayController.showGear();
  },
  onHoverLeave: () => {
    overlayController.handleInteractionDismiss();
  },
});

const overlayController = createFloatingOverlayController({
  settingsState,
  gearSvg: GEAR_SVG,
  getButton: buttonController.getButton,
  isSemiHidden: buttonController.isSemiHidden,
  isAnimating: buttonController.isAnimating,
  semiHide: buttonController.semiHide,
  applyIcon: buttonController.applyIcon,
  onTranslate: () => {
    onTranslateCallback?.(settingsState.targetLang);
  },
  onRemove: () => {
    onRemoveCallback?.();
  },
});

export async function createFloatingButton(onTranslate: TranslateCallback, onRemove: RemoveCallback) {
  onTranslateCallback = onTranslate;
  onRemoveCallback = onRemove;

  const saved = await loadSettings(settingsState);
  Object.assign(settingsState, saved);

  buttonController.createButton();
  overlayController.attachDocumentClick();
  createProgressBar();
}

export function setFloatingButtonTranslating(isTranslating: boolean) {
  buttonController.setTranslating(isTranslating);
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
