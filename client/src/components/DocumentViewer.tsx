/**
 * In-app PDF viewer. Loaded on demand (it carries PDF.js, several hundred KB)
 * the first time someone opens a document, never at app start.
 *
 * Pages are drawn to canvases as they come into view and released again when
 * they are far away, so a hundred-page Lesson Book costs a few screens of
 * memory, not a hundred pages of it.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, Loader2, Minus, Plus, Share2 } from 'lucide-react';
// The "legacy" build carries the polyfills older iOS and Android webviews need.
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { DocumentError, fetchDocument, saveDocument } from '@/lib/documents';
import { isNativeApp } from '@/lib/platform';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const GUTTER = 12;          // px either side of a page at fit width
const GAP = 12;             // px between pages
const ZOOMS = [1, 1.5, 2, 3];
// Sharpness vs memory: past 2x a phone canvas costs a lot for little gain.
const MAX_DPR = 2;

interface PageSize { w: number; h: number }

export interface ViewerDoc { url: string; title: string }

export default function DocumentViewer({ doc, onClose }: { doc: ViewerDoc; onClose: () => void }) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [sizes, setSizes] = useState<PageSize[]>([]);
  const [error, setError] = useState<DocumentError | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [zoomIdx, setZoomIdx] = useState(0);
  const [width, setWidth] = useState(0);
  const [current, setCurrent] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const native = isNativeApp();

  // Load: fetch ourselves (for readable errors like "part of Pro"), keep the
  // bytes for the save button, then hand them to PDF.js.
  useEffect(() => {
    let cancelled = false;
    // In PDF.js 6 the loading task owns the worker and is what gets destroyed.
    let task: ReturnType<typeof pdfjs.getDocument> | null = null;
    setPdf(null); setSizes([]); setError(null);
    (async () => {
      try {
        const blob = await fetchDocument(doc.url);
        if (cancelled) return;
        blobRef.current = blob;
        task = pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) });
        const loaded = await task.promise;
        if (cancelled) return;
        const pages = await Promise.all(
          Array.from({ length: loaded.numPages }, (_, i) => loaded.getPage(i + 1)),
        );
        if (cancelled) return;
        setSizes(pages.map(p => { const v = p.getViewport({ scale: 1 }); return { w: v.width, h: v.height }; }));
        setPdf(loaded);
      } catch (e: any) {
        if (!cancelled) setError(e instanceof DocumentError ? e : new DocumentError('Couldn’t open this document.'));
      }
    })();
    return () => { cancelled = true; void task?.destroy(); };
  }, [doc.url, attempt]);

  // Fit-to-width follows the screen, including rotation.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const zoom = ZOOMS[zoomIdx];
  const layout = useMemo(() => {
    if (!width || sizes.length === 0) return null;
    const widest = Math.max(...sizes.map(s => s.w));
    const fit = Math.max(0.1, (width - GUTTER * 2) / widest);
    let top = GAP;
    const pages = sizes.map(s => {
      const w = s.w * fit * zoom, h = s.h * fit * zoom;
      const p = { top, w, h, scale: fit * zoom };
      top += h + GAP;
      return p;
    });
    return { pages, total: top, contentW: widest * fit * zoom + GUTTER * 2 };
  }, [width, sizes, zoom]);

  // Page counter: whichever page crosses the upper third of the screen.
  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || !layout) return;
    const probe = el.scrollTop + el.clientHeight / 3;
    let n = 1;
    for (let i = 0; i < layout.pages.length; i++) if (layout.pages[i].top <= probe) n = i + 1;
    setCurrent(n);
  }, [layout]);

  // Keep the reading position when zooming.
  const changeZoom = (next: number) => {
    const el = scrollerRef.current;
    if (!el || next === zoomIdx) return;
    const ratio = ZOOMS[next] / ZOOMS[zoomIdx];
    const midY = el.scrollTop + el.clientHeight / 2;
    setZoomIdx(next);
    requestAnimationFrame(() => { el.scrollTop = midY * ratio - el.clientHeight / 2; });
  };

  const onSave = async () => {
    setSaving(true); setSaveMsg(null);
    try {
      await saveDocument(doc.url, doc.title, blobRef.current ?? undefined);
    } catch (e: any) {
      setSaveMsg(e?.message || 'Couldn’t save this file.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: 'var(--acq-surface-sunken)' }}
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
      data-testid="document-viewer"
    >
      {/* Top bar */}
      <div
        className="flex shrink-0 items-center gap-2 border-b px-2 pb-2"
        style={{
          background: 'var(--acq-surface-card)',
          borderColor: 'var(--acq-border-subtle)',
          paddingTop: 'calc(env(safe-area-inset-top) + 8px)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ color: 'var(--acq-text-heading)' }}
          aria-label="Close document"
          data-testid="document-close"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold" style={{ color: 'var(--acq-text-heading)' }}>{doc.title}</div>
          <div className="acq-tnum text-xs" style={{ color: 'var(--acq-text-muted)' }}>
            {pdf ? `Page ${current} of ${pdf.numPages}` : error ? ' ' : 'Opening…'}
          </div>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || (!pdf && !error)}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-sm font-bold text-white disabled:opacity-60"
          style={{ background: 'var(--acq-teal)' }}
          data-testid="document-save"
        >
          {saving
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : native ? <Share2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          {native ? 'Save' : 'Download'}
        </button>
      </div>

      {saveMsg && (
        <div className="shrink-0 px-4 py-2 text-center text-xs font-semibold" style={{ background: 'var(--acq-surface-gold-wash)', color: 'var(--acq-text-gold)' }} role="status">
          {saveMsg}
        </div>
      )}

      {/* Pages */}
      <div ref={scrollerRef} onScroll={onScroll} className="acq-scroll relative min-h-0 flex-1 overflow-auto">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="text-3xl" aria-hidden="true">📄</div>
            <p className="text-sm" style={{ color: 'var(--acq-text-body)' }}>{error.message}</p>
            {error.status !== 403 && (
              <button
                type="button"
                onClick={() => setAttempt(a => a + 1)}
                className="rounded-lg px-4 py-2 text-sm font-semibold"
                style={{ background: 'var(--acq-surface-card)', color: 'var(--acq-text-brand)', border: '1px solid var(--acq-border-default)' }}
              >
                Try again
              </button>
            )}
          </div>
        ) : !pdf || !layout ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--acq-text-muted)' }} />
          </div>
        ) : (
          <div className="relative mx-auto" style={{ height: layout.total, width: Math.max(width, layout.contentW) }}>
            {layout.pages.map((p, i) => (
              <PdfPage
                key={i}
                pdf={pdf}
                pageNumber={i + 1}
                box={p}
                left={Math.max(GUTTER, (Math.max(width, layout.contentW) - p.w) / 2)}
                root={scrollerRef}
              />
            ))}
          </div>
        )}
      </div>

      {/* Zoom */}
      {pdf && (
        <div
          className="pointer-events-none absolute inset-x-0 flex justify-center"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
        >
          <div className="pointer-events-auto flex items-center gap-1 rounded-full p-1 shadow-lg" style={{ background: 'var(--acq-surface-card)', border: '1px solid var(--acq-border-subtle)' }}>
            <button type="button" aria-label="Zoom out" disabled={zoomIdx === 0} onClick={() => changeZoom(zoomIdx - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-30" style={{ color: 'var(--acq-text-heading)' }}>
              <Minus className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => changeZoom(0)} className="acq-tnum min-w-[52px] text-center text-xs font-bold" style={{ color: 'var(--acq-text-secondary)' }}
              aria-label="Fit to width">
              {Math.round(zoom * 100)}%
            </button>
            <button type="button" aria-label="Zoom in" disabled={zoomIdx === ZOOMS.length - 1} onClick={() => changeZoom(zoomIdx + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-30" style={{ color: 'var(--acq-text-heading)' }}>
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PdfPage({
  pdf, pageNumber, box, left, root,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  box: { top: number; w: number; h: number; scale: number };
  left: number;
  root: React.RefObject<HTMLDivElement>;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);
  const [drawn, setDrawn] = useState(false);

  // Draw when within a couple of screens; release the pixels when far away.
  useEffect(() => {
    const el = holderRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { root: root.current, rootMargin: '150% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [root]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!near) {
      canvas.width = 0; canvas.height = 0; // hand the memory back
      setDrawn(false);
      return;
    }
    let task: RenderTask | null = null;
    let cancelled = false;
    (async () => {
      const page: PDFPageProxy = await pdf.getPage(pageNumber);
      if (cancelled) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const viewport = page.getViewport({ scale: box.scale * dpr });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      task = page.render({ canvas, canvasContext: ctx, viewport });
      try {
        await task.promise;
        if (!cancelled) setDrawn(true);
      } catch { /* cancelled by a zoom or scroll-away: fine */ }
    })();
    return () => { cancelled = true; task?.cancel(); };
  }, [near, pdf, pageNumber, box.scale]);

  return (
    <div
      ref={holderRef}
      className="absolute overflow-hidden rounded-sm bg-white shadow-md"
      style={{ top: box.top, left, width: box.w, height: box.h }}
      aria-label={`Page ${pageNumber}`}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      {!drawn && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">{pageNumber}</div>
      )}
    </div>
  );
}
