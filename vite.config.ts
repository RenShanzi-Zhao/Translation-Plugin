import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  if (mode === "background") {
    return {
      build: {
        rollupOptions: {
          input: resolve(__dirname, "src/background/index.ts"),
          output: { dir: resolve(__dirname, "dist/background"), format: "es", entryFileNames: "index.js" },
        },
        emptyOutDir: false,
        sourcemap: false,
        minify: true,
      },
      define: { "process.env": {} },
    };
  }

  if (mode === "options") {
    return {
      base: "./",
      root: resolve(__dirname, "src/options"),
      build: {
        outDir: resolve(__dirname, "dist/options"),
        rollupOptions: {
          input: resolve(__dirname, "src/options/index.html"),
        },
        emptyOutDir: true,
        sourcemap: false,
        minify: true,
      },
      define: { "process.env": {} },
    };
  }

  // content (default mode)
  return {
    build: {
      rollupOptions: {
        input: resolve(__dirname, "src/content/index.ts"),
        output: { dir: resolve(__dirname, "dist/content"), format: "iife", entryFileNames: "index.js" },
      },
      emptyOutDir: false,
      sourcemap: false,
      minify: true,
    },
    define: { "process.env": {} },
  };
});
