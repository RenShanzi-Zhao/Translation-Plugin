export function isPdfLikePage(): boolean {
  return location.pathname.toLowerCase().endsWith(".pdf") || document.contentType === "application/pdf";
}
