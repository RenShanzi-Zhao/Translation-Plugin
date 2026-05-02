type RefreshLazyTranslation = () => void;
type IsBusy = () => boolean;

export function createSPAMonitoring(refreshLazyTranslation: RefreshLazyTranslation, isBusy: IsBusy) {
  let observer: MutationObserver | null = null;

  function start(container: Element) {
    observer?.disconnect();

    observer = new MutationObserver((mutations) => {
      let hasNewContent = false;

      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType !== Node.ELEMENT_NODE) {
            continue;
          }

          const element = node as Element;
          if (
            element.tagName.toLowerCase() === "p" ||
            element.querySelector("p, li, blockquote, h1, h2, h3, h4, h5, h6")
          ) {
            hasNewContent = true;
            break;
          }
        }

        if (hasNewContent) {
          break;
        }
      }

      if (hasNewContent && !isBusy()) {
        setTimeout(refreshLazyTranslation, 500);
      }
    });

    observer.observe(container, { childList: true, subtree: true });
  }

  function stop() {
    observer?.disconnect();
    observer = null;
  }

  return { start, stop };
}
