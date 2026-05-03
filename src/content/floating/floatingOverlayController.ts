import {
  createSettingsPanel,
  saveSettings,
  type FloatingSettingsState,
} from "./floatingSettings";

type OverlayControllerOptions = {
  settingsState: FloatingSettingsState;
  gearSvg: string;
  getButton: () => HTMLDivElement | null;
  isSemiHidden: () => boolean;
  isAnimating: () => boolean;
  semiHide: () => void;
  applyIcon: () => void;
  onTranslate: () => void;
  onRemove: () => void;
};

export type FloatingOverlayController = {
  showGear: () => void;
  hideGear: () => void;
  hideSettings: () => void;
  handleInteractionDismiss: () => void;
  attachDocumentClick: () => void;
};

export function createFloatingOverlayController(
  options: OverlayControllerOptions
): FloatingOverlayController {
  let settingsGear: HTMLDivElement | null = null;
  let settingsPanel: HTMLDivElement | null = null;

  function persistSettings() {
    saveSettings(options.settingsState);
  }

  function positionGear() {
    const button = options.getButton();
    if (!button || !settingsGear) return;
    const rect = button.getBoundingClientRect();
    settingsGear.style.left = `${rect.left + rect.width / 2 - 14}px`;
    settingsGear.style.top = `${rect.bottom + 6}px`;
  }

  function hideSettings() {
    settingsPanel?.classList.remove("visible");
  }

  function showSettings() {
    const panel = ensureSettingsPanel();
    const button = options.getButton();
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const panelWidth = 220;
    let left = rect.left + rect.width / 2 - panelWidth / 2;
    if (left < 10) left = 10;
    if (left + panelWidth > window.innerWidth - 10) {
      left = window.innerWidth - panelWidth - 10;
    }

    let top = rect.bottom + 40;
    if (top + 240 > window.innerHeight) {
      top = rect.top - 250;
    }
    if (top < 10) top = 10;

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.classList.add("visible");
  }

  function toggleSettings() {
    if (settingsPanel?.classList.contains("visible")) {
      hideSettings();
    } else {
      showSettings();
    }
  }

  function createSettingsGear() {
    if (settingsGear) return;
    settingsGear = document.createElement("div");
    settingsGear.className = "imm-settings-gear";
    settingsGear.innerHTML = options.gearSvg;
    settingsGear.title = "璁剧疆";
    settingsGear.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSettings();
    });
    settingsGear.addEventListener("mousedown", (e) => e.stopPropagation());
    settingsGear.addEventListener("mouseleave", () => {
      setTimeout(() => {
        if (options.isAnimating()) return;
        handleInteractionDismiss();
      }, 100);
    });
    document.documentElement.appendChild(settingsGear);
  }

  function ensureSettingsPanel() {
    if (settingsPanel) {
      return settingsPanel;
    }

    settingsPanel = createSettingsPanel(options.settingsState, {
      onTranslate: () => {
        hideSettings();
        options.onTranslate();
      },
      onRemove: () => {
        hideSettings();
        options.onRemove();
      },
      onStateChange: persistSettings,
      applyIcon: options.applyIcon,
      getButton: options.getButton,
      isSemiHidden: options.isSemiHidden,
    });

    return settingsPanel;
  }

  function showGear() {
    createSettingsGear();
    positionGear();
    settingsGear?.classList.add("visible");
  }

  function hideGear() {
    settingsGear?.classList.remove("visible");
  }

  function handleInteractionDismiss() {
    const button = options.getButton();
    const overBtn = button?.matches(":hover") ?? false;
    const overGear = settingsGear?.matches(":hover") ?? false;
    const overPanel = settingsPanel?.matches(":hover") ?? false;

    if (!overBtn && !overGear && !overPanel) {
      hideGear();
      hideSettings();
      if (options.isSemiHidden()) {
        options.semiHide();
      }
    }
  }

  function handleDocumentClick() {
    hideSettings();
    const button = options.getButton();
    if (!button?.matches(":hover")) {
      hideGear();
      if (options.isSemiHidden()) {
        options.semiHide();
      }
    }
  }

  function attachDocumentClick() {
    document.addEventListener("click", handleDocumentClick);
  }

  return {
    showGear,
    hideGear,
    hideSettings,
    handleInteractionDismiss,
    attachDocumentClick,
  };
}
