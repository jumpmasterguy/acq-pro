/**
 * Resources & tools — the Resources tab.
 *
 * Mobile-only: on desktop these live in two collapsible sidebar sections, so
 * there was no page for them before.
 */

import { useState } from 'react';
import { Lock, Sparkles, ExternalLink, FileText, FileSpreadsheet } from 'lucide-react';
import { useDocumentViewer } from '@/components/DocumentViewerProvider';
import { docKind } from '@/lib/documents';
import { SIDEBAR_RESOURCES } from '@/lib/resources';
import { FAR_TRANSLATOR, TOOLS_DIRECTORY } from '@/lib/toolsDirectory';
import { isNativeApp } from '@/lib/platform';
import { cn } from '@/lib/utils';

interface ResourcesPageProps {
  isPremium: boolean;
  onUpgrade: () => void;
}

type Tab = 'resources' | 'tools';

export default function ResourcesPage({ isPremium, onUpgrade }: ResourcesPageProps) {
  const [tab, setTab] = useState<Tab>('resources');
  const { openDocument } = useDocumentViewer();

  return (
    <div className="flex flex-col gap-3.5 px-4 pb-8 pt-4" data-testid="resources-page">
      {/* Segmented control — same treatment as the auth screen's */}
      <div
        className="flex gap-1 rounded-[10px] p-1"
        style={{ background: 'var(--acq-surface-sunken)' }}
      >
        {([
          { id: 'resources' as const, label: `Resources · ${SIDEBAR_RESOURCES.length}` },
          { id: 'tools' as const, label: 'Tools' },
        ]).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className="h-10 flex-1 rounded-[7px] text-sm font-semibold"
            style={
              tab === t.id
                ? {
                    background: 'var(--acq-surface-card)',
                    color: 'var(--acq-text-heading)',
                    boxShadow: 'var(--acq-shadow-sm)',
                  }
                : { color: 'var(--acq-text-muted)' }
            }
            data-testid={`resources-tab-${t.id}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resources' ? (
        <>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--acq-text-muted)' }}>
            Example documents, working templates, and print-ready cheat sheets. Cheat sheets are
            free for everyone.
          </p>

          <div className="flex flex-col gap-2">
            {SIDEBAR_RESOURCES.map((res, i) => {
              // Same rule the desktop sidebar uses: a trialing user still gets
              // these. (Looser than the Lesson Book's isActuallyPaid gate.)
              const locked = !!res.proOnly && !isPremium;
              // PDFs open in the in-app viewer; spreadsheets can't be previewed
              // well on a phone, so they go straight to save / share.
              const kind = docKind(res.url);
              const viewable = kind === 'pdf';
              return (
                <button
                  key={i}
                  type="button"
                  onClick={locked ? onUpgrade : () => openDocument({ url: res.url, title: res.title })}
                  className="acq-press flex w-full items-start gap-3 rounded-[14px] p-3.5 text-left"
                  style={{
                    background: 'var(--acq-surface-card)',
                    border: '1px solid var(--acq-border-subtle)',
                    boxShadow: 'var(--acq-shadow-sm)',
                  }}
                  data-testid={`resource-${i}`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                    style={
                      locked
                        ? { background: 'var(--acq-surface-sunken)', color: 'var(--acq-text-faint)' }
                        : { background: 'var(--acq-surface-brand-wash)', color: 'var(--acq-text-brand)' }
                    }
                  >
                    {locked ? (
                      <Lock className="h-4 w-4" strokeWidth={2} />
                    ) : viewable ? (
                      <FileText className="h-4 w-4" strokeWidth={2} />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4" strokeWidth={2} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block text-sm font-semibold leading-[1.35]"
                      style={{ color: 'var(--acq-text-heading)' }}
                    >
                      {res.title}
                    </span>
                    <span
                      className="mt-0.5 block text-xs leading-[1.45]"
                      style={{ color: 'var(--acq-text-muted)' }}
                    >
                      {res.description}
                    </span>
                    <span
                      className="mt-1.5 block text-xs font-bold"
                      style={{ color: locked ? 'var(--acq-text-muted)' : 'var(--acq-text-brand)' }}
                    >
                      {locked ? 'Unlock with Pro →' : viewable ? 'View PDF' : isNativeApp() ? 'Save Excel file' : 'Download Excel file'}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Promoted: the flagship AI tool. The Cost & Burn Rate Tracker is
              deliberately not here — it's six pages of dense tables with no
              mobile layout, so it stays desktop-only for now. */}
          <a
            href={isNativeApp() ? FAR_TRANSLATOR.url.replace('#', '?app=1#') : FAR_TRANSLATOR.url}
            target="_blank"
            rel="noopener noreferrer"
            className="acq-press flex items-start gap-3 rounded-[14px] p-3.5"
            style={{
              background: 'rgba(1,105,111,.05)',
              border: '1px solid rgba(1,105,111,.25)',
            }}
            data-testid="tool-far-translator"
          >
            <Sparkles
              className="mt-0.5 h-[18px] w-[18px] shrink-0"
              style={{ color: 'var(--acq-text-brand)' }}
              strokeWidth={2}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold" style={{ color: 'var(--acq-text-brand)' }}>
                {FAR_TRANSLATOR.name}
              </span>
              <span className="mt-0.5 block text-xs leading-[1.45]" style={{ color: 'var(--acq-text-muted)' }}>
                {FAR_TRANSLATOR.description}
              </span>
            </span>
            <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--acq-text-faint)' }} />
          </a>

          {TOOLS_DIRECTORY.map((cat, ci) => (
            <div key={ci}>
              <h2
                className="px-0 pb-1.5 pt-2 text-[10px] font-extrabold uppercase tracking-[0.1em]"
                style={{ color: 'var(--acq-text-muted)' }}
              >
                {cat.title}
              </h2>
              <div
                className="overflow-hidden rounded-[14px]"
                style={{
                  background: 'var(--acq-surface-card)',
                  border: '1px solid var(--acq-border-subtle)',
                  boxShadow: 'var(--acq-shadow-sm)',
                }}
              >
                {cat.tools.map((tool, ti) => (
                  <a
                    key={ti}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'acq-press flex min-h-[52px] items-center gap-2.5 px-3.5 py-2',
                      ti > 0 && 'border-t',
                    )}
                    style={ti > 0 ? { borderColor: 'var(--acq-border-subtle)' } : undefined}
                    data-testid={`tool-${ci}-${ti}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium" style={{ color: 'var(--acq-text-body)' }}>
                        {tool.name}
                      </span>
                      {tool.sub && (
                        <span className="block text-[11px]" style={{ color: 'var(--acq-text-faint)' }}>
                          {tool.sub}
                        </span>
                      )}
                    </span>
                    {tool.free && (
                      <span
                        className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                        style={{ background: 'var(--acq-success-wash)', color: 'var(--acq-success-ink)' }}
                      >
                        {tool.free}
                      </span>
                    )}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--acq-text-faint)' }} />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
