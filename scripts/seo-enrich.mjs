#!/usr/bin/env node
// One-shot (but idempotent) SEO enrichment for client/public/blog/*.html.
// Implements items 2–5 of the 13 Sep 2026 audit (claude/blog-sync-and-seo-audit-2026-09.md):
//
//   --related   add a "Continue Reading" block (3 related posts, keyword similarity)
//               to every post that doesn't already have one            [item 2]
//   --titles    drop the " — Acqlerate" / " | Acqlerate" suffix from post <title>s
//               (Google appends the site name itself); report any still > 65 chars [item 3]
//   --descs     shorten meta descriptions > 160 chars at a sentence boundary;
//               report the ones that can't be cut cleanly for a human rewrite   [item 4]
//   --dates     add "dateModified" to JSON-LD where missing, plus og:type=article,
//               article:published_time / article:modified_time                 [item 5]
//
// No flags = all four.  --dry-run prints the plan and writes nothing.
// Zero dependencies. Run from anywhere: node scripts/seo-enrich.mjs [flags]
// Safe to re-run: every step checks for its own marker before touching a file.

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BLOG = join(ROOT, "client", "public", "blog");
const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const ALL = !["--related", "--titles", "--descs", "--dates"].some((f) => args.has(f));
const want = (f) => ALL || args.has(f);

const TITLE_MAX = 65;
const DESC_MAX = 160;
const DESC_MIN = 70;
const RELATED_N = 3;

// ---------------------------------------------------------------------------
const unesc = (s) => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const escAttr = (s) => String(s).replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const escText = (s) => String(s).replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const field = (h, re, d = "") => { const m = h.match(re); return m ? m[1].trim() : d; };

const files = readdirSync(BLOG).filter((f) => f.endsWith(".html") && f !== "index.html" && statSync(join(BLOG, f)).isFile());
const posts = files.map((file) => {
  const html = readFileSync(join(BLOG, file), "utf8");
  const ld = field(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  let data = {}; try { data = JSON.parse(ld); } catch { /* handled below */ }
  const headline = unesc(data.headline || field(html, /<title>(.*?)(?:\s*[—|]\s*Acqlerate)?<\/title>/));
  const description = unesc(data.description || field(html, /<meta name="description" content="(.*?)"/));
  const h2s = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map((m) => unesc(m[1].replace(/<[^>]+>/g, "")));
  const audience = field(html, /For:\s*([^<·]+)/, "").trim();
  return { file, slug: file.replace(/\.html$/, ""), html, data, headline, description, h2s, audience, datePublished: data.datePublished || "" };
});

// Category label for related cards: the tag the blog index shows for this post,
// else the post's stated audience.
const indexHtml = readFileSync(join(BLOG, "index.html"), "utf8");
const tagOf = {};
for (const m of indexHtml.matchAll(/href="\/blog\/([a-z0-9-]+)"[\s\S]*?<div class="post-meta-top">([\s\S]*?)<\/div>/g)) {
  const tag = (m[2].match(/post-tag">([^<]+)</) || [])[1];
  if (tag && tag !== "Free" && !tag.includes("Latest")) tagOf[m[1]] = unesc(tag.trim());
}
const catFor = (p) => tagOf[p.slug] || (/usg.*contractor/i.test(p.audience) ? "USG & Contractor" : /contractor/i.test(p.audience) ? "Contractor" : /usg|government/i.test(p.audience) ? "Government" : "Acquisition");

const report = { related: [], titles: [], titlesLong: [], descs: [], descsManual: [], dates: [] };
let touched = 0;

// ---------------------------------------------------------------------------
// [2] Related posts — TF vectors over title (x3), h2s (x2), description, slug; cosine.
// ---------------------------------------------------------------------------
const STOP = new Set("a an and are as at be by for from has have how in is it its of on or that the this to was what when where which who why will with you your our we they their not no do does can vs into than then there these those every each more most much may might should would could just like get one two three 2025 2026 dod defense acquisition acquisitions program programs contract contracts guide what's it's here's".split(" "));
const tokens = (s) => unesc(s).toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/[\s-]+/).filter((w) => w.length > 2 && !STOP.has(w));
const vec = (p) => {
  const v = new Map();
  const add = (words, w) => words.forEach((t) => v.set(t, (v.get(t) || 0) + w));
  add(tokens(p.headline), 3); add(tokens(p.slug), 2); p.h2s.forEach((h) => add(tokens(h), 2)); add(tokens(p.description), 1);
  return v;
};
const cosine = (a, b) => {
  let dot = 0, na = 0, nb = 0;
  for (const [k, x] of a) { na += x * x; if (b.has(k)) dot += x * b.get(k); }
  for (const x of b.values()) nb += x * x;
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
};
const vectors = new Map(posts.map((p) => [p.slug, vec(p)]));

function relatedBlock(p) {
  const scored = posts.filter((q) => q.slug !== p.slug)
    .map((q) => ({ q, s: cosine(vectors.get(p.slug), vectors.get(q.slug)) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s || y.q.datePublished.localeCompare(x.q.datePublished))
    .slice(0, RELATED_N);
  if (scored.length < 2) return null;
  const cards = scored.map(({ q }) => `        <a href="/blog/${q.slug}" class="related-card">
          <div class="cat">${escText(catFor(q))}</div>
          <h3>${escText(q.headline)}</h3>
        </a>`).join("\n");
  return { picks: scored.map((x) => x.q.slug), block: `
    <div class="related-posts" data-acq="related-auto">
      <h2>Continue Reading</h2>
      <div class="related-grid">
${cards}
      </div>
    </div>
` };
}

// ---------------------------------------------------------------------------
// [4] Description shortening at a sentence boundary
// ---------------------------------------------------------------------------
function shortenDesc(d) {
  if (d.length <= DESC_MAX) return null;
  let best = null;
  for (const m of d.matchAll(/[.!?](?=\s|$)/g)) {
    const cut = d.slice(0, m.index + 1).trim();
    if (cut.length >= DESC_MIN && cut.length <= DESC_MAX) best = cut;
  }
  return best;
}

// ---------------------------------------------------------------------------
for (const p of posts) {
  let html = p.html;
  const before = html;

  // [3] titles
  if (want("--titles")) {
    const t = field(html, /<title>(.*?)<\/title>/);
    const stripped = t.replace(/\s*(?:—|\||-)\s*Acqlerate\s*$/, "");
    if (stripped !== t) { html = html.replace(/<title>.*?<\/title>/, () => `<title>${stripped}</title>`); report.titles.push(`${p.slug}: ${t.length} → ${stripped.length}`); }
    if (unesc(stripped).length > TITLE_MAX) report.titlesLong.push(`${p.slug} (${unesc(stripped).length}): ${unesc(stripped)}`);
  }

  // [4] descriptions
  if (want("--descs")) {
    const cur = field(html, /<meta name="description" content="(.*?)"/);
    const plain = unesc(cur);
    if (plain.length > DESC_MAX) {
      const cut = shortenDesc(plain);
      if (cut) {
        html = html.replace(/<meta name="description" content=".*?"/, () => `<meta name="description" content="${escAttr(cut)}"`);
        report.descs.push(`${p.slug}: ${plain.length} → ${cut.length}`);
      } else report.descsManual.push(`${p.slug} (${plain.length}): ${plain}`);
    }
  }

  // [5] dates
  if (want("--dates") && p.datePublished) {
    const d = p.datePublished;
    let changed = [];
    if (!/"dateModified"/.test(html)) {
      html = html.replace(/("datePublished"\s*:\s*"\d{4}-\d{2}-\d{2}")/, (_, a) => `${a},\n    "dateModified": "${d}"`);
      changed.push("dateModified");
    }
    const mod = field(html, /"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/, d);
    const ogAdd = [];
    if (!/property="og:type"/.test(html)) ogAdd.push(`  <meta property="og:type" content="article" />`);
    if (!/property="article:published_time"/.test(html)) ogAdd.push(`  <meta property="article:published_time" content="${d}" />`);
    if (!/property="article:modified_time"/.test(html)) ogAdd.push(`  <meta property="article:modified_time" content="${mod}" />`);
    if (ogAdd.length) {
      const anchor = /<link rel="canonical"[^>]*>/.test(html) ? /(\s*<link rel="canonical"[^>]*>)/ : /(\s*<\/head>)/;
      html = html.replace(anchor, (_, a) => `\n${ogAdd.join("\n")}${a}`);
      changed.push(...ogAdd.map((l) => l.match(/(?:property|name)="([^"]+)"/)[1]));
    }
    if (changed.length) report.dates.push(`${p.slug}: +${changed.join(", ")}`);
  }

  // [2] related
  if (want("--related") && !/class="related-posts"/.test(html)) {
    const rb = relatedBlock(p);
    if (rb) {
      if (/<\/article>/.test(html)) html = html.replace(/(\s*<\/article>)/, (_, a) => `\n${rb.block}${a}`);
      else if (/<footer/.test(html)) html = html.replace(/(\s*<footer)/, (_, a) => `\n<div class="blog-container" style="max-width:820px;margin:0 auto;padding:0 1.25rem">${rb.block}</div>${a}`);
      else { report.related.push(`${p.slug}: SKIPPED (no </article> or <footer>)`); }
      if (html !== before || DRY) report.related.push(`${p.slug} → ${rb.picks.join(", ")}`);
    }
  }

  if (html !== before) {
    touched++;
    if (!DRY) writeFileSync(join(BLOG, p.file), html);
  }
}

// ---------------------------------------------------------------------------
const section = (title, rows) => rows.length && console.log(`\n## ${title} (${rows.length})\n` + rows.map((r) => "  " + r).join("\n"));
console.log(`seo-enrich${DRY ? " [DRY RUN]" : ""}: ${posts.length} posts scanned, ${touched} ${DRY ? "would change" : "changed"}`);
section("Titles: brand suffix removed", report.titles);
section("Titles still over " + TITLE_MAX + " chars — shorten <title> by hand (leave the H1)", report.titlesLong);
section("Descriptions shortened at a sentence boundary", report.descs);
section("Descriptions over " + DESC_MAX + " with no clean cut — rewrite by hand", report.descsManual);
section("Dates/OG added", report.dates);
section("Related posts added", report.related);
if (!DRY && touched) console.log("\nNext: node scripts/sync-blog.mjs   (sitemap lastmod picks up dateModified), then review `git diff --stat` and commit.");
