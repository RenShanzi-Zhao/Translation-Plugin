import { sendToBackground } from "../../shared/messaging";
import { formatShortcutFromKeyboardEvent } from "./floatingShortcut";

export type FloatingSettingsState = {
  targetLang: string;
  shortcut: string;
  opacity: number;
  icon: string | null;
};

type SettingsCallbacks = {
  onTranslate: () => void;
  onRemove: () => void;
  onStateChange: () => void;
  applyIcon: () => void;
  getButton: () => HTMLDivElement | null;
  isSemiHidden: () => boolean;
};

const STORAGE_KEY = "imm-settings";

export async function loadSettings(defaults: FloatingSettingsState): Promise<FloatingSettingsState> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const saved = result[STORAGE_KEY];
    if (!saved) {
      return defaults;
    }

    return {
      targetLang: saved.targetLang || defaults.targetLang,
      shortcut: saved.shortcut || defaults.shortcut,
      opacity: typeof saved.opacity === "number" ? saved.opacity : defaults.opacity,
      icon: saved.icon || defaults.icon,
    };
  } catch {
    return defaults;
  }
}

export async function saveSettings(state: FloatingSettingsState) {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
  } catch {}
}

export function createSettingsPanel(
  state: FloatingSettingsState,
  callbacks: SettingsCallbacks
): HTMLDivElement {
  const panel = document.createElement("div");
  panel.className = "imm-settings-panel";

  panel.innerHTML = `
    <p class="imm-settings-panel-eyebrow">Reading Surface</p>
    <h2 class="imm-settings-panel-title">翻译设置</h2>
    <p class="imm-settings-panel-subtitle">保持页面内阅读节奏，只在需要时轻量调整翻译体验。</p>

    <div class="imm-settings-section">
      <label class="imm-setting-label">目标语言</label>
      <select id="imm-lang-select">
        <option value="zh-CN">英文 -> 中文</option>
        <option value="en">中文 -> 英文</option>
      </select>
    </div>

    <div class="imm-settings-section">
      <label class="imm-setting-label">按钮透明度 <span id="imm-opacity-val">${Math.round(state.opacity * 100)}%</span></label>
      <div class="imm-slider-wrap">
        <input type="range" min="20" max="100" value="${Math.round(state.opacity * 100)}" id="imm-opacity-slider" />
      </div>
    </div>

    <div class="imm-settings-section">
      <label class="imm-setting-label">自定义图标</label>
      <div class="imm-inline-actions">
        <label class="imm-surface-btn imm-file-label">
          选择图片
          <input type="file" accept="image/*" id="imm-icon-input" style="display:none" />
        </label>
        <button id="imm-icon-reset" class="imm-surface-btn imm-quiet-btn" type="button">恢复默认</button>
      </div>
    </div>

    <div class="imm-settings-section">
      <label class="imm-setting-label">快捷键</label>
      <input type="text" class="imm-shortcut-input imm-surface-field" id="imm-shortcut-input" readonly />
    </div>

    <div class="imm-btn-row">
      <button class="imm-surface-btn imm-primary-btn" id="imm-panel-translate" type="button">开始翻译</button>
      <button class="imm-surface-btn imm-secondary-btn" id="imm-panel-remove" type="button">移除译文</button>
    </div>

    <div class="imm-btn-row">
      <button class="imm-surface-btn imm-quiet-btn" id="imm-panel-vocab" type="button">打开个人词汇库</button>
    </div>
  `;

  document.documentElement.appendChild(panel);

  const langSelect = panel.querySelector("#imm-lang-select") as HTMLSelectElement;
  const shortcutInput = panel.querySelector("#imm-shortcut-input") as HTMLInputElement;
  const translateBtn = panel.querySelector("#imm-panel-translate") as HTMLButtonElement;
  const removeBtn = panel.querySelector("#imm-panel-remove") as HTMLButtonElement;
  const iconInput = panel.querySelector("#imm-icon-input") as HTMLInputElement;
  const iconReset = panel.querySelector("#imm-icon-reset") as HTMLButtonElement;
  const opacitySlider = panel.querySelector("#imm-opacity-slider") as HTMLInputElement;
  const opacityVal = panel.querySelector("#imm-opacity-val") as HTMLSpanElement;

  langSelect.value = state.targetLang;
  shortcutInput.value = state.shortcut;

  langSelect.addEventListener("change", () => {
    state.targetLang = langSelect.value;
    callbacks.onStateChange();
  });

  opacitySlider.addEventListener("input", () => {
    state.opacity = parseInt(opacitySlider.value, 10) / 100;
    opacityVal.textContent = `${opacitySlider.value}%`;
    if (callbacks.getButton() && !callbacks.isSemiHidden()) {
      callbacks.getButton()!.style.opacity = String(state.opacity);
    }
    callbacks.onStateChange();
  });

  iconInput.addEventListener("change", () => {
    const file = iconInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.icon = reader.result as string;
      callbacks.applyIcon();
      callbacks.onStateChange();
    };
    reader.readAsDataURL(file);
  });

  iconReset.addEventListener("click", () => {
    state.icon = null;
    callbacks.applyIcon();
    callbacks.onStateChange();
  });

  shortcutInput.addEventListener("keydown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const shortcut = formatShortcutFromKeyboardEvent(event);
    if (shortcut.split("+").length >= 2) {
      state.shortcut = shortcut;
      shortcutInput.value = shortcut;
      callbacks.onStateChange();
    }
  });

  translateBtn.addEventListener("click", () => {
    callbacks.onTranslate();
  });

  removeBtn.addEventListener("click", () => {
    callbacks.onRemove();
  });

  const vocabBtn = panel.querySelector("#imm-panel-vocab") as HTMLButtonElement;
  vocabBtn.addEventListener("click", async () => {
    try {
      await sendToBackground({ type: "OPEN_VOCABULARY_PAGE" });
    } catch (error) {
      console.error("Failed to open vocabulary page", error);
    }
  });

  panel.addEventListener("mousedown", (event) => event.stopPropagation());
  panel.addEventListener("click", (event) => event.stopPropagation());

  return panel;
}
