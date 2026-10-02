// Drawn scenes + caption overlay for the Acqlerate video pipeline.
// Driven entirely by edl.json (built by pipeline/edl.py). Rendered frame by frame by pipeline/render.py.
//
//   bootStage(edl, mediaBase)   load fonts + cutouts
//   renderScene(segId, t)       opaque drawn scene (teach / card / cta / rewind)
//   renderOverlay(t)            transparent layer for the whole timeline (captions, name cards, banners)

// ======================= constants =======================
const W = 1080, H = 1920;
const INK = '#1d2b30', TEAL = '#01696f', RED = '#c8352e', GOLD = '#e8a92a',
      NAVY = '#0f172a', PAPER = '#fbfaf6', GRAY = '#8a949a', SKY = '#7fc4e8';
const FONT = {marker: 'Marker', hand: 'Hand', sans: 'Sans'};
let EDL = null, MEDIA = '', NOW = 0, BOIL = 0;

// ======================= helpers =======================
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const eOut = k => 1 - Math.pow(1 - k, 3);
const eInOut = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const eBack = k => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h) % 2000000000 + 1; }

const gen = rough.generator();
const cache = new Map();
function R(type, args, o = {}) {
  const p = o.p ?? 1; if (p <= 0) return '';
  const b = o.still ? 0 : BOIL;
  const opts = Object.assign({roughness: 1.0, bowing: 0.7, stroke: INK, strokeWidth: 5, fillWeight: 3, hachureGap: 11, preserveVertices: true}, o.ro || {});
  opts.seed = hash(type + JSON.stringify(args)) + b * 97;
  const key = type + JSON.stringify(args) + JSON.stringify(opts);
  let paths = cache.get(key);
  if (!paths) { paths = gen.toPaths(gen[type](...args, opts)); cache.set(key, paths); }
  let s = '';
  for (const q of paths) {
    const solidFill = q.fill && q.fill !== 'none';
    if (solidFill && (q.stroke === 'none' || !q.stroke)) s += `<path d="${q.d}" fill="${q.fill}" opacity="${clamp((p - .35) / .5)}"/>`;
    else {
      const dash = p < 1 ? ` pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${1 - p}"` : '';
      s += `<path d="${q.d}" fill="none" stroke="${q.stroke}" stroke-width="${q.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`;
    }
  }
  return o.o !== undefined ? `<g opacity="${o.o}">${s}</g>` : s;
}
const solid = (fill, extra = {}) => ({fill, fillStyle: 'solid', ...extra});
const poly = (pts, o) => R('polygon', [pts], o);
const line = (x1, y1, x2, y2, o) => R('line', [x1, y1, x2, y2], o);
const rect = (x, y, w, h, o) => R('rectangle', [x, y, w, h], o);
const ell = (cx, cy, w, h, o) => R('ellipse', [cx, cy, w, h], o);
const path = (d, o) => R('path', [d], o);

function T(x, y, str, o = {}) {
  const p = o.p ?? 1; if (p <= 0) return '';
  let s = String(str);
  if (o.type) s = s.slice(0, Math.round(s.length * p));
  const op = o.type ? (o.o ?? 1) : (o.o ?? 1) * clamp(p * 1.5);
  const f = FONT[o.font || 'hand'];
  const wgt = o.weight || (o.font === 'sans' ? 800 : 700);
  const outline = o.outline ? ` stroke="${o.outline}" stroke-width="${o.ow || 10}" paint-order="stroke" stroke-linejoin="round"` : '';
  return `<text x="${x}" y="${y}" font-family="${f}" font-weight="${wgt}" font-size="${o.size || 60}" fill="${o.color || INK}" text-anchor="${o.anchor || 'middle'}" letter-spacing="${o.ls || 0}" opacity="${op}"${outline}${o.r ? ` transform="rotate(${o.r} ${x} ${y})"` : ''}>${esc(s)}</text>`;
}
function G(inner, o = {}) {
  if (!inner) return '';
  const x = o.x || 0, y = o.y || 0, s = o.s ?? 1, sx = (o.sx ?? 1) * s, r = o.r || 0;
  return `<g transform="translate(${x} ${y}) rotate(${r}) scale(${sx} ${s})"${o.o !== undefined ? ` opacity="${o.o}"` : ''}>${inner}</g>`;
}
// Fit text size so a line stays inside maxW (rough glyph-width estimate per font).
function fitSize(str, size, maxW, font = 'hand') {
  const k = {marker: .62, hand: .42, sans: .6}[font] || .55;
  const w = String(str).length * size * k;
  return w > maxW ? Math.floor(size * maxW / w) : size;
}
function cutout(name) { return (EDL.cutouts || {})[name]; }
function img(name, x, y, w, h, crop, o = 1) {
  const c = cutout(name); if (!c) return '';
  const cr = (typeof crop === 'string' ? (c.crop || {})[crop] : crop) || [0, 0, 768, 1376];
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${cr.join(' ')}" preserveAspectRatio="xMidYMid meet" opacity="${o}"><image href="${MEDIA}${c.file}" width="768" height="1376"/></svg>`;
}
function shadowDefs() {
  return `<defs><filter id="ds" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity=".25"/></filter>
  <pattern id="scan" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="3" fill="#000" opacity=".28"/></pattern></defs>`;
}

// ======================= timeline lookups =======================
const SEG = id => EDL.segments.find(s => s.id === id);
const LN = id => EDL.lines.find(l => l.id === id);
function WA(lid, needle, fallback) {  // absolute time of a word in a line
  const l = LN(lid); if (!l) return fallback ?? 0;
  const ws = l.words.filter(w => w.w.toLowerCase().replace(/[^a-z0-9$']/g, '').startsWith(String(needle).toLowerCase()));
  if (!ws[0]) console.error('WA miss', lid, needle);
  return ws[0] ? ws[0].s : (fallback ?? l.start);
}
const WREF = (ref, fallback) => ref ? WA(ref.line, ref.w, fallback) : fallback;  // {line, w}
const beatOf = s => (EDL.beats || []).find(b => b.id === s.beat) || {};
const charName = () => (EDL.cast[EDL.character] || {}).name || 'Hank';

// ======================= props =======================
function nameCard(x, y, name, title, o = {}) {
  const p = o.p ?? 1; if (p <= 0) return '';
  const k = eBack(clamp(p * 2.2));
  let s = poly([[-330, -120], [340, -138], [330, 110], [-340, 124]], {ro: solid(INK, {stroke: INK}), still: 1});
  s += T(0, -10, name, {font: 'marker', size: fitSize(name, 118, 620, 'marker'), color: '#fff'});
  s += T(0, 78, title, {font: 'marker', size: fitSize(title, 54, 620, 'marker'), color: GOLD, ls: 2});
  if (o.strike) s += line(-250, 60, lerp(-250, 250, o.strike), 60, {ro: {stroke: RED, strokeWidth: 12}, still: 1});
  if (o.newTitle) s += T(0, 172, o.newTitle, {font: 'marker', size: fitSize(o.newTitle, 64, 640, 'marker'), color: RED, p: o.newP ?? 1, type: 1, r: -3});
  return G(s, {x, y, s: 1.6 - .6 * k, r: -4, o: clamp(p * 4)});
}
function stamp(x, y, text, o = {}) {
  const p = o.p ?? 1; if (p <= 0) return '';
  const k = eOut(clamp(p * 3));
  let s = rect(-420, -100, 840, 200, {ro: {stroke: RED, strokeWidth: 14}, still: 1}) + rect(-400, -82, 800, 164, {ro: {stroke: RED, strokeWidth: 5}, still: 1});
  s += T(0, 44, text, {font: 'marker', size: fitSize(text, 128, 760, 'marker'), color: RED, ls: 2});
  return G(s, {x, y, r: -9, s: lerp(2.4, 1, k), o: clamp(p * 5) * .95});
}
function logo(x, y, s = 1) {
  return G(`<image href="acqlerate-icon.svg" x="-330" y="-70" width="140" height="140"/>` +
    `<text x="-165" y="44" font-family="Sans" font-weight="900" font-size="112" letter-spacing="-3"><tspan fill="${NAVY}">Acq</tspan><tspan fill="${TEAL}">lerate</tspan></text>`, {x, y, s});
}
function check(x, y, label, o = {}) {
  const p = o.p ?? 1; if (p <= 0) return '';
  let s = rect(-40, -40, 80, 80, {ro: solid('#fff'), still: 1});
  s += path('M -26 -4 L -6 20 L 34 -34', {p: seg(p, .2, .7), ro: {stroke: TEAL, strokeWidth: 12}});
  s += T(80, 22, label, {font: 'hand', size: fitSize(label, 76, 780, 'hand'), anchor: 'start', p: seg(p, .3, 1), type: 1});
  return G(s, {x, y, o: clamp(p * 4)});
}
function pill(x, y, text, col, o = {}) {
  const w = Math.max(300, text.length * 26 + 90);
  return G(rect(-w / 2, -44, w, 88, {ro: solid(col, {stroke: col}), still: 1}) + T(0, 18, text, {font: 'marker', size: fitSize(text, 40, w - 40, 'marker'), color: '#fff'}),
    {x, y, s: o.s ?? 1, o: o.o ?? 1, r: o.r || 0});
}

// ======================= drawn scenes (opaque) =======================
const SC = {};
SC.rewind = () => '';   // background is the reversed story montage (composited by ffmpeg)

SC.teach = (t, s) => {
  const B = s.board || {}, LS = B.line_starts || {};
  const ids = s.line_ids || [];
  const tQ = LS[(B.question || {}).line] ?? LS[ids[0]] ?? s.start + .2;
  let s1 = '', s2 = '';
  // ---- phase 1: the question + evidence
  const q = (B.question || {}).lines || [];
  if (q[0]) s1 += T(540, 190, q[0], {font: 'marker', size: fitSize(q[0], 84, 1000, 'marker'), p: seg(t, tQ - .1, tQ + .4), type: 1});
  if (q[1]) s1 += T(540, 290, q[1], {font: 'marker', size: fitSize(q[1], 84, 1000, 'marker'), color: TEAL, p: seg(t, tQ + .2, tQ + .6), type: 1});
  const ev = B.evidence || [];
  const evX = ev.length === 1 ? [540] : [320, 850];
  ev.slice(0, 2).forEach((e, i) => {
    const tw = WREF(e.word, tQ + .8 + i * .6);
    const k = eBack(seg(t, tw - .25, tw + .1));
    s1 += G(`<g filter="url(#ds)">${img(e.cutout, -250, -300, 500, 600, 'body')}</g>`, {x: evX[i], y: 800, s: 1.12 * k, o: clamp(k * 2)});
    const lp = seg(t, tw + (e.good ? .1 : .5), tw + (e.good ? .45 : .85));
    s1 += pill(evX[i], 1200, e.label, e.good ? TEAL : RED, {s: eBack(lp), o: clamp(lp * 3), r: e.good ? 0 : -3});
  });
  // ---- phase 2: the comparison
  const C = B.compare;
  let phase2 = 0;
  if (C) {
    const tC = LS[C.line] ?? tQ + 3;
    phase2 = seg(t, tC - .35, tC + .05);
    const tReveal = WREF(C.reveal_word, tC + .6), tFill = WREF(C.fill_word, tC + 1.4);
    const cardP = eBack(seg(t, tReveal - .45, tReveal - .1));
    const box = (x, col, c, pr) => G(rect(-235, -230, 470, 460, {ro: solid('#fff', {stroke: col, strokeWidth: 9}), still: 1}) +
      rect(-235, -230, 470, 110, {ro: solid(col, {stroke: col}), still: 1}) + T(0, -152, c.title, {font: 'marker', size: fitSize(c.title, 66, 430, 'marker'), color: '#fff'}) +
      T(0, -40, c.l1, {size: fitSize(c.l1, 52, 440)}) + T(0, 30, c.l2, {size: fitSize(c.l2, 46, 440), p: pr, type: 1}) +
      (c.big ? T(0, 160, c.big, {font: 'marker', size: fitSize(c.big, 96, 420, 'marker'), color: col, p: pr}) : ''), {x, y: 470, s: cardP, o: clamp(cardP * 3)});
    s2 += T(540, 170, C.title, {font: 'marker', size: fitSize(C.title, 72, 1000, 'marker'), p: seg(t, tC, tC + .5), type: 1});
    const pr = seg(t, tFill, tFill + .7);
    s2 += box(283, C.a.good === false ? RED : TEAL, C.a, pr);
    s2 += box(797, C.b.good ? TEAL : RED, C.b, pr);
    if (C.pin_cutout) {
      const pin = eBack(seg(t, tReveal + .1, tReveal + .4));
      s2 += G(`<g filter="url(#ds)">${img(C.pin_cutout, -95, -95, 190, 190, 'face')}</g>` + ell(0, 0, 196, 196, {ro: {stroke: RED, strokeWidth: 8}, still: 1}), {x: 975, y: 750, s: .8 * pin, o: clamp(pin * 2), r: 10});
    }
  }
  const P = B.punch;
  if (P) {
    const tP = WREF(P.word, (LS[ids[2]] ?? s.start + 6));
    const cash = seg(t, tP - .1, tP + .6);
    s2 += G(rect(-60, -34, 120, 68, {ro: solid('#8bc48a', {stroke: '#3d7a3c'}), still: 1}) + T(0, 16, '$', {font: 'marker', size: 48, color: '#2c5e2b'}), {x: 150, y: 820, o: clamp(cash * 3), s: eBack(cash)});
    s2 += T(560, 842, P.text, {size: fitSize(P.text, 72, 780), p: cash, type: 1});
  }
  const S = B.shrink;
  if (S) {
    const tL = WREF(S.label_word, s.start + 7), tTo = WREF(S.to_word, tL + 1.5), tr = s.trombone ?? tTo + .6;
    const po = seg(t, tL - .1, tL + .25), kk = seg(t, tTo - .05, tTo + .35);
    s2 += T(540, 990, S.label, {font: 'marker', size: fitSize(S.label, 54, 1000, 'marker'), o: po});
    s2 += G(T(0, 0, S.from, {font: 'marker', size: fitSize(S.from, 170, 700, 'marker')}), {x: 540, y: 1180, o: po * (1 - .6 * kk), s: 1 - .15 * kk});
    s2 += line(380, 1130, lerp(380, 700, kk), 1120, {p: kk > 0 ? 1 : 0, ro: {stroke: RED, strokeWidth: 18}, still: 1});
    const sad = seg(t, tr, tr + 1.1);
    s2 += G(T(0, 0, S.to, {font: 'marker', size: fitSize(S.to, 190, 560, 'marker'), color: RED, p: seg(t, tTo + .25, tTo + .45)}), {x: 800, y: 1370 + 30 * sad, r: -8 + 14 * sad});
  }
  const sl = eInOut(phase2);
  return G(s1, {y: -1920 * sl, o: 1 - sl}) + G(s2, {y: 1920 * (1 - sl), o: sl});
};

SC.card = (t, s) => {
  const l = LN(s.line), t0 = l ? l.start : s.start + .3, u = t - s.start;
  let o = rect(190, 130, 700, 700, {p: seg(u, 0, .25), ro: solid('#e9eef0')});
  if (s.cutout) {
    o += `<clipPath id="pf"><rect x="198" y="138" width="684" height="684"/></clipPath>`;
    o += `<g clip-path="url(#pf)" opacity="${seg(u, .05, .3)}">${img(s.cutout, 190, 130, 700, 700, 'portrait')}</g>`;
  }
  o += stamp(540, 700, s.stamp, {p: seg(t, t0 - .05, t0 + .2)});
  (s.checks || []).forEach((c, i) => {
    const tc = c.w ? WA(s.line, c.w, t0 + .8 + i * .9) : t0 + .8 + i * .9;
    o += check(200, 1010 + i * 150, c.text, {p: seg(t, tc, tc + .4)});
  });
  return o;
};

SC.cta = (t, s) => {
  const l = LN(s.line), t0 = l ? l.start : s.start + .1, u = t - s.start;
  const tT = s.title_word ? WA(s.line, s.title_word, t0) : t0, tM = s.module_word ? WA(s.line, s.module_word, t0 + .9) : t0 + .9, tU = s.url_word ? WA(s.line, s.url_word, t0 + 1.6) : t0 + 1.6;
  let o = logo(540, 520, 1.15 * eBack(seg(u, 0, .35)));
  o += T(540, 760, s.title, {font: 'marker', size: fitSize(s.title, 88, 1000, 'marker'), p: seg(t, tT, tT + .5), type: 1});
  o += T(540, 860, s.module, {size: fitSize(s.module, 72, 1000), color: GRAY, p: seg(t, tM, tM + .45), type: 1});
  o += G(rect(-310, -64, 620, 128, {ro: solid(TEAL, {stroke: TEAL})}) + T(0, 24, 'acqlerate.com', {font: 'sans', size: 68, color: '#fff'}), {x: 440, y: 1040, s: eBack(seg(t, tU - .1, tU + .25)), o: seg(t, tU - .1, tU)});
  if (s.cutout) o += G(`<g filter="url(#ds)">${img(s.cutout, -170, -310, 340, 610, 'full')}</g>`, {x: 895, y: 1250, s: .85 * eBack(seg(u, .6, 1.0)), o: seg(u, .6, .7)});
  return o;
};

// ======================= overlay layer (transparent, whole timeline) =======================
function captionsAt(t) {
  const l = EDL.lines.find(x => t >= x.start - .05 && t <= x.start + x.dur + .3);
  if (!l) return '';
  const ws = l.words; const chunks = []; let cur = [];
  ws.forEach((w, i) => { cur.push(i); if (cur.length >= 5 || /[.?!,]$/.test(w.w) || i === ws.length - 1) { chunks.push(cur); cur = []; } });
  let idx = 0; chunks.forEach((c, i) => { if (t >= ws[c[0]].s - .05) idx = i; });
  const c = chunks[idx], cast = EDL.cast[l.spk] || {}, hi = cast.caption_color || '#ffd24a';
  let tsp = '';
  c.forEach((i, k) => { const on = t >= ws[i].s && (k === c.length - 1 || t < ws[c[k + 1]].s); tsp += `<tspan fill="${on ? hi : '#fff'}">${esc(ws[i].w)} </tspan>`; });
  const txt = c.map(i => ws[i].w).join(' '), fs = txt.length > 30 ? 56 : 64, w = Math.min(1010, txt.length * fs * .56 + 90);
  const tag = cast.tag || '';
  const y = 1500;
  return (tag ? `<rect x="${W / 2 - 110}" y="${y - 44}" width="220" height="40" rx="20" fill="${cast.tag_color || '#1b6f8f'}"/><text x="${W / 2}" y="${y - 14}" font-family="Sans" font-weight="900" font-size="26" letter-spacing="3" fill="#fff" text-anchor="middle">${tag}</text>` : '') +
    `<rect x="${W / 2 - w / 2}" y="${y}" width="${w}" height="${fs + 50}" rx="24" fill="${INK}" opacity=".88"/>` +
    `<text x="${W / 2}" y="${y + fs + 9}" font-family="Sans" font-weight="800" font-size="${fs}" text-anchor="middle">${tsp}</text>`;
}
function overlayAt(t) {
  let o = '';
  const segs = EDL.segments;
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i], b = beatOf(s), ov = b.overlay || {};
    const next = segs[i + 1], end = s.start + s.dur;
    const inSeg = t >= s.start && t < end;
    // title card (first beat): typed on, held until the next beat starts
    if (ov.title && t >= s.start && t < (next ? next.start : end)) {
      const u = t - s.start;
      const [a, b2] = ov.title;
      o += T(540, 300, a, {font: 'marker', size: fitSize(a, 110, 1000, 'marker'), color: '#fff', outline: INK, ow: 14, p: seg(u, .1, .7), type: 1});
      if (b2) o += T(540, 420, b2, {font: 'marker', size: fitSize(b2, 84, 1000, 'marker'), color: GOLD, outline: INK, ow: 12, p: seg(u, .7, 1.4), type: 1});
    }
    // name card
    if (ov.namecard && s.kind === 'clip' && !s.freeze) {
      const nc = ov.namecard;
      if (nc.strike_word) {           // strike-through variant lives inside this segment
        if (inSeg) {
          const tg = WA(s.beat, nc.strike_word, s.start + 1.5) + .1;
          o += nameCard(540, 250, nc.name, nc.title, {p: seg(t, s.start + .1, s.start + .4), strike: seg(t, tg, tg + .25), newTitle: nc.new_title, newP: seg(t, tg + .25, tg + .7)});
        }
      } else {
        const hold = s.start + s.dur + (nc.hold ?? 0);
        if (t >= s.start && t < hold) {
          const p = seg(t, s.start + .15, s.start + .5), out = seg(t, hold - .3, hold);
          o += `<g opacity="${1 - out}">${nameCard(540, 250, nc.name, nc.title, {p})}</g>`;
        }
      }
    }
    // banner (held through the freeze that follows)
    if (ov.banner && s.kind === 'clip' && !s.freeze) {
      const fz = next && next.freeze ? next.dur : 0;
      if (t >= s.start && t < end + fz) {
        const p = eBack(seg(t, s.start + .15, s.start + .5));
        o += G(rect(-400, -90, 800, 180, {ro: solid(GOLD)}) + T(0, 36, ov.banner, {font: 'marker', size: fitSize(ov.banner, 104, 740, 'marker')}), {x: 540, y: 250, r: -3, s: p, o: clamp(p * 3)});
      }
    }
    if (s.freeze && inSeg) o += T(540, 760, s.label || '*record scratch*', {font: 'hand', size: 86, color: '#fff', outline: INK, ow: 12, r: -6});
    if (ov.pop_text && inSeg) {
      const pt = ov.pop_text, at = s.start + pt.at;
      if (t > at && t < at + (pt.dur || .6)) o += T(pt.x || 760, pt.y || 820, pt.text, {font: 'hand', size: 80, color: '#fff', outline: INK, ow: 10, r: -8});
    }
    if (s.scene === 'rewind' && inSeg) {
      o += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#scan)"/><rect x="0" y="0" width="${W}" height="${H}" fill="#2a4d8f" opacity=".12"/>`;
      o += T(70, 170, '◀◀ REWIND', {font: 'sans', size: 72, anchor: 'start', color: '#fff', outline: INK, ow: 12});
      o += T(1010, 170, 'PLAY', {font: 'sans', size: 40, anchor: 'end', color: '#fff', outline: INK, ow: 8, o: Math.floor(t * 4) % 2 ? 1 : .2});
    }
    if (ov.lowerthird && t >= s.start) {
      const p = eBack(seg(t, s.start + .2, s.start + .55));
      o += G(rect(-320, -62, 640, 124, {ro: solid(TEAL, {stroke: TEAL}), still: 1}) + T(0, 22, ov.lowerthird, {font: 'sans', size: 64, color: '#fff'}), {x: 540, y: 240, s: p, o: clamp(p * 3)});
    }
  }
  o += captionsAt(t);
  return o;
}

// ======================= entry points =======================
window.renderScene = (id, t) => {
  NOW = t; BOIL = Math.floor(t * 8) % 3;
  const s = SEG(id);
  const zoom = 1 + .02 * seg(t - s.start, 0, s.dur);
  document.getElementById('stage').innerHTML = shadowDefs() + `<rect x="0" y="0" width="${W}" height="${H}" fill="${PAPER}"/>` +
    `<g transform="translate(${W / 2} ${H / 2}) scale(${zoom}) translate(${-W / 2} ${-H / 2})">${SC[s.scene](t, s)}</g>`;
};
window.renderOverlay = (t) => {
  NOW = t; BOIL = Math.floor(t * 8) % 3;
  document.getElementById('stage').innerHTML = shadowDefs() + overlayAt(t);
};
window.bootStage = async (edl, mediaBase) => {
  EDL = edl; MEDIA = mediaBase || '';
  await document.fonts.load('40px Marker'); await document.fonts.load('700 40px Hand'); await document.fonts.load('800 40px Sans'); await document.fonts.load('900 40px Sans'); await document.fonts.ready;
  await Promise.all(Object.values(EDL.cutouts || {}).map(c => new Promise(r => { const i = new Image(); i.onload = r; i.onerror = r; i.src = MEDIA + c.file; })));
  return true;
};
