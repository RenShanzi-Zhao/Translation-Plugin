import type { FloatingSettingsState } from "./floatingSettings";

type ButtonControllerOptions = {
  settingsState: FloatingSettingsState;
  translateSvg: string;
  onTranslate: () => void;
  onDragStart: () => void;
  onHoverVisible: () => void;
  onHoverLeave: () => void;
};

export type FloatingButtonController = {
  createButton: () => HTMLDivElement;
  getButton: () => HTMLDivElement | null;
  applyIcon: () => void;
  semiHide: () => void;
  isSemiHidden: () => boolean;
  isAnimating: () => boolean;
  setTranslating: (isTranslating: boolean) => void;
};

export function createFloatingButtonController(
  options: ButtonControllerOptions
): FloatingButtonController {
  let floatBtn: HTMLDivElement | null = null;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let btnStartX = 0;
  let btnStartY = 0;
  let hasMoved = false;
  let isSemiHiddenValue = true;
  let hideSide: "left" | "right" = "left";
  let isAnimating = false;

  function getViewportW(): number {
    return document.documentElement.clientWidth;
  }

  function applyIcon() {
    if (!floatBtn) return;
    if (options.settingsState.icon) {
      floatBtn.innerHTML = "";
      floatBtn.style.backgroundImage = `url(${options.settingsState.icon})`;
      floatBtn.style.backgroundSize = "cover";
      floatBtn.style.backgroundPosition = "center";
    } else {
      floatBtn.innerHTML = options.translateSvg;
      floatBtn.style.backgroundImage = "none";
    }
  }

  function animateLeft(from: number, to: number, duration: number, onDone?: () => void) {
    if (!floatBtn) return;
    const startTime = performance.now();

    function frame(time: number) {
      if (!floatBtn) return;
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      floatBtn.style.left = `${from + (to - from) * eased}px`;

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        floatBtn.style.left = `${to}px`;
        onDone?.();
      }
    }

    isAnimating = true;
    requestAnimationFrame(frame);
  }

  function semiHide() {
    if (!floatBtn || !isSemiHiddenValue) return;
    const btnW = 48;
    const current = parseFloat(floatBtn.style.left) || 6;
    const target = hideSide === "right" ? getViewportW() - btnW * 0.3 : -btnW * 0.7;
    animateLeft(current, target, 250, () => {
      isAnimating = false;
    });
    floatBtn.style.opacity = String(options.settingsState.opacity);
  }

  function slideOut() {
    if (!floatBtn) return;
    const btnW = 48;
    const current = parseFloat(floatBtn.style.left) || -btnW * 0.7;
    const target = hideSide === "right" ? getViewportW() - btnW - 6 : 6;
    animateLeft(current, target, 250, () => {
      isAnimating = false;
      if (floatBtn?.matches(":hover")) {
        options.onHoverVisible();
      }
    });
    floatBtn.style.right = "auto";
    floatBtn.style.opacity = "1";
  }

  function handleMouseDown(e: MouseEvent) {
    if (e.button !== 0 || !floatBtn) return;
    isDragging = false;
    hasMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const rect = floatBtn.getBoundingClientRect();
    btnStartX = rect.left;
    btnStartY = rect.top;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove(e: MouseEvent) {
    if (!floatBtn) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    if (!isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      isDragging = true;
      hasMoved = true;
      options.onDragStart();
      isSemiHiddenValue = false;
    }

    if (isDragging) {
      const vw = getViewportW();
      const newLeft = Math.max(0, Math.min(vw - 48, btnStartX + dx));
      const newTop = Math.max(0, Math.min(window.innerHeight - 48, btnStartY + dy));
      floatBtn.style.left = `${newLeft}px`;
      floatBtn.style.top = `${newTop}px`;
      floatBtn.style.right = "auto";
      floatBtn.style.bottom = "auto";
      floatBtn.style.opacity = "1";
    }
  }

  function handleMouseUp() {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    isDragging = false;

    if (!floatBtn) return;

    if (!hasMoved) {
      options.onTranslate();
    } else {
      const vw = getViewportW();
      const rect = floatBtn.getBoundingClientRect();
      if (rect.left < 20) {
        hideSide = "left";
        isSemiHiddenValue = true;
        semiHide();
      } else if (rect.right > vw - 20) {
        hideSide = "right";
        isSemiHiddenValue = true;
        semiHide();
      } else {
        isSemiHiddenValue = false;
      }
    }
  }

  function handleMouseEnter() {
    if (isDragging) return;
    if (isSemiHiddenValue) {
      slideOut();
      return;
    }
    options.onHoverVisible();
  }

  function handleMouseLeave() {
    setTimeout(() => {
      if (isAnimating) return;
      options.onHoverLeave();
    }, 100);
  }

  function createButton() {
    if (floatBtn) {
      return floatBtn;
    }

    floatBtn = document.createElement("div");
    floatBtn.className = "imm-float-btn";
    floatBtn.title = "鐐瑰嚮缈昏瘧 | 鎮仠鏄剧ず璁剧疆";
    applyIcon();

    floatBtn.addEventListener("mousedown", handleMouseDown);
    floatBtn.addEventListener("mouseenter", handleMouseEnter);
    floatBtn.addEventListener("mouseleave", handleMouseLeave);
    floatBtn.addEventListener("click", (e) => e.stopPropagation());

    document.documentElement.appendChild(floatBtn);

    isSemiHiddenValue = true;
    hideSide = "left";
    semiHide();

    return floatBtn;
  }

  function setTranslating(isTranslating: boolean) {
    if (!floatBtn) return;
    if (isTranslating) {
      floatBtn.classList.add("translating");
    } else {
      floatBtn.classList.remove("translating");
    }
  }

  return {
    createButton,
    getButton: () => floatBtn,
    applyIcon,
    semiHide,
    isSemiHidden: () => isSemiHiddenValue,
    isAnimating: () => isAnimating,
    setTranslating,
  };
}
