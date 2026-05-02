import { EXCLUDED_TAGS, MIN_PARAGRAPH_LENGTH, TRANSLATED_ATTR } from "../shared/constants";
import { isInsideExcludedRegion } from "./selectors";
import type { TranslateItem } from "../shared/types";

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

function shouldTranslateNode(el: Element): boolean {
  const tag = el.tagName.toLowerCase();

  if (EXCLUDED_TAGS.has(tag)) return false;
  if (el.hasAttribute(TRANSLATED_ATTR)) return false;
  if (isInsideExcludedRegion(el)) return false;

  const text = el.textContent?.trim() || "";
  if (text.length < MIN_PARAGRAPH_LENGTH) return false;
  if (/^[\s\W]+$/.test(text)) return false;
  if (!isVisible(el as HTMLElement)) return false;
  if (isHighLinkDensity(el)) return false;

  return true;
}

const TRANSLATABLE_TAGS = new Set(["p", "li", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6"]);

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
