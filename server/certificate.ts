// Certificate of Completion PDF. Letter landscape, built with pdfkit so it runs
// in the Node image with nothing else installed. (It used to shell out to
// python3 + reportlab, which the Railway image does not ship.)
//
// Brand: General Sans (the site's own woff2 files), teal #01696F, navy #0F172A,
// gold only on the CLP badge (gold = rewards). The icon is a raster of
// brand/acqlerate-icon.svg at 640px, about 800 dpi at the size printed here.
import path from "path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export interface CertificateData {
  name: string;
  moduleTitle: string;
  clps: number;
  date: string;
  certId: string;
  functionalAreas: readonly string[];
}

const NAVY = "#0F172A";
const TEAL = "#01696F";
const MUTED = "#5B6472";
const RULE = "#D5DDE0";
const GOLD_HI = "#EBCB6B";
const GOLD = "#D9B64C";
const GOLD_DEEP = "#A8842A";

const W = 792;
const H = 612;

const FONT_DIR = path.join(process.cwd(), "client", "public", "fonts");
const ICON = path.join(process.cwd(), "server", "assets", "certificate", "acqlerate-icon.png");

function hexagon(cx: number, cy: number, r: number, rotateDeg = 0): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = ((60 * i + rotateDeg) * Math.PI) / 180;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

/** Largest size (down to min) at which text fits on one line. */
function fitSize(doc: PDFKit.PDFDocument, text: string, font: string, max: number, min: number, width: number): number {
  let size = max;
  doc.font(font);
  while (size > min && doc.fontSize(size).widthOfString(text) > width) size -= 0.5;
  return size;
}

/**
 * Lines for text in the current font and size, at most two, split where the
 * two lines are closest in width (no single orphan word on line two).
 */
function balancedLines(doc: PDFKit.PDFDocument, text: string, width: number): string[] {
  if (doc.widthOfString(text) <= width) return [text];
  const words = text.split(/\s+/);
  let best: string[] | null = null;
  let bestMax = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const m = Math.max(doc.widthOfString(a), doc.widthOfString(b));
    if (m <= width && m < bestMax) { best = [a, b]; bestMax = m; }
  }
  return best ?? [text];
}

export async function renderCertificate(data: CertificateData): Promise<Buffer> {
  const verifyUrl = `https://acqlerate.com/verify/${data.certId}`;
  const clps = Number(data.clps || 0).toFixed(1);
  const areas = data.functionalAreas.length ? data.functionalAreas.join("  ·  ") : "Program Management (PM)";

  const doc = new PDFDocument({
    size: "LETTER",
    layout: "landscape",
    margin: 0,
    info: {
      Title: `Acqlerate Certificate of Completion: ${data.moduleTitle}`,
      Author: "Acqlerate",
      Subject: `${data.name} completed ${data.moduleTitle} (${clps} CLPs). Certificate ID ${data.certId}.`,
      Keywords: "Acqlerate, certificate, CLP, DAWIA, continuous learning",
      Creator: "acqlerate.com",
    },
  });
  for (const w of ["Regular", "Medium", "Semibold", "Bold"]) {
    doc.registerFont(w, path.join(FONT_DIR, `GeneralSans-${w}.woff2`));
  }
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  // ── Page and frame ────────────────────────────────────────────────────────
  doc.rect(0, 0, W, H).fill("#FFFFFF");

  const bandX = 548;
  const bandTop = 24;
  const bandW = W - 24 - bandX;
  const bandH = H - 48;

  // Right band: the icon tile's gradient.
  const grad = doc.linearGradient(bandX, bandTop, bandX + bandW, bandTop + bandH);
  grad.stop(0, "#0B868C").stop(0.47, "#01696F").stop(1, "#063C46");
  doc.rect(bandX, bandTop, bandW, bandH).fill(grad);

  // Watermark: the mark's outer and inner hexagons, large and faint, off the band's edge.
  doc.save();
  doc.rect(bandX, bandTop, bandW, bandH).clip();
  doc.lineJoin("round").strokeOpacity(0.07).strokeColor("#FFFFFF");
  doc.lineWidth(22).polygon(...hexagon(bandX + bandW * 0.78, bandTop + 128, 170)).stroke();
  doc.lineWidth(18).polygon(...hexagon(bandX + bandW * 0.78, bandTop + 128, 80, 30)).stroke();
  doc.restore();

  // Double rule around the whole certificate.
  doc.lineJoin("miter").strokeOpacity(1);
  doc.lineWidth(1.4).strokeColor(TEAL).rect(18, 18, W - 36, H - 36).stroke();
  doc.lineWidth(0.6).strokeColor(TEAL).strokeOpacity(0.45).rect(24, 24, W - 48, H - 48).stroke();
  doc.strokeOpacity(1);

  // ── Left: lockup ──────────────────────────────────────────────────────────
  const L = 64;
  const colW = bandX - L - 40; // 444
  doc.image(ICON, L, 56, { width: 50, height: 50 });
  doc.font("Bold").fontSize(30);
  const acqW = doc.widthOfString("Acq");
  doc.fillColor(NAVY).text("Acq", L + 62, 58, { lineBreak: false });
  doc.fillColor(TEAL).text("lerate", L + 62 + acqW, 58, { lineBreak: false });
  doc.font("Semibold").fontSize(7.5).fillColor(MUTED)
    .text("PLAIN-ENGLISH DOD ACQUISITION TRAINING", L + 63, 97, { characterSpacing: 1.2, lineBreak: false });

  // ── Left: statement ───────────────────────────────────────────────────────
  let y = 150;
  doc.font("Semibold").fontSize(11).fillColor(TEAL)
    .text("CERTIFICATE OF COMPLETION", L, y, { characterSpacing: 3, lineBreak: false });
  y += 30;
  doc.font("Regular").fontSize(12).fillColor(MUTED).text("This certifies that", L, y, { lineBreak: false });
  y += 22;

  // Name: one line, shrinking to fit; two balanced lines only if it still
  // won't fit at 24pt.
  const nameSize = fitSize(doc, data.name, "Semibold", 40, 24, colW);
  doc.font("Semibold").fontSize(nameSize).fillColor(NAVY);
  const nameLines = balancedLines(doc, data.name, colW);
  for (const line of nameLines) {
    doc.text(line, L, y, { width: colW, height: nameSize * 1.3, ellipsis: true, lineBreak: false });
    y += nameSize * 1.12;
  }
  y += 10;
  doc.rect(L, y, 56, 3).fill(TEAL);
  y += 20;

  doc.font("Regular").fontSize(12).fillColor(MUTED).text("has successfully completed", L, y, { lineBreak: false });
  y += 22;

  // Course title: up to two balanced lines, shrinking if two won't hold it.
  let titleSize = 23;
  doc.font("Semibold").fontSize(titleSize);
  let titleLines = balancedLines(doc, data.moduleTitle, colW);
  while (titleSize > 15 && titleLines.some((l) => doc.widthOfString(l) > colW)) {
    titleSize -= 0.5;
    doc.fontSize(titleSize);
    titleLines = balancedLines(doc, data.moduleTitle, colW);
  }
  doc.fillColor(TEAL);
  for (const line of titleLines) {
    doc.text(line, L, y, { width: colW, height: titleSize * 1.3, ellipsis: true, lineBreak: false });
    y += titleSize * 1.25;
  }
  y += 6;
  doc.font("Regular").fontSize(9.5).fillColor(MUTED)
    .text("A self-paced online course from Acqlerate (acqlerate.com), an independent training provider.", L, y, { width: colW });

  // ── Left: details ─────────────────────────────────────────────────────────
  const gridTop = 408;
  doc.rect(L, gridTop - 14, colW, 0.75).fill(RULE);
  const cols: [string, string, number][] = [
    ["DATE COMPLETED", data.date, 0],
    ["INSTRUCTION HOURS", `${clps} hours`, 150],
    ["SELF-REPORT IN", "CAPPMIS (Army) / eDACM (Navy/AF) / FAITAS (Civ)", 270],
  ];
  for (const [label, value, dx] of cols) {
    doc.font("Semibold").fontSize(7).fillColor(TEAL).text(label, L + dx, gridTop, { characterSpacing: 1.2, lineBreak: false });
    const vw = dx === 270 ? colW - 270 : 140;
    doc.font("Medium").fontSize(dx === 270 ? 9 : 11).fillColor(NAVY).text(value, L + dx, gridTop + 12, { width: vw, lineGap: 1 });
  }
  const faTop = gridTop + 46;
  doc.font("Semibold").fontSize(7).fillColor(TEAL).text("DAWIA FUNCTIONAL AREAS", L, faTop, { characterSpacing: 1.2, lineBreak: false });
  doc.font("Medium").fontSize(11).fillColor(NAVY).text(areas, L, faTop + 12, { width: colW });

  // Self-report note and disclaimer.
  const noteTop = 510;
  doc.rect(L, noteTop - 12, colW, 0.75).fill(RULE);
  doc.font("Regular").fontSize(7.5).fillColor(MUTED).text(
    "This certificate documents completion of self-paced online training. DAW members may self-report it as " +
      "External Training in their WarU learning portal; the supervisor decides the points. Content maps to DAWIA " +
      "functional area requirements per WarU (formerly DAU) CLP policy.",
    L, noteTop, { width: colW, lineGap: 1.5 },
  );
  doc.font("Medium").fontSize(7).fillColor(MUTED)
    .text("Not affiliated with WarU, DoD, or any government agency.", L, H - 52, { width: colW, lineBreak: false });

  // ── Right band: the CLP badge ─────────────────────────────────────────────
  const cx = bandX + bandW / 2;
  doc.font("Semibold").fontSize(8).fillColor("#FFFFFF").fillOpacity(0.85)
    .text("EARNED", bandX, 70, { width: bandW, align: "center", characterSpacing: 3, lineBreak: false });
  doc.fillOpacity(1);

  const by = 176;
  const badgeGrad = doc.linearGradient(cx - 60, by - 70, cx + 60, by + 70);
  badgeGrad.stop(0, GOLD_HI).stop(0.55, GOLD).stop(1, GOLD_DEEP);
  // Soft shadow, then the badge, then an inner hexagon rule.
  doc.save().fillOpacity(0.25).fillColor("#012A30").polygon(...hexagon(cx + 1.5, by + 4, 74)).fill().restore();
  doc.lineJoin("round").polygon(...hexagon(cx, by, 74)).fill(badgeGrad);
  doc.lineWidth(1.4).strokeColor("#FFFFFF").strokeOpacity(0.7).polygon(...hexagon(cx, by, 64)).stroke();
  doc.strokeOpacity(1);
  doc.font("Bold").fontSize(40).fillColor(NAVY)
    .text(clps, bandX, by - 30, { width: bandW, align: "center", lineBreak: false });
  doc.font("Semibold").fontSize(9).fillColor(NAVY)
    .text("CLPs", bandX, by + 14, { width: bandW, align: "center", characterSpacing: 2.5, lineBreak: false });

  doc.font("Semibold").fontSize(10.5).fillColor("#FFFFFF")
    .text("Continuous Learning Points", bandX, by + 92, { width: bandW, align: "center", lineBreak: false });
  doc.font("Regular").fontSize(8.5).fillColor("#FFFFFF").fillOpacity(0.78)
    .text("1 CLP = 1 hour of instruction", bandX, by + 108, { width: bandW, align: "center", lineBreak: false });
  doc.fillOpacity(1);

  // ── Right band: verify ────────────────────────────────────────────────────
  const qr = QRCode.create(verifyUrl, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const tile = 104;
  const quiet = 8;
  const cell = (tile - quiet * 2) / n;
  const qx = cx - tile / 2;
  const qy = 372;
  doc.roundedRect(qx, qy, tile, tile, 8).fill("#FFFFFF");
  doc.fillColor(NAVY);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.get(r, c)) doc.rect(qx + quiet + c * cell, qy + quiet + r * cell, cell + 0.05, cell + 0.05);
    }
  }
  doc.fill();
  doc.link(qx, qy, tile, tile, verifyUrl);

  doc.font("Semibold").fontSize(8).fillColor("#FFFFFF").fillOpacity(0.85)
    .text("SCAN TO VERIFY", bandX, qy + tile + 12, { width: bandW, align: "center", characterSpacing: 2, lineBreak: false });
  doc.fillOpacity(1);
  doc.font("Bold").fontSize(12).fillColor("#FFFFFF")
    .text(data.certId, bandX, qy + tile + 26, { width: bandW, align: "center", characterSpacing: 0.8, lineBreak: false });
  doc.font("Regular").fontSize(7.5).fillColor("#FFFFFF").fillOpacity(0.78)
    .text(`acqlerate.com/verify/${data.certId}`, bandX, qy + tile + 44, {
      width: bandW, align: "center", lineBreak: false, link: verifyUrl,
    });
  doc.fillOpacity(1);

  doc.end();
  return done;
}
