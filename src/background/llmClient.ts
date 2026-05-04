import { REQUEST_TIMEOUT_MS } from "../shared/constants";
import { getRuntimeConfig, type RuntimeConfig } from "../shared/config";

export function getEnvFallbackConfig() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const apiKey = import.meta.env.VITE_API_KEY;
  const model = import.meta.env.VITE_MODEL;
  return { apiBaseUrl, apiKey, model: model || "gpt-4o-mini" };
}

export async function getDefaultRuntimeConfig(): Promise<RuntimeConfig> {
  return getRuntimeConfig(getEnvFallbackConfig());
}

export function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

export async function callChatCompletions(
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

export function createTimeoutController() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return { controller, timeout };
}
