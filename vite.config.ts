import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  base: "./",
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    minify: 'esbuild',
    target: 'es2020',
    // The curriculum is far and away the biggest thing here, and it now gets
    // its own chunk automatically because nothing imports it statically any
    // more (see client/src/lib/curriculumMeta.ts). Raised so the warning still
    // means something: it should fire on a NEW large chunk, not on the one we
    // know about and deliberately load late.
    chunkSizeWarningLimit: 1200,
    // No manualChunks here on purpose. Grouping React and Radix into fixed
    // vendor chunks was measured and made the FIRST visit ~18 KB gzip worse —
    // pinning a library to a shared chunk stops Rollup pushing the parts only
    // the admin or lesson screens use into those screens' own chunks. The
    // cache-across-deploys argument for vendor chunks did not pay for that.
  },
  esbuild: {
    minifyIdentifiers: false,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
