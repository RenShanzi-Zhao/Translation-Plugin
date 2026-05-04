import { CONTENT_SELECTORS, EXCLUDED_CONTAINER_TAGS, EXCLUDED_SELECTORS } from "../../shared/constants";
import { getSiteExtractionRule } from "./siteRules";

function scoreCandidate(el: Element): number {
  let score = 0;

  const textLength = el.textContent?.trim().length || 0;
  score += Math.min(textLength / 100, 10);

  const paragraphs = el.querySelectorAll("p, li, blockquote, h1, h2, h3, h4, h5, h6");
  score += paragraphs.length * 2;

  const links = el.querySelectorAll("a");
  const linkDensity = links.length / Math.max(paragraphs.length, 1);
  if (linkDensity > 0.5) score -= 5;

  const buttons = el.querySelectorAll("button, input, select");
  score -= buttons.length;

  const className = (el.className || "").toLowerCase();
  const id = (el.id || "").toLowerCase();
  const badWords = ["nav", "sidebar", "footer", "menu", "comments", "share", "recommend"];
  for (const word of badWords) {
    if (className.includes(word) || id.includes(word)) score -= 3;
  }

  return score;
}

export function findMainContentContainer(): Element | null {
  const siteRule = getSiteExtractionRule();
  const preferredSelectors = siteRule?.contentSelectors?.length
    ? [...siteRule.contentSelectors, ...CONTENT_SELECTORS]
    : CONTENT_SELECTORS;

  for (const selector of preferredSelectors) {
    const candidates = document.querySelectorAll(selector);
    if (candidates.length === 1) return candidates[0];
    if (candidates.length > 1) {
      let best = candidates[0];
      let bestScore = -Infinity;
      for (const c of Array.from(candidates)) {
        const s = scoreCandidate(c);
        if (s > bestScore) {
          bestScore = s;
          best = c;
        }
      }
      return best;
    }
  }

  const fallbackSelectors = siteRule?.containerSelectors?.length
    ? [...siteRule.containerSelectors, "main", "article", "section", "div"]
    : ["main", "article", "section", "div"];
  const allCandidates = document.querySelectorAll(fallbackSelectors.join(", "));
  let best: Element | null = null;
  let bestScore = -Infinity;

  for (const el of Array.from(allCandidates)) {
    const s = scoreCandidate(el);
    if (s > bestScore) {
      bestScore = s;
      best = el;
    }
  }

  return best;
}

export function isInsideExcludedRegion(el: Element): boolean {
  const siteRule = getSiteExtractionRule();
  const excludedSelectors = siteRule?.excludedSelectors?.length
    ? [...EXCLUDED_SELECTORS, ...siteRule.excludedSelectors]
    : EXCLUDED_SELECTORS;

  let current: Element | null = el;
  while (current) {
    const tag = current.tagName.toLowerCase();
    if (EXCLUDED_CONTAINER_TAGS.has(tag)) return true;
    if (current.getAttribute("role") === "navigation") return true;

    for (const selector of excludedSelectors) {
      if (current.matches(selector)) return true;
    }

    current = current.parentElement;
  }
  return false;
}
