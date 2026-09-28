# acq-pro (Acqlerate)

The code for acqlerate.com. Pushing to `main` deploys to Railway.

## Folder map

| Path | What it is |
|---|---|
| `client/` | The web app (React + Vite). Blog posts: `client/public/blog/`. Buyer-facing template packs: `client/public/products/`. |
| `server/` | The API (Express): auth, Stripe, emails, AI coach, lesson-book PDFs, stats. |
| `shared/` | Code used by both sides: pricing, database schema, XP, leaderboards, generated course totals. |
| `migrations/` | SQL migrations. New columns go through the boot-time `schemaCols` array in `server/index.ts`. |
| `scripts/` | Scripts still in use: blog generator and dupe guard, blog sync, SEO enrich, lesson-book generator, curriculum checks, OG image, pack 3 builder, video pipeline. |
| `script/build.mjs` | The production build (`npm run build`). |
| `.github/workflows/` | Scheduled jobs: blog post, blog self-test, database backup, uptime monitor, video pipeline. |
| `android/`, `ios/`, `capacitor.config.ts` | The mobile app (Capacitor). |
| `brand/` | Logo and app-icon source files. |
| `products/` | Archive copies of the template packs. `scripts/pack3` writes here and to `client/public/products/`. |
| `content_strategy/` | Pillar-article specs and JSON used by `scripts/sync-blog.mjs`. |
| `archive/` | Old one-off scripts, pack previews and patches. Nothing uses them. |
| `.claude/` | Claude subagents and slash commands (module auditor, voice checker). |

Local only, not on GitHub: `Claude outputs/` and `claude/` hold files Claude sessions saved on this Mac. `dist/` and `node_modules/` are build files.

## Where the notes live

Decisions, runbooks and session notes live in the claude.ai Project "Acqlerate". Start with `00-START-HERE.md` there. `DEPLOY.md` is the original Railway setup guide and is partly out of date.
