import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const entry = mode === "background"
    ? { input: resolve(__dirname, "src/background/index.ts"), output: { dir: resolve(__dirname, "dist/background"), format: "es", entryFileNames: "index.js" } }
    : mode === "content"
    ? { input: resolve(__dirname, "src/content/index.ts"), output: { dir: resolve(__dirname, "dist/content"), format: "iife", entryFileNames: "index.js" } }
    : null;

  if (entry) {
    return {
      build: {
        rollupOptions: entry,
        emptyOutDir: false,
        sourcemap: false,
        minify: true,
      },
      define: {
        "process.env": {},
      },
    };
  }

  return {
    root: resolve(__dirname, "src/popup"),
    base: "./",
    build: {
      rollupOptions: {
        input: resolve(__dirname, "src/popup/index.html"),
        output: { dir: resolve(__dirname, "dist/popup"), entryFileNames: "[name].js" },
      },
      emptyOutDir: false,
      sourcemap: false,
      minify: true,
    },
    define: {
      "process.env": {},
    },
  };
});
