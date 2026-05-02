const translateBtn = document.getElementById("translateBtn") as HTMLButtonElement;
const removeBtn = document.getElementById("removeBtn") as HTMLButtonElement;
const targetLangSelect = document.getElementById("targetLang") as HTMLSelectElement;
const statusEl = document.getElementById("status") as HTMLDivElement;

function setStatus(text: string, type?: "error" | "done" | "translating") {
  statusEl.textContent = text;
  statusEl.className = "status" + (type ? ` ${type}` : "");
}

async function getCurrentTabId(): Promise<number | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id ?? null;
}

translateBtn.addEventListener("click", async () => {
  const tabId = await getCurrentTabId();
  if (!tabId) return;

  const targetLang = targetLangSelect.value;
  translateBtn.disabled = true;
  setStatus("翻译中...", "translating");

  chrome.tabs.sendMessage(tabId, {
    type: "START_TRANSLATE",
    targetLang,
  });
});

removeBtn.addEventListener("click", async () => {
  const tabId = await getCurrentTabId();
  if (!tabId) return;

  chrome.tabs.sendMessage(tabId, { type: "REMOVE_TRANSLATION" });
  setStatus("已移除译文", "done");
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "TRANSLATE_STATUS") {
    switch (message.status) {
      case "translating":
        setStatus(`翻译中 (${message.done}/${message.total})...`, "translating");
        break;
      case "done":
        setStatus("翻译完成", "done");
        translateBtn.disabled = false;
        break;
      case "error":
        setStatus(message.message || "翻译失败", "error");
        translateBtn.disabled = false;
        break;
      case "removed":
        setStatus("已移除译文", "done");
        break;
    }
  }
});
