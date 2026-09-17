/**
 * The mobile option card, shared by the Onboarding path builder and the
 * Account "Your Path" picker.
 *
 * Two shapes, both full-width buttons with the same selected treatment:
 *   icon variant  — 40x40 Lucide tile, label, description, check on select.
 *   emoji variant — 22px track glyph and arbitrary children, used by Account.
 *
 * Colors come from the --acq-option-* tokens so the light (teal on parchment)
 * and dark (cyan on navy) ramps are both a token swap rather than a branch.
 */

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaseProps {
  selected: boolean;
  onSelect: () => void;
  className?: string;
  'data-testid'?: string;
}

/** Shared frame: 2px border, 14px radius, swaps to the selected treatment. */
function OptionFrame({
  selected,
  onSelect,
  className,
  children,
  ...rest
}: BaseProps & { children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'acq-press flex w-full items-start gap-4 rounded-[14px] border-2 p-4 text-left',
        className,
      )}
      style={{
        color: 'var(--acq-option-text)',
        background: selected ? 'var(--acq-option-bg-selected)' : 'var(--acq-surface-card)',
        borderColor: selected ? 'var(--acq-option-border-selected)' : 'var(--acq-option-border)',
        transition: 'border-color 150ms ease, background 150ms ease',
      }}
      data-selected={selected}
      data-testid={rest['data-testid']}
    >
      {children}
    </button>
  );
}

/** Onboarding: icon tile + label + description, check mark when selected. */
export function OptionCard({
  icon: Icon,
  label,
  description,
  selected,
  onSelect,
  ...rest
}: BaseProps & { icon: LucideIcon; label: string; description: string }) {
  return (
    <OptionFrame selected={selected} onSelect={onSelect} {...rest}>
      <span
        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: selected ? 'var(--acq-option-icon-bg-selected)' : 'var(--acq-option-icon-bg)',
          color: selected ? 'var(--acq-option-icon-fg-selected)' : 'var(--acq-option-icon-fg)',
          transition: 'background 100ms ease, color 100ms ease',
        }}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className="block text-sm font-semibold"
          style={{ color: selected ? 'var(--acq-option-label-selected)' : undefined }}
        >
          {label}
        </span>
        <span
          className="mt-0.5 block text-[13px] leading-relaxed"
          style={{ color: 'var(--acq-text-muted)' }}
        >
          {description}
        </span>
      </span>

      {selected && (
        <CheckCircle2
          className="mt-0.5 h-5 w-5 shrink-0"
          style={{ color: 'var(--acq-option-border-selected)' }}
          strokeWidth={2}
        />
      )}
    </OptionFrame>
  );
}

/** Account "Your Path": emoji glyph + caller-supplied body. */
export function EmojiOptionCard({
  emoji,
  selected,
  onSelect,
  children,
  ...rest
}: BaseProps & { emoji: string; children: ReactNode }) {
  return (
    <OptionFrame
      selected={selected}
      onSelect={onSelect}
      className="!gap-3 !p-[14px]"
      {...rest}
    >
      <span className="text-[22px] leading-none" aria-hidden="true">
        {emoji}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </OptionFrame>
  );
}
