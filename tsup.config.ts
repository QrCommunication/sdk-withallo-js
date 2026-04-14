import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    outDir: "dist",
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    splitting: false,
    target: "es2022",
    platform: "neutral",
  },
  {
    entry: { "react/index": "src/react/index.ts" },
    outDir: "dist",
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    treeshake: true,
    splitting: false,
    target: "es2022",
    platform: "browser",
    external: ["react", "react-dom", "../index.js"],
  },
]);
