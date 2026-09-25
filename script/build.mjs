import { execSync } from "child_process";
import { rmSync } from "fs";
import { build } from "esbuild";

try { rmSync("dist", { recursive: true, force: true }); } catch(e) {}

console.log("Node version:", process.version);

// These two run here rather than in package.json's "prebuild" because Railway
// builds with `node script/build.mjs` directly (see railway.json), which never
// triggers an npm lifecycle hook. A check that only fires when a human happens
// to type `npm run build` is not a check.
console.log("Validating curriculum structure...");
execSync("node scripts/validate-curriculum.js", { stdio: "inherit" });

// curriculumMeta.generated.ts is the light index every screen loads instead of
// the 3 MB curriculum. It is checked in, so this confirms it still matches
// curriculum.ts and fails the build with instructions if it does not.
console.log("Checking curriculum meta index is current...");
execSync("node node_modules/tsx/dist/cli.mjs scripts/gen-curriculum-meta.ts --check", { stdio: "inherit" });

console.log("Generating module CLPs from the curriculum...");
execSync("node scripts/gen-module-clps.mjs", { stdio: "inherit" });

console.log("Syncing blog-derived files (homepage carousel, sitemap)...");
execSync("node scripts/sync-blog.mjs", { stdio: "inherit" });

console.log("Building client (vite)...");
execSync("node node_modules/vite/bin/vite.js build", { stdio: "inherit" });

console.log("Building server (esbuild JS API)...");
await build({
  entryPoints: ["server/index.ts"],
  platform: "node",
  bundle: true,
  format: "cjs",
  outfile: "dist/index.cjs",
  define: { "process.env.NODE_ENV": '"production"' },
  minify: true,
  external: [
    "better-sqlite3","passport","passport-google-oauth20","passport-local",
    "express-session","connect-pg-simple","stripe","resend","nodemailer",
    "drizzle-orm","pg","@neondatabase/serverless","ws","bufferutil","utf-8-validate"
  ],
  logLevel: "info",
});

console.log("Build complete.");
