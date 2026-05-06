import { EXCLUDED_TAGS, MIN_PARAGRAPH_LENGTH, TRANSLATED_ATTR } from "../../shared/constants";
import { isInsideExcludedRegion } from "./selectors";
import type { TranslateItem } from "../../shared/types";

let idCounter = 0;

function generateId(): string {
  return `p_${++idCounter}`;
}

function isVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    el.offsetHeight > 0
  );
}

function isHighLinkDensity(el: Element): boolean {
  const links = el.querySelectorAll("a");
  const totalText = el.textContent?.trim().length || 0;
  const linkText = Array.from(links).reduce((sum, a) => sum + (a.textContent?.trim().length || 0), 0);
  return totalText > 0 && linkText / totalText > 0.5;
}

const CODE_LIKE_SELECTOR = [
  "pre",
  "code",
  ".highlight",
  ".blob-code",
  ".blob-code-inner",
  ".react-code-text",
  ".react-code-line-contents",
  ".js-file-line",
  ".cm-content",
  ".cm-line",
].join(", ");

function isCodeLikeBlock(el: Element): boolean {
  const className = typeof el.className === "string" ? el.className : el.getAttribute("class") || "";
  const id = el.id || "";
  const markerText = `${className} ${id}`;
  if (/(^|\s)(blob-code|highlight|react-code|code-view|js-file-line|cm-content|cm-line)(\s|$)/i.test(markerText)) {
    return true;
  }

  if (el.matches(CODE_LIKE_SELECTOR)) {
    return true;
  }

  const codeLikeNodes = el.querySelectorAll(CODE_LIKE_SELECTOR);
  if (codeLikeNodes.length === 0) {
    return false;
  }

  const totalText = el.textContent?.trim().length || 0;
  if (totalText === 0) {
    return false;
  }

  const codeText = Array.from(codeLikeNodes).reduce((sum, node) => {
    return sum + (node.textContent?.trim().length || 0);
  }, 0);

  return codeText / totalText > 0.6;
}

function shouldTranslateNode(el: Element): boolean {
  const tag = el.tagName.toLowerCase();

  if (EXCLUDED_TAGS.has(tag)) return false;
  if (el.hasAttribute(TRANSLATED_ATTR)) return false;
  if (isInsideExcludedRegion(el)) return false;
  if (isCodeLikeBlock(el)) return false;

  const text = el.textContent?.trim() || "";
  if (text.length < MIN_PARAGRAPH_LENGTH) return false;
  if (/^[\s\W]+$/.test(text)) return false;
  if (!isVisible(el as HTMLElement)) return false;
  if (isHighLinkDensity(el)) return false;

  return true;
}

const TRANSLATABLE_TAGS = new Set(["p", "li", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6"]);
const BLOCK_CANDIDATE_TAGS = new Set(["p", "li", "blockquote", "dd", "figcaption", "label", "legend"]);
const REJECTED_BLOCK_WRAPPERS = new Set(["body", "html", "article", "main", "section", "ul", "ol"]);

export function extractTranslatableNodes(container: Element): HTMLElement[] {
  const nodes: HTMLElement[] = [];
  const all = container.querySelectorAll(Array.from(TRANSLATABLE_TAGS).join(", "));

  for (const el of Array.from(all)) {
    if (TRANSLATABLE_TAGS.has(el.tagName.toLowerCase()) && shouldTranslateNode(el)) {
      nodes.push(el as HTMLElement);
    }
  }

  return nodes;
}

export function buildTranslateItems(nodes: HTMLElement[]): {
  items: TranslateItem[];
  nodeMap: Map<string, HTMLElement>;
} {
  const items: TranslateItem[] = [];
  const nodeMap = new Map<string, HTMLElement>();

  for (const node of nodes) {
    const id = generateId();
    items.push({ id, text: node.textContent?.trim() || "" });
    nodeMap.set(id, node);
  }

  return { items, nodeMap };
}

const EXCLUDED_TREE_TAGS = new Set(["script", "style", "noscript", "textarea", "input", "select"]);

function isBlockLikeElement(el: HTMLElement): boolean {
  const display = window.getComputedStyle(el).display;
  return !display.startsWith("inline");
}

function resolveBlockCandidate(start: HTMLElement, container: Element): HTMLElement | null {
  let current: HTMLElement | null = start;

  while (current && current !== container) {
    const tag = current.tagName.toLowerCase();
    if (REJECTED_BLOCK_WRAPPERS.has(tag)) {
      current = current.parentElement;
      continue;
    }

    if (BLOCK_CANDIDATE_TAGS.has(tag)) {
      return current;
    }

    if (isBlockLikeElement(current)) {
      const nestedParagraphs = current.querySelectorAll(Array.from(TRANSLATABLE_TAGS).join(", "));
      if (nestedParagraphs.length === 0) {
        return current;
      }
    }

    current = current.parentElement;
  }

  return null;
}

function extractCandidateFromTextNode(node: Text, container: Element): HTMLElement | null {
  const parent = node.parentElement;
  if (!parent) return null;
  return resolveBlockCandidate(parent, container);
}

export function extractAllTextNodes(container: Element): HTMLElement[] {
  const candidateSet = new Set<HTMLElement>();

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (EXCLUDED_TREE_TAGS.has(tag)) return NodeFilter.FILTER_REJECT;
        if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const candidate = extractCandidateFromTextNode(node, container);
    if (candidate) {
      candidateSet.add(candidate);
    }
  }

  const result: HTMLElement[] = [];
  for (const el of candidateSet) {
    if (shouldTranslateNode(el)) {
      result.push(el);
    }
  }

  return result;
}
