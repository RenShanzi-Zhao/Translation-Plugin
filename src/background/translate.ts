import type {
  TranslateItem,
  TranslationResult,
  TranslateError,
  TestConnectionPayload,
} from "../shared/types";
import { REQUEST_TIMEOUT_MS, MAX_RETRIES } from "../shared/constants";
import { getRuntimeConfig, type RuntimeConfig } from "../shared/config";

function getEnvFallbackConfig() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const apiKey = import.meta.env.VITE_API_KEY;
  const model = import.meta.env.VITE_MODEL;
  return { apiBaseUrl, apiKey, model: model || "gpt-4o-mini" };
}

function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

export function buildPrompt(items: TranslateItem[], sourceLang: string, targetLang: string): string {
  const serializedItems = JSON.stringify(items, null, 2);

  return [
    `Translate the following paragraphs from ${sourceLang} to ${targetLang}.`,
    "Preserve each input id exactly.",
    'Output ONLY valid JSON with the shape {"translations":[{"id":"...","translatedText":"..."}]}.',
    "Do not add explanations, markdown, or extra keys.",
    "",
    serializedItems,
  ].join("\n");
}

export function parseStructuredTranslations(raw: string, itemIds: string[]): TranslationResult[] {
  const normalized = JSON.parse(stripCodeFences(raw)) as {
    translations?: Array<{ id?: unknown; translatedText?: unknown }>;
  };

  const translations = new Map<string, string>();
  for (const entry of normalized.translations ?? []) {
    if (typeof entry?.id !== "string") {
      continue;
    }

    translations.set(
      entry.id,
      typeof entry.translatedText === "string" ? entry.translatedText.trim() : ""
    );
  }

  return itemIds.map((id) => ({
    id,
    translatedText: translations.get(id) ?? "",
  }));
}

async function callChatCompletions(
  config: RuntimeConfig,
  body: Record<string, unknown>,
  controller: AbortController
) {
  return fetch(`${config.apiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  });
}

export async function testConnection(configInput: TestConnectionPayload): Promise<void> {
  const config: RuntimeConfig = {
    apiBaseUrl: configInput.apiBaseUrl.trim(),
    apiKey: configInput.apiKey.trim(),
    model: configInput.model.trim() || "gpt-4o-mini",
  };

  if (!config.apiBaseUrl || !config.apiKey) {
    throw new Error("API Base URL and API Key are required.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await callChatCompletions(
      config,
      {
        model: config.model,
        messages: [
          { role: "system", content: "Reply with OK only." },
          { role: "user", content: "Connection test" },
        ],
        max_tokens: 5,
        temperature: 0,
      },
      controller
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }
  } catch (err: any) {
    if (err?.name === "AbortError" || err?.code === "ABORT_ERR") {
      throw new Error("Connection test timed out");
    }

    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function translateBatch(
  items: TranslateItem[],
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult[]> {
  const config = await getRuntimeConfig(getEnvFallbackConfig());
  const prompt = buildPrompt(items, sourceLang, targetLang);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await callChatCompletions(
        config,
        {
          model: config.model,
          messages: [
            {
              role: "system",
              content:
                "You are a professional translator. Return only the requested JSON payload.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
        },
        controller
      );

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
      return parseStructuredTranslations(content, items.map((item) => item.id));
    } catch (err: any) {
      if (err?.name === "AbortError" || err?.code === "ABORT_ERR") {
        lastError = new Error("Request timeout");
        if (attempt < MAX_RETRIES) continue;
        throw { code: "TRANSLATE_TIMEOUT", message: "Request timed out after retries" } as TranslateError;
      }

      if (err?.code && err?.message) throw err;

      lastError = err;
      if (attempt < MAX_RETRIES) continue;
      throw { code: "INTERNAL_ERROR", message: err.message } as TranslateError;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw { code: "INTERNAL_ERROR", message: lastError?.message || "Unknown error" } as TranslateError;
}

export async function translateSelectionText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const results = await translateBatch(
    [{ id: "selection", text }],
    sourceLang,
    targetLang
  );
  return results[0]?.translatedText || "";
}
