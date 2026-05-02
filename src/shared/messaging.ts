import type { PopupMessage, ContentToBgMessage, BgToContentMessage } from "./types";

export function sendToContent(tabId: number, message: PopupMessage): Promise<void> {
  return chrome.tabs.sendMessage(tabId, message);
}

export function sendToBackground(message: ContentToBgMessage): Promise<any> {
  return chrome.runtime.sendMessage(message);
}

export function onMessage<T extends PopupMessage | ContentToBgMessage | BgToContentMessage>(
  handler: (message: T, sender: chrome.runtime.MessageSender) => Promise<any> | void
) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const result = handler(message as T, sender);
    if (result instanceof Promise) {
      result.then(sendResponse).catch((err) => sendResponse({ error: err.message }));
      return true;
    }
  });
}
