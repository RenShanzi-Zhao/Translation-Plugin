export type SiteExtractionRule = {
  containerSelectors?: string[];
  contentSelectors?: string[];
  excludedSelectors?: string[];
};

const SITE_RULES: Record<string, SiteExtractionRule> = {
  "github.com": {
    containerSelectors: [".markdown-body", "[data-testid='results-list']", "[role='dialog'] .overflow-auto"],
    contentSelectors: [
      ".markdown-body",
      ".repository-content",
      ".discussion-timeline",
      "[data-testid='results-list']",
    ],
    excludedSelectors: ["button", "p.pinned-item-desc + p"],
  },
};

function matchesHostname(hostname: string, pattern: string): boolean {
  return hostname === pattern || hostname.endsWith(`.${pattern}`);
}

export function getSiteExtractionRule(hostname = globalThis.location?.hostname || ""): SiteExtractionRule | null {
  for (const [pattern, rule] of Object.entries(SITE_RULES)) {
    if (matchesHostname(hostname, pattern)) {
      return rule;
    }
  }

  return null;
}
