import {
  clearStoredRuntimeConfig,
  loadStoredRuntimeConfig,
  saveStoredRuntimeConfig,
} from "../shared/config";

const form = document.getElementById("config-form") as HTMLFormElement;
const apiBaseUrlInput = document.getElementById("api-base-url") as HTMLInputElement;
const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
const modelInput = document.getElementById("model") as HTMLInputElement;
const clearButton = document.getElementById("clear-config") as HTMLButtonElement;
const testConnectionButton = document.getElementById("test-connection") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLParagraphElement;

function setStatus(message: string, kind: "success" | "error" | "idle" = "idle") {
  statusEl.textContent = message;
  statusEl.className = `status${kind === "idle" ? "" : ` ${kind}`}`;
}

async function hydrateForm() {
  const config = await loadStoredRuntimeConfig();
  apiBaseUrlInput.value = config.apiBaseUrl || "";
  apiKeyInput.value = config.apiKey || "";
  modelInput.value = config.model || "gpt-4o-mini";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  await saveStoredRuntimeConfig({
    apiBaseUrl: apiBaseUrlInput.value.trim(),
    apiKey: apiKeyInput.value.trim(),
    model: modelInput.value.trim() || "gpt-4o-mini",
  });

  setStatus("配置已保存。后续翻译请求会优先使用这里的设置。", "success");
});

testConnectionButton.addEventListener("click", async () => {
  setStatus("正在测试连接...", "idle");

  const response = await chrome.runtime.sendMessage({
    type: "TEST_CONNECTION",
    config: {
      apiBaseUrl: apiBaseUrlInput.value.trim(),
      apiKey: apiKeyInput.value.trim(),
      model: modelInput.value.trim() || "gpt-4o-mini",
    },
  });

  if (response?.type === "TEST_CONNECTION_RESULT" && response.ok) {
    setStatus("连接测试成功。当前配置可用。", "success");
    return;
  }

  if (response?.type === "TEST_CONNECTION_RESULT") {
    setStatus(`连接测试失败：${response.message}`, "error");
    return;
  }

  setStatus("连接测试失败，请稍后重试。", "error");
});

clearButton.addEventListener("click", async () => {
  await clearStoredRuntimeConfig();
  apiBaseUrlInput.value = "";
  apiKeyInput.value = "";
  modelInput.value = "gpt-4o-mini";
  setStatus("已清空存储配置。开发环境下会回退到本地 .env。", "success");
});

void hydrateForm().catch(() => {
  setStatus("加载配置失败，请刷新后重试。", "error");
});
