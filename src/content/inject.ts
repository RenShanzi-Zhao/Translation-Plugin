import {
  TRANSLATED_ATTR,
  TRANSLATION_FOR_ATTR,
  TRANSLATION_BLOCK_CLASS,
  FAILED_CLASS,
} from "../shared/constants";
import type { TranslationResult } from "../shared/types";

export function injectTranslations(results: TranslationResult[], nodeMap: Map<string, HTMLElement>) {
  for (const result of results) {
    const originalNode = nodeMap.get(result.id);
    if (!originalNode) continue;

    if (originalNode.hasAttribute(TRANSLATED_ATTR)) continue;

    const translationBlock = document.createElement("div");
    translationBlock.className = TRANSLATION_BLOCK_CLASS;
    translationBlock.setAttribute(TRANSLATION_FOR_ATTR, result.id);

    if (result.translatedText) {
      translationBlock.textContent = result.translatedText;
    } else {
      translationBlock.textContent = "[翻译失败]";
      translationBlock.classList.add(FAILED_CLASS);
    }

    originalNode.parentNode?.insertBefore(translationBlock, originalNode.nextSibling);
    originalNode.setAttribute(TRANSLATED_ATTR, "1");
  }
}

export function markBatchFailed(items: { id: string }[], nodeMap: Map<string, HTMLElement>) {
  for (const item of items) {
    const originalNode = nodeMap.get(item.id);
    if (!originalNode || originalNode.hasAttribute(TRANSLATED_ATTR)) continue;

    const failedBlock = document.createElement("div");
    failedBlock.className = `${TRANSLATION_BLOCK_CLASS} ${FAILED_CLASS}`;
    failedBlock.setAttribute(TRANSLATION_FOR_ATTR, item.id);
    failedBlock.textContent = "[翻译失败]";

    originalNode.parentNode?.insertBefore(failedBlock, originalNode.nextSibling);
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
