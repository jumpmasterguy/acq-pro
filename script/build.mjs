import { execSync } from "child_process";
import { rmSync } from "fs";

try { rmSync("dist", { recursive: true, force: true }); } catch {}

console.log("Building client...");
execSync("./node_modules/.bin/vite build", { stdio: "inherit" });

console.log("Building server...");
execSync(
  "./node_modules/.bin/esbuild server/index.ts --platform=node --bundle --format=cjs --outfile=dist/index.cjs --define:process.env.NODE_ENV='\"production\"' --minify --external:better-sqlite3 --external:passport --external:passport-google-oauth20 --external:passport-local --external:express-session --external:connect-pg-simple --external:stripe --external:resend --external:nodemailer --external:drizzle-orm --external:pg --external:@neondatabase/serverless --external:ws --external:bufferutil --external:utf-8-validate",
  { stdio: "inherit" }
);

console.log("Build complete.");
