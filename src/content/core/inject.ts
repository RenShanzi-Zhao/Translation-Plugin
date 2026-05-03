import {
  TRANSLATED_ATTR,
  TRANSLATION_FOR_ATTR,
  TRANSLATION_BLOCK_CLASS,
  FAILED_CLASS,
} from "../../shared/constants";
import type { TranslationResult } from "../../shared/types";

export function insertPendingBlock(itemId: string, nodeMap: Map<string, HTMLElement>) {
  const originalNode = nodeMap.get(itemId);
  if (!originalNode) return;

  const existing = document.querySelector(`[${TRANSLATION_FOR_ATTR}="${itemId}"]`);
  if (existing) return;

  const pendingBlock = document.createElement("div");
  pendingBlock.className = `${TRANSLATION_BLOCK_CLASS} imm-translation-pending`;
  pendingBlock.setAttribute(TRANSLATION_FOR_ATTR, itemId);
  pendingBlock.textContent = "翻译官正在路上...";

  originalNode.parentNode?.insertBefore(pendingBlock, originalNode.nextSibling);
}

export function injectTranslations(results: TranslationResult[], nodeMap: Map<string, HTMLElement>) {
  for (const result of results) {
    const originalNode = nodeMap.get(result.id);
    if (!originalNode) continue;

    if (originalNode.hasAttribute(TRANSLATED_ATTR)) continue;

    let translationBlock = document.querySelector(`[${TRANSLATION_FOR_ATTR}="${result.id}"]`) as HTMLElement | null;

    if (!translationBlock) {
      translationBlock = document.createElement("div");
      translationBlock.className = TRANSLATION_BLOCK_CLASS;
      translationBlock.setAttribute(TRANSLATION_FOR_ATTR, result.id);
      originalNode.parentNode?.insertBefore(translationBlock, originalNode.nextSibling);
    }

    if (result.translatedText) {
      translationBlock.textContent = result.translatedText;
      translationBlock.classList.remove("imm-translation-pending");
    } else {
      translationBlock.textContent = "[翻译失败]";
      translationBlock.classList.add(FAILED_CLASS);
      translationBlock.classList.remove("imm-translation-pending");
    }

    originalNode.setAttribute(TRANSLATED_ATTR, "1");
  }
}

export function markBatchFailed(items: { id: string }[], nodeMap: Map<string, HTMLElement>) {
  for (const item of items) {
    const originalNode = nodeMap.get(item.id);
    if (!originalNode || originalNode.hasAttribute(TRANSLATED_ATTR)) continue;

    let failedBlock = document.querySelector(`[${TRANSLATION_FOR_ATTR}="${item.id}"]`) as HTMLElement | null;

    if (!failedBlock) {
      failedBlock = document.createElement("div");
      failedBlock.className = `${TRANSLATION_BLOCK_CLASS} ${FAILED_CLASS}`;
      failedBlock.setAttribute(TRANSLATION_FOR_ATTR, item.id);
      originalNode.parentNode?.insertBefore(failedBlock, originalNode.nextSibling);
    }

    failedBlock.textContent = "[翻译失败]";
    failedBlock.classList.add(FAILED_CLASS);
    failedBlock.classList.remove("imm-translation-pending");
    originalNode.setAttribute(TRANSLATED_ATTR, "1");
  }
}

export function removeAllTranslations() {
  const blocks = document.querySelectorAll(`.${TRANSLATION_BLOCK_CLASS}`);
  blocks.forEach((block) => block.remove());

  const translated = document.querySelectorAll(`[${TRANSLATED_ATTR}]`);
  translated.forEach((el) => el.removeAttribute(TRANSLATED_ATTR));
}

export function hasExistingTranslations(): boolean {
  return document.querySelectorAll(`[${TRANSLATED_ATTR}]`).length > 0;
}

export function replaceTranslationsDirectly(results: TranslationResult[], nodeMap: Map<string, HTMLElement>) {
  for (const result of results) {
    const el = nodeMap.get(result.id);
    if (!el || el.hasAttribute(TRANSLATED_ATTR)) continue;

    if (result.translatedText) {
      el.textContent = result.translatedText;
    }
    el.setAttribute(TRANSLATED_ATTR, "1");
  }
}
