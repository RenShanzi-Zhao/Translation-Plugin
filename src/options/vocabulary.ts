import {
  getVocabulary,
  removeVocabularyItem,
  toggleVocabularyMastered,
} from "../shared/vocabulary";

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
      (item) => `
      <article class="vocab-card">
        <div class="vocab-card-top">
          <h2 class="vocab-term">${escapeHtml(item.term)}</h2>
          <button class="mastery-toggle" data-id="${item.id}">
            ${item.mastered ? "已掌握" : "未掌握"}
          </button>
        </div>
        <p class="vocab-translation">${escapeHtml(item.translation)}</p>
        ${
          item.exampleSentence
            ? `<p class="vocab-example">${escapeHtml(item.exampleSentence)}</p>`
            : ""
        }
        ${
          item.exampleTranslation
            ? `<p class="vocab-example-translation">${escapeHtml(item.exampleTranslation)}</p>`
            : ""
        }
        <div class="vocab-card-footer">
          <span class="vocab-count">划线 ${item.selectionCount} 次</span>
          <button class="vocab-remove" data-id="${item.id}">删除</button>
        </div>
      </article>
    `
    )
    .join("");

  list.querySelectorAll(".mastery-toggle").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = (btn as HTMLElement).dataset.id!;
      await toggleVocabularyMastered(id);
      await renderVocabulary();
    });
  });

  list.querySelectorAll(".vocab-remove").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = (btn as HTMLElement).dataset.id!;
      await removeVocabularyItem(id);
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
