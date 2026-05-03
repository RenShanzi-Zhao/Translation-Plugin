import { execSync } from "node:child_process";
import { cpSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function run(cmd) {
  console.log(`\n>>> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit" });
}

function safeRemove(path) {
  if (!existsSync(path)) {
    return;
  }

  try {
    rmSync(path, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Could not remove ${path}. Continuing with overwrite-friendly build.`, error);
  }
}

const distPath = resolve(root, "dist");
mkdirSync(distPath, { recursive: true });

safeRemove(resolve(distPath, "background"));
safeRemove(resolve(distPath, "content"));
safeRemove(resolve(distPath, "options"));
safeRemove(resolve(distPath, "manifest.json"));
safeRemove(resolve(distPath, "icons"));

run("cmd /c npx vite build --config vite.config.ts --mode background");
run("cmd /c npx vite build --config vite.config.ts --mode content");
run("cmd /c npx vite build --config vite.config.ts --mode options");

cpSync(resolve(root, "manifest.json"), resolve(root, "dist/manifest.json"));

if (existsSync(resolve(root, "icons"))) {
  cpSync(resolve(root, "icons"), resolve(root, "dist/icons"), { recursive: true });
}

const contentCssFiles = ["floating.css", "selectionPopup.css"];
for (const cssFile of contentCssFiles) {
  const src = resolve(root, "src/content", cssFile);
  if (existsSync(src)) {
    mkdirSync(resolve(root, "dist/content"), { recursive: true });
    cpSync(src, resolve(root, `dist/content/${cssFile}`));
  }
}

console.log("\nBuild complete -> dist/");
