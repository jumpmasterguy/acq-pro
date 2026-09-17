/**
 * A module row on the Modules list: seq tile, title, meta, progress, status.
 */

import type { Module } from '@/lib/curriculum';
import { formatDuration, getModuleTotalMinutes } from '@/lib/curriculum';
import { getModuleTheme, moduleGradient } from '@/lib/moduleTheme';
import { formatClps, moduleClps } from '@shared/moduleClps';

export function ModuleRow({
  module: mod,
  seq,
  pct,
  locked,
  onOpen,
}: {
  module: Module;
  seq: number;
  pct: number;
  locked: boolean;
  onOpen: () => void;
}) {
  const theme = getModuleTheme(mod.color);

  // Locked wins over progress — a locked module shouldn't advertise a percent.
  const status = locked
    ? { label: '🔒', color: 'var(--acq-text-muted)' }   // locked is state, not decoration
    : pct === 100
      ? { label: '✓ Done', color: 'var(--acq-success)' }
      : pct > 0
        ? { label: `${pct}%`, color: theme.mobileHex }
        : { label: 'Start', color: 'var(--acq-text-brand)' };

  return (
    <button
      type="button"
      onClick={onOpen}
      className="acq-press flex w-full items-center gap-3.5 rounded-2xl p-3.5 text-left"
      style={{
        background: 'var(--acq-surface-card)',
        border: '1px solid var(--acq-border-subtle)',
        boxShadow: 'var(--acq-shadow-sm)',
      }}
      data-testid={`module-row-${mod.id}`}
    >
      <span
        className="acq-tnum flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[13px] font-extrabold text-white"
        style={{ background: moduleGradient(theme) }}
      >
        {String(seq).padStart(2, '0')}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className="block text-sm font-bold leading-[1.3]"
          style={{ color: 'var(--acq-text-heading)' }}
        >
          {mod.title}
        </span>
        <span className="mt-0.5 block text-xs" style={{ color: 'var(--acq-text-muted)' }}>
          {mod.lessons.length} lessons · {formatDuration(getModuleTotalMinutes(mod.id))} ·{' '}
          {formatClps(moduleClps(mod.id))}
        </span>
        <span
          className="mt-2 block h-1 w-full overflow-hidden rounded-full"
          style={{ background: 'var(--acq-surface-muted)' }}
        >
          <span
            className="block h-full rounded-full"
            style={{ width: `${pct}%`, background: theme.mobileHex }}
          />
        </span>
      </span>

      <span
        className="acq-tnum shrink-0 text-xs font-bold"
        style={{ color: status.color }}
      >
        {status.label}
      </span>
    </button>
  );
}
