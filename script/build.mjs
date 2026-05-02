import { execSync } from "child_process";
import { rmSync } from "fs";
import { build } from "esbuild";

try { rmSync("dist", { recursive: true, force: true }); } catch(e) {}

console.log("Node version:", process.version);

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
