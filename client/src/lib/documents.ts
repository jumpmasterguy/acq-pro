// ─── Documents: what kind a file is, and saving it ─────────────────────────
//
// The app's webview can't show a PDF (Android) or hand a file to the phone
// (either platform), so plain download links did nothing useful in the app.
// PDFs now open in our own viewer (components/DocumentViewer.tsx); saving goes
// through here, which does the right thing per platform:
//
//   browser   an ordinary download
//   app       write the file to the app's cache, then open the system share
//             sheet: Save to Files, open in Excel or Sheets, email, AirDrop

import { isNativeApp } from './platform';

export type DocKind = 'pdf' | 'sheet' | 'doc' | 'other';

export function docKind(url: string): DocKind {
  const path = url.split(/[?#]/)[0].toLowerCase();
  // The Lesson Book route serves PDFs without a .pdf in the URL.
  if (path.endsWith('.pdf') || path.startsWith('/api/lesson-book/')) return 'pdf';
  if (/\.(xlsx|xls|csv)$/.test(path)) return 'sheet';
  if (/\.(docx|doc)$/.test(path)) return 'doc';
  return 'other';
}

/** A readable file name for the saved copy. */
export function fileNameFor(url: string, title?: string): string {
  const path = url.split(/[?#]/)[0];
  const last = decodeURIComponent(path.split('/').pop() || 'document');
  const hasExt = /\.[a-z0-9]{2,5}$/i.test(last);
  if (hasExt) return last;
  // /api/lesson-book/finance → "Lesson Book - Defense Finance.pdf"
  const base = (title || last).replace(/[\\/:*?"<>|]+/g, '').trim() || 'document';
  return docKind(url) === 'pdf' ? `${base}.pdf` : base;
}

export class DocumentError extends Error {
  constructor(message: string, readonly status?: number) { super(message); }
}

/** Fetches a document the way the viewer and the save button both need it. */
export async function fetchDocument(url: string): Promise<Blob> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    let message = res.status === 403
      ? 'This document is part of Pro.'
      : res.status === 401
        ? 'Please sign in again to open this.'
        : 'Couldn’t load this document.';
    try {
      const body = await res.clone().json();
      if (body?.message) message = body.message;
    } catch { /* not JSON */ }
    throw new DocumentError(message, res.status);
  }
  return res.blob();
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const s = String(reader.result);
      resolve(s.slice(s.indexOf(',') + 1)); // strip "data:...;base64,"
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Save (browser) or share (app). Resolves quietly if the learner dismisses
 * the share sheet; rejects with a message worth showing otherwise.
 */
export async function saveDocument(url: string, title?: string, blob?: Blob): Promise<void> {
  const name = fileNameFor(url, title);

  if (!isNativeApp()) {
    const data = blob ?? await fetchDocument(url);
    const href = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 30_000);
    return;
  }

  const { Capacitor } = await import('@capacitor/core');
  if (!Capacitor.isPluginAvailable('Filesystem') || !Capacitor.isPluginAvailable('Share')) {
    // The app on this phone predates the save feature (the plugins are
    // native code, so they arrive with an app update, not a web deploy).
    throw new DocumentError('Update the Acqlerate app to save files to your phone.');
  }
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import('@capacitor/filesystem'),
    import('@capacitor/share'),
  ]);
  const data = blob ?? await fetchDocument(url);
  const written = await Filesystem.writeFile({
    path: name,
    data: await blobToBase64(data),
    directory: Directory.Cache,
  });
  try {
    await Share.share({ title: name, files: [written.uri], dialogTitle: 'Save or share' });
  } catch (err: any) {
    // Closing the share sheet is a choice, not an error.
    if (/cancel/i.test(String(err?.message ?? err))) return;
    throw err;
  }
}
