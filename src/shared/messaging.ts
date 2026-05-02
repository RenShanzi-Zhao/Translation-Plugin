import type {
  PopupMessage,
  ContentToBgMessage,
  BgResponse,
  BgToContentMessage,
  RuntimeErrorResponse,
} from "./types";

type MessageHandler<TMessage, TResponse> = (
  message: TMessage,
  sender: chrome.runtime.MessageSender
) => Promise<TResponse> | TResponse | void;

export function sendToContent(tabId: number, message: PopupMessage): Promise<void> {
  return chrome.tabs.sendMessage(tabId, message);
}

export function sendToBackground(message: ContentToBgMessage): Promise<BgResponse> {
  return chrome.runtime.sendMessage(message);
}

export function onMessage<TMessage extends PopupMessage | ContentToBgMessage, TResponse extends BgToContentMessage | RuntimeErrorResponse | { type: "PONG" }>(
  handler: MessageHandler<TMessage, TResponse>
) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const result = handler(message as TMessage, sender);
    if (result instanceof Promise) {
      result
        .then(sendResponse)
        .catch((err: Error) => sendResponse({ error: { message: err.message } }));
      return true;
    }

    if (result !== undefined) {
      sendResponse(result);
    }

    return false;
  });
}
