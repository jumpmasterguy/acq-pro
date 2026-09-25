/**
 * Opens documents from anywhere in the app: openDocument({ url, title }).
 *
 *   PDFs         open in the in-app viewer (loaded on first use)
 *   everything   else (Excel, Word) cannot be previewed well on a phone, so
 *                it goes straight to Save: a download in the browser, the
 *                share sheet in the app.
 *
 * The viewer takes a browser-history entry while open, so Android's Back
 * button and the browser's Back both close it instead of leaving the screen
 * behind it. The entry carries the current app view, so the app's own
 * history handler restores exactly where the learner was.
 */

import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { docKind, saveDocument } from '@/lib/documents';
import { useToast } from '@/hooks/use-toast';
import type { ViewerDoc } from './DocumentViewer';

const DocumentViewer = lazy(() => import('./DocumentViewer'));

interface Ctx { openDocument: (doc: ViewerDoc) => void }
const DocumentViewerContext = createContext<Ctx>({ openDocument: () => {} });

export const useDocumentViewer = () => useContext(DocumentViewerContext);

export function DocumentViewerProvider({ children }: { children: ReactNode }) {
  const [doc, setDoc] = useState<ViewerDoc | null>(null);
  const pushed = useRef(false);
  const { toast } = useToast();

  const openDocument = useCallback((d: ViewerDoc) => {
    if (docKind(d.url) !== 'pdf') {
      saveDocument(d.url, d.title).catch((e: any) =>
        toast({ title: 'Couldn’t save that file', description: e?.message ?? 'Please try again.' }),
      );
      return;
    }
    try {
      window.history.pushState({ ...(window.history.state ?? {}), acqDocument: d.url }, '');
      pushed.current = true;
    } catch { pushed.current = false; }
    setDoc(d);
  }, [toast]);

  const close = useCallback(() => {
    // Our own history entry is popped by Back, which fires popstate below.
    if (pushed.current) window.history.back();
    else setDoc(null);
  }, []);

  useEffect(() => {
    if (!doc) return;
    const onPop = () => { pushed.current = false; setDoc(null); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [doc, close]);

  return (
    <DocumentViewerContext.Provider value={{ openDocument }}>
      {children}
      {doc && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'var(--acq-surface-sunken)' }}>
              <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--acq-text-muted)' }} />
            </div>
          }
        >
          <DocumentViewer doc={doc} onClose={close} />
        </Suspense>
      )}
    </DocumentViewerContext.Provider>
  );
}
