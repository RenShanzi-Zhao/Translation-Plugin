import { execSync } from "child_process";
import { cpSync, mkdirSync, existsSync, rmSync } from "fs";
import { resolve } from "path";

const root = resolve(import.meta.dirname, "..");

function run(cmd: string) {
  console.log(`\n>>> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit" });
}

// Clean dist
const distPath = resolve(root, "dist");
if (existsSync(distPath)) {
  rmSync(distPath, { recursive: true });
}

mkdirSync(distPath, { recursive: true });

// Build background and content (popup removed, replaced by floating button)
run("npx vite build --config vite.config.ts --mode background");
run("npx vite build --config vite.config.ts --mode content");

// Copy manifest, icons, and content CSS
cpSync(resolve(root, "manifest.json"), resolve(root, "dist/manifest.json"));

if (existsSync(resolve(root, "icons"))) {
  cpSync(resolve(root, "icons"), resolve(root, "dist/icons"), { recursive: true });
}

// Copy floating.css to dist/content/
const floatingCss = resolve(root, "src/content/floating.css");
if (existsSync(floatingCss)) {
  cpSync(floatingCss, resolve(root, "dist/content/floating.css"));
}

console.log("\n✅ Build complete → dist/");
