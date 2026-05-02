import type { TranslateItem, TranslationResult, TranslateError } from "../shared/types";
import { REQUEST_TIMEOUT_MS, MAX_RETRIES } from "../shared/constants";

interface EnvConfig {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
}

function getConfig(): EnvConfig {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const apiKey = import.meta.env.VITE_API_KEY;
  const model = import.meta.env.VITE_MODEL;

  if (!apiBaseUrl || !apiKey) {
    throw new Error("Missing VITE_API_BASE_URL or VITE_API_KEY in environment");
  }

  return { apiBaseUrl, apiKey, model: model || "gpt-4o-mini" };
}

function buildPrompt(items: TranslateItem[], sourceLang: string, targetLang: string): string {
  const numbered = items.map((item, i) => `${i + 1}. ${item.text}`).join("\n");
  return `Translate the following paragraphs from ${sourceLang} to ${targetLang}.
Output ONLY the translations, one per line, numbered to match the input.
Do not add explanations, notes, or extra formatting.

${numbered}`;
}

function parseResponse(raw: string, itemCount: number): string[] {
  const lines = raw.trim().split("\n");
  const results: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\d+\.\s*(.*)/);
    if (match) {
      results.push(match[1].trim());
    } else if (line.trim()) {
      results.push(line.trim());
    }
  }

  while (results.length < itemCount) {
    results.push("");
  }

  return results.slice(0, itemCount);
}

export async function translateBatch(
  items: TranslateItem[],
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult[]> {
  const config = getConfig();
  const prompt = buildPrompt(items, sourceLang, targetLang);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(`${config.apiBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: "You are a professional translator. Output only translations, no explanations." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        const error: TranslateError = {
          code: response.status >= 500 ? "TRANSLATE_UPSTREAM_ERROR" : "INVALID_REQUEST",
          message: `API returned ${response.status}: ${errorText}`,
        };

        if (response.status >= 500 && attempt < MAX_RETRIES) {
          lastError = new Error(error.message);
          continue;
        }

        throw error;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      const translatedTexts = parseResponse(content, items.length);

      return items.map((item, i) => ({
        id: item.id,
        translatedText: translatedTexts[i],
      }));
    } catch (err: any) {
      if (err.code === "ABORT_ERR") {
        lastError = new Error("Request timeout");
        if (attempt < MAX_RETRIES) continue;
        throw { code: "TRANSLATE_TIMEOUT", message: "Request timed out after retries" } as TranslateError;
      }

      if (err.code && err.message) throw err;

      lastError = err;
      if (attempt < MAX_RETRIES) continue;
      throw { code: "INTERNAL_ERROR", message: err.message } as TranslateError;
    }
  }

  throw { code: "INTERNAL_ERROR", message: lastError?.message || "Unknown error" } as TranslateError;
}
