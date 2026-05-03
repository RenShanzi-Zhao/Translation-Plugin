export function formatShortcutFromKeyboardEvent(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  if (e.metaKey) parts.push("Meta");
  if (!["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
    parts.push(e.key.toUpperCase());
  }
  return parts.join("+");
}

export function setupKeyboardShortcut(
  getShortcut: () => string,
  onTranslate: (targetLang: string) => void,
  getTargetLang: () => string
) {
  document.addEventListener("keydown", (e) => {
    const pressed = formatShortcutFromKeyboardEvent(e);
    if (pressed === getShortcut()) {
      e.preventDefault();
      onTranslate(getTargetLang());
    }
  });
}
