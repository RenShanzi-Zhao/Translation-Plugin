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
    <label class="imm-setting-label">目标语言</label>
    <select id="imm-lang-select">
      <option value="zh-CN">英文 -> 中文</option>
      <option value="en">中文 -> 英文</option>
    </select>
    <label class="imm-setting-label">透明度 <span id="imm-opacity-val">${Math.round(state.opacity * 100)}%</span></label>
    <input type="range" min="20" max="100" value="${Math.round(state.opacity * 100)}" id="imm-opacity-slider" style="width:100%;margin:4px 0" />
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
    <div class="imm-btn-row" style="margin-top:4px">
      <button class="imm-action-btn imm-vocab-btn" id="imm-panel-vocab">📚 词汇库</button>
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

  shortcutInput.addEventListener("keydown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const shortcut = formatShortcutFromKeyboardEvent(e);
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
  vocabBtn.addEventListener("click", () => {
    const url = chrome.runtime.getURL("options/vocabulary.html");
    window.open(url, "_blank");
  });

  panel.addEventListener("mousedown", (e) => e.stopPropagation());
  panel.addEventListener("click", (e) => e.stopPropagation());

  return panel;
}
