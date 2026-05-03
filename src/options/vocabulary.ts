import { getVocabulary, removeVocabularyItem } from "../shared/vocabulary";

async function renderVocabulary() {
  const list = document.getElementById("vocabulary-list")!;
  const emptyState = document.getElementById("empty-state")!;
  const items = await getVocabulary();

  if (items.length === 0) {
    list.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  list.innerHTML = items
    .map(
      (item, index) => `
      <div class="vocab-item">
        <div class="vocab-term">${escapeHtml(item.term)}</div>
        <div class="vocab-translation">${escapeHtml(item.translation)}</div>
        <div class="vocab-context">${escapeHtml(item.context)}</div>
        <div class="vocab-meta">${escapeHtml(item.sourceUrl)} · ${item.createdAt}</div>
        <button class="vocab-remove" data-index="${index}">删除</button>
      </div>
    `
    )
    .join("");

  list.querySelectorAll(".vocab-remove").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const index = parseInt((btn as HTMLElement).dataset.index!, 10);
      const items = await getVocabulary();
      await removeVocabularyItem(items[index].id);
      await renderVocabulary();
    });
  });
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

renderVocabulary().catch(console.error);
