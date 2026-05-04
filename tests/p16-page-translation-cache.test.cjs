const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const cachePath = resolve(process.cwd(), "src/content/core/pageTranslationCache.ts");
const indexPath = resolve(process.cwd(), "src/content/index.ts");
const orchestratorPath = resolve(process.cwd(), "src/content/core/orchestrator.ts");

assert.ok(existsSync(cachePath), "pageTranslationCache.ts should exist");

const cacheSource = readFileSync(cachePath, "utf8");
const indexSource = readFileSync(indexPath, "utf8");
const orchestratorSource = readFileSync(orchestratorPath, "utf8");

assert.match(cacheSource, /PAGE_TRANSLATION_CACHE_KEY/);
assert.match(cacheSource, /MAX_CACHED_PAGES = 30/);
assert.match(cacheSource, /MAX_TRANSLATIONS_PER_PAGE = 200/);
assert.match(cacheSource, /MAX_TOTAL_TRANSLATIONS = 6000/);
assert.match(cacheSource, /normalizePageUrl/);
assert.match(cacheSource, /restoreCachedTranslations/);
assert.match(cacheSource, /savePageTranslations/);
assert.match(cacheSource, /lastRestoredAt/);
assert.match(cacheSource, /entryCount/);
assert.match(cacheSource, /pruneCacheEntries/);
assert.match(cacheSource, /chrome\.storage\.local/);

assert.match(indexSource, /restoreCachedTranslations/);
assert.match(indexSource, /injectTranslations\(cachedTranslations, currentNodeMap\)/);

assert.match(orchestratorSource, /onBatchTranslated/);
assert.match(orchestratorSource, /onBatchTranslated\??\.?\(batch, results\)/);

console.log("p16 page translation cache contract test passed");
