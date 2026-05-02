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

// Build all three entry points
run("npx vite build --config vite.config.ts");
run("npx vite build --config vite.config.ts --mode background");
run("npx vite build --config vite.config.ts --mode content");

// Copy manifest and icons
cpSync(resolve(root, "manifest.json"), resolve(root, "dist/manifest.json"));

if (existsSync(resolve(root, "icons"))) {
  cpSync(resolve(root, "icons"), resolve(root, "dist/icons"), { recursive: true });
}

console.log("\n✅ Build complete → dist/");
