import { callChatCompletions, createTimeoutController, getDefaultRuntimeConfig, stripCodeFences } from "./llmClient";

export function buildVocabularyExamplePrompt(term: string, translation: string): string {
  return [
    "Generate one short natural English example sentence using the given vocabulary item.",
    "Then provide one concise Chinese explanation of that sentence.",
    'Return ONLY valid JSON with the shape {"exampleSentence":"...","exampleTranslation":"..."}',
    "",
    `term: ${term}`,
    `translation: ${translation}`,
  ].join("\n");
}

export async function generateVocabularyExample(
  term: string,
  translation: string
): Promise<{ exampleSentence: string; exampleTranslation: string }> {
  const config = await getDefaultRuntimeConfig();
  const prompt = buildVocabularyExamplePrompt(term, translation);
  const { controller, timeout } = createTimeoutController();

  try {
    const response = await callChatCompletions(
      config,
      {
        model: config.model,
        messages: [
          {
            role: "system",
            content: "You write short language-learning examples and return only the requested JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      },
      controller
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const content = stripCodeFences(data.choices?.[0]?.message?.content || "");
    const parsed = JSON.parse(content) as {
      exampleSentence?: unknown;
      exampleTranslation?: unknown;
    };

    return {
      exampleSentence:
        typeof parsed.exampleSentence === "string" ? parsed.exampleSentence.trim() : "",
      exampleTranslation:
        typeof parsed.exampleTranslation === "string"
          ? parsed.exampleTranslation.trim()
          : "",
    };
  } finally {
    clearTimeout(timeout);
  }
}
