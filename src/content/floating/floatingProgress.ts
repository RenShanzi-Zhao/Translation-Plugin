let progressBar: HTMLDivElement | null = null;
let progressBarInner: HTMLDivElement | null = null;

export function createProgressBar() {
  if (progressBar) return;
  progressBar = document.createElement("div");
  progressBar.className = "imm-progress";
  progressBarInner = document.createElement("div");
  progressBarInner.className = "imm-progress-bar";
  progressBar.appendChild(progressBarInner);
  document.documentElement.appendChild(progressBar);
}

export function updateProgress(done: number, total: number) {
  if (!progressBar || !progressBarInner) return;
  const pct = total > 0 ? (done / total) * 100 : 0;
  progressBarInner.style.width = `${pct}%`;
}

export function markProgressDone() {
  if (!progressBar) return;
  progressBar.classList.add("done");
  setTimeout(() => {
    progressBar?.remove();
    progressBar = null;
    progressBarInner = null;
  }, 1500);
}
