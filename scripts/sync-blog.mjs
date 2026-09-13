#!/usr/bin/env node
// Regenerates the parts of the site that must stay in step with the blog folder:
//
//   1. The homepage blog carousel (client/public/landing.html, between the
//      BLOG_CAROUSEL:START / END markers) — the 3 newest posts.
//   2. The blog section of client/public/sitemap.xml — one <url> per live post,
//      lastmod from the post's own dateModified/datePublished.
//
// The single source of truth is client/public/blog/*.html. Nothing here needs a
// model, a network, or a dependency; it runs in `npm run build` (so every Railway
// deploy regenerates it) and can be run by hand with `npm run sync:blog`.
//
// Per-post inputs (all optional, all read from the post's <head>):
//   <meta name="acq:stat" content="13-15%|Sustainment Rate" />   up to 3, drives the
//                                                                 carousel's right-hand panel
//   <meta name="acq:tag"  content="Protests" />                    pill label on non-latest slides
// Without acq:stat the panel falls back to read time / audience / month, so a post
// published by the automated pipeline still gets a complete slide.

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BLOG_DIR = join(ROOT, "client", "public", "blog");
const LANDING = join(ROOT, "client", "public", "landing.html");
const SITEMAP = join(ROOT, "client", "public", "sitemap.xml");
const SITE = "https://acqlerate.com";
const CAROUSEL_SIZE = 3;

// ---------------------------------------------------------------------------
// Read posts
// ---------------------------------------------------------------------------
const esc = (s) => String(s)
  .replace(/&(?!(amp|lt|gt|quot|#\d+|#x[0-9a-f]+);)/gi, "&amp;")
  .replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const unesc = (s) => String(s)
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const field = (html, re, fallback = "") => { const m = html.match(re); return m ? m[1].trim() : fallback; };

function readPost(file) {
  const slug = file.replace(/\.html$/, "");
  const html = readFileSync(join(BLOG_DIR, file), "utf8");
  const ld = field(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  let data = {};
  try { data = JSON.parse(ld); } catch { /* fall through to meta tags */ }

  const datePublished = data.datePublished || field(html, /"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/);
  if (!datePublished) return null; // not a post (or a draft without a date)

  const headline = unesc(data.headline || field(html, /<title>(.*?)(?:\s*[—|]\s*Acqlerate)?<\/title>/));
  const description = unesc(data.description || field(html, /<meta name="description" content="(.*?)"/));
  const readMin = field(html, /(\d+)\s*min read/, "7");
  const audience = field(html, /For:\s*([^<·]+)/, "").trim();
  const stats = [...html.matchAll(/<meta name="acq:stat" content="([^"|]+)\|([^"]+)"/g)]
    .slice(0, 3).map((m) => ({ value: unesc(m[1]), label: unesc(m[2]) }));
  const tag = field(html, /<meta name="acq:tag" content="([^"]+)"/);

  return {
    slug, headline, description, readMin, audience, stats, tag,
    datePublished,
    lastmod: data.dateModified || datePublished,
  };
}

const posts = readdirSync(BLOG_DIR)
  .filter((f) => f.endsWith(".html") && f !== "index.html" && statSync(join(BLOG_DIR, f)).isFile())
  .map(readPost)
  .filter(Boolean)
  .sort((a, b) => b.datePublished.localeCompare(a.datePublished) || a.slug.localeCompare(b.slug));

if (posts.length < CAROUSEL_SIZE) {
  console.error(`sync-blog: only ${posts.length} dated posts found in ${BLOG_DIR}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 1. Homepage carousel
// ---------------------------------------------------------------------------
const fmtDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1]} ${d}, ${y}`;
};
const fmtMonth = (iso) => {
  const [y, m] = iso.split("-").map(Number);
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1]} ${y}`;
};

// Slide styling rotates through three palettes so the carousel keeps its rhythm
// regardless of which posts land in it.
const PALETTES = [
  { bg: "linear-gradient(135deg,#0d2137 0%,#0c4e54 100%)", shadow: "rgba(1,105,111,0.25)", ctaBg: "#f5c842", ctaFg: "#0d2137", accent: "#f5c842" },
  { bg: "linear-gradient(135deg,#1B2D3E 0%,#2d4a6b 100%)", shadow: "rgba(0,0,0,0.2)",        ctaBg: "white",   ctaFg: "#1B2D3E", accent: "#4FC3CB" },
  { bg: "linear-gradient(135deg,#0d2137 0%,#014a4f 100%)", shadow: "rgba(1,105,111,0.25)", ctaBg: "white",   ctaFg: "#0d2137", accent: "#f5c842" },
];

const audienceLabel = (a) => {
  const s = a.toLowerCase();
  if (s.includes("usg") && s.includes("contractor")) return "USG & Contractor";
  if (s.includes("contractor")) return "For Contractors";
  if (s.includes("usg") || s.includes("government")) return "For USG PMs";
  if (s.includes("career")) return "Career";
  return a || "Acquisition";
};

function statPanel(post, palette) {
  const stats = post.stats.length === 3 ? post.stats : [
    { value: `${post.readMin} min`, label: "Read Time" },
    { value: audienceLabel(post.audience), label: "Written For" },
    { value: fmtMonth(post.datePublished), label: "Published" },
  ];
  const divider = `<div style="width:1px;height:28px;background:rgba(255,255,255,0.1)"></div>`;
  const cell = (s, i) => {
    const size = s.value.length > 7 ? "1.05rem" : s.value.length > 5 ? "1.3rem" : "1.6rem";
    const color = i === 1 ? palette.accent : "white";
    return `<div style="text-align:center"><div style="font-size:${size};font-weight:900;color:${color};line-height:1">${esc(s.value)}</div><div style="font-size:0.62rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.07em;margin-top:4px">${esc(s.label)}</div></div>`;
  };
  return `<div class="blog-featured-stats" style="background:rgba(0,0,0,0.18);min-width:160px;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:28px 24px;gap:18px;border-left:1px solid rgba(255,255,255,0.07)">
            ${stats.map(cell).join(`\n            ${divider}\n            `)}
          </div>`;
}

function slide(post, i) {
  const p = PALETTES[i % PALETTES.length];
  const latest = i === 0;
  const badge = latest
    ? `<span style="background:#f5c842;color:#0d2137;font-size:0.62rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;padding:4px 10px;border-radius:4px">🔥 Latest</span>`
    : `<span style="background:rgba(255,255,255,0.15);color:white;font-size:0.62rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;padding:4px 10px;border-radius:4px">${esc(post.tag || audienceLabel(post.audience))}</span>`;
  const cta = latest ? "Read the Breakdown →" : "Read the Guide →";
  return `        <!-- Slide ${i}: ${esc(post.headline)} -->
        <a href="/blog/${post.slug}" class="blog-slide" data-index="${i}" style="display:${latest ? "flex" : "none"};text-decoration:none;background:${p.bg};border-radius:16px;overflow:hidden;transition:box-shadow 0.2s" onmouseover="this.style.boxShadow='0 12px 48px ${p.shadow}'" onmouseout="this.style.boxShadow=''">
          <div style="padding:36px 40px;flex:1">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
              ${badge}
              <span style="font-size:0.72rem;color:rgba(255,255,255,0.4)">${fmtDate(post.datePublished)} · ${post.readMin} min read</span>
            </div>
            <h3 style="font-size:clamp(1.1rem,2.5vw,1.45rem);font-weight:800;color:white;line-height:1.3;letter-spacing:-0.02em;margin:0 0 12px">${esc(post.headline)}</h3>
            <p style="font-size:0.92rem;color:rgba(255,255,255,0.65);line-height:1.65;margin:0 0 24px">${esc(post.description)}</p>
            <div style="display:inline-flex;align-items:center;gap:8px;background:${p.ctaBg};color:${p.ctaFg};font-weight:800;font-size:0.85rem;padding:10px 20px;border-radius:9px">${cta}</div>
          </div>
          ${statPanel(post, p)}
        </a>`;
}

const START = "<!-- BLOG_CAROUSEL:START";
const END = "<!-- BLOG_CAROUSEL:END -->";
let landing = readFileSync(LANDING, "utf8");
const s = landing.indexOf(START);
const e = landing.indexOf(END);
if (s === -1 || e === -1 || e < s) {
  console.error("sync-blog: BLOG_CAROUSEL markers not found in landing.html");
  process.exit(1);
}
const startLineEnd = landing.indexOf("-->", s) + 3;
const carousel = posts.slice(0, CAROUSEL_SIZE).map(slide).join("\n\n");
const nextLanding = landing.slice(0, startLineEnd) + "\n" + carousel + "\n        " + landing.slice(e);
const landingChanged = nextLanding !== landing;
if (landingChanged) writeFileSync(LANDING, nextLanding);

// ---------------------------------------------------------------------------
// 2. Sitemap — keep every non-blog <url> block as-is, rebuild the blog ones
// ---------------------------------------------------------------------------
let sitemap = readFileSync(SITEMAP, "utf8");
const urlBlocks = [...sitemap.matchAll(/\s*<url>[\s\S]*?<\/url>/g)].map((m) => m[0]);
const isBlogPost = (b) => /<loc>https:\/\/acqlerate\.com\/blog\/[^<]+<\/loc>/.test(b);
const kept = urlBlocks.filter((b) => !isBlogPost(b)).map((b) => {
  // The /blog index's lastmod should track the newest post.
  if (/<loc>https:\/\/acqlerate\.com\/blog<\/loc>/.test(b)) {
    return b.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${posts[0].lastmod}</lastmod>`);
  }
  return b;
});
const blogBlocks = posts.map((p) => `
  <url>
    <loc>${SITE}/blog/${p.slug}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
const nextSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${kept.join("")}${blogBlocks.join("")}
</urlset>
`;
const sitemapChanged = nextSitemap !== sitemap;
if (sitemapChanged) writeFileSync(SITEMAP, nextSitemap);

console.log(
  `sync-blog: ${posts.length} posts · carousel → ${posts.slice(0, CAROUSEL_SIZE).map((p) => p.slug).join(", ")}` +
  ` · landing.html ${landingChanged ? "updated" : "unchanged"} · sitemap.xml ${sitemapChanged ? "updated" : "unchanged"} (${kept.length + blogBlocks.length} URLs)`
);
