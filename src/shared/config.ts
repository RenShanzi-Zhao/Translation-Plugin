export const RUNTIME_CONFIG_STORAGE_KEY = "imm-runtime-config";

export type RuntimeConfig = {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
};

export type PartialRuntimeConfig = Partial<RuntimeConfig>;

export async function loadStoredRuntimeConfig(): Promise<PartialRuntimeConfig> {
  const result = await chrome.storage.local.get(RUNTIME_CONFIG_STORAGE_KEY);
  return (result[RUNTIME_CONFIG_STORAGE_KEY] as PartialRuntimeConfig | undefined) ?? {};
}

export async function saveStoredRuntimeConfig(config: PartialRuntimeConfig): Promise<void> {
  await chrome.storage.local.set({
    [RUNTIME_CONFIG_STORAGE_KEY]: config,
  });
}

export async function clearStoredRuntimeConfig(): Promise<void> {
  await chrome.storage.local.remove(RUNTIME_CONFIG_STORAGE_KEY);
}

export async function getRuntimeConfig(envFallback?: PartialRuntimeConfig): Promise<RuntimeConfig> {
  const stored = await loadStoredRuntimeConfig();
  const merged = {
    apiBaseUrl: stored.apiBaseUrl || envFallback?.apiBaseUrl || "",
    apiKey: stored.apiKey || envFallback?.apiKey || "",
    model: stored.model || envFallback?.model || "gpt-4o-mini",
  };

  if (!merged.apiBaseUrl || !merged.apiKey) {
    throw new Error("Missing API configuration. Open the extension options page and set API Base URL and API Key.");
  }

  return merged;
}
