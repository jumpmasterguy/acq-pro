/**
 * Single source of truth for "which color is this module" — used by the
 * Dashboard module cards AND the Module detail page, so a module's color
 * is the same everywhere the user sees it (previously these lived as two
 * separate, mismatched color maps).
 *
 * Keyed by the `color` field on each module in curriculum.ts.
 */
export type ModuleColorKey = 'navy' | 'gold' | 'blue' | 'teal' | 'amber' | 'slate' | 'emerald' | 'rose' | 'indigo' | 'sky' | 'fuchsia' | 'orange' | 'lime' | 'stone';

export interface ModuleTheme {
  /** Solid hex — used for lesson-number circles, bars, and inline styles. */
  hex: string;
  /** Tailwind gradient + border classes for a colored header banner. */
  headerGrad: string;
  /** Card border in its resting state. */
  border: string;
  /** Card border on hover (more saturated). */
  hoverBorder: string;
  /** Accent text color. */
  text: string;
  /** ~10% tint background, for icon chips / soft badges. */
  bgTint: string;
  /** ~30% tint border, pairs with bgTint. */
  borderTint: string;
  /** Progress bar fill override. */
  progressBar: string;

  // ── Mobile identity ──────────────────────────────────────────────────────
  // The mobile design gives each module a base color and a gradient, both a
  // shade lighter/deeper than the single `hex` desktop uses. These are kept
  // as separate fields rather than repointing `hex`, so adopting the mobile
  // palette can't recolor the desktop module pages.
  //
  // Source note: the handoff README's color table lists base and the
  // `--module-*-alt` value, which is `hex` above; the prototype that produced
  // the screenshots ends its gradients a further step darker. These are the
  // prototype's values, since the screenshots are what fidelity is judged on.

  /** Module identity color on mobile — seq tiles, progress fills, rails. */
  mobileHex: string;
  /** Gradient start — `linear-gradient(135deg, from, to)`. */
  gradientFrom: string;
  /** Gradient end. */
  gradientTo: string;
}

/** 12% tint of a module's mobile hex — rails, icon backgrounds. */
export function moduleTint(hex: string): string {
  return `${hex}1f`;
}

/** The mobile module gradient. */
export function moduleGradient(theme: ModuleTheme): string {
  return `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`;
}

export const MODULE_THEME: Record<ModuleColorKey, ModuleTheme> = {
  navy: {
    hex: '#2563eb',
    headerGrad: 'from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-950 border-blue-700/50',
    border: 'border-blue-200 dark:border-blue-800/40',
    hoverBorder: 'hover:border-blue-400/60',
    text: 'text-blue-600 dark:text-blue-400',
    bgTint: 'bg-blue-500/10',
    borderTint: 'border-blue-500/30',
    progressBar: '[&>div]:bg-blue-600',
    mobileHex: '#3b82f6',
    gradientFrom: '#3b82f6',
    gradientTo: '#1d4ed8',
  },
  gold: {
    hex: '#d97706',
    headerGrad: 'from-yellow-500 to-amber-600 dark:from-yellow-700 dark:to-amber-900 border-yellow-600/50',
    border: 'border-amber-200 dark:border-amber-800/40',
    hoverBorder: 'hover:border-amber-400/60',
    text: 'text-amber-600 dark:text-amber-400',
    bgTint: 'bg-amber-500/10',
    borderTint: 'border-amber-500/30',
    progressBar: '[&>div]:bg-amber-500',
    mobileHex: '#f59e0b',
    gradientFrom: '#f59e0b',
    gradientTo: '#b45309',
  },
  blue: {
    hex: '#0891b2',
    headerGrad: 'from-cyan-500 to-cyan-700 dark:from-cyan-800 dark:to-cyan-950 border-cyan-600/50',
    border: 'border-cyan-200 dark:border-cyan-800/40',
    hoverBorder: 'hover:border-cyan-400/60',
    text: 'text-cyan-600 dark:text-cyan-400',
    bgTint: 'bg-cyan-500/10',
    borderTint: 'border-cyan-500/30',
    progressBar: '[&>div]:bg-cyan-500',
    mobileHex: '#6366f1',
    gradientFrom: '#6366f1',
    gradientTo: '#4338ca',
  },
  teal: {
    hex: '#0d9488',
    headerGrad: 'from-teal-500 to-teal-700 dark:from-teal-800 dark:to-teal-950 border-teal-600/50',
    border: 'border-teal-200 dark:border-teal-800/40',
    hoverBorder: 'hover:border-teal-400/60',
    text: 'text-teal-600 dark:text-teal-400',
    bgTint: 'bg-teal-500/10',
    borderTint: 'border-teal-500/30',
    progressBar: '[&>div]:bg-teal-500',
    mobileHex: '#14b8a6',
    gradientFrom: '#14b8a6',
    gradientTo: '#0f766e',
  },
  amber: {
    hex: '#ea580c',
    headerGrad: 'from-amber-500 to-orange-600 dark:from-amber-800 dark:to-orange-950 border-amber-600/50',
    border: 'border-orange-200 dark:border-orange-800/40',
    hoverBorder: 'hover:border-orange-400/60',
    text: 'text-orange-600 dark:text-orange-400',
    bgTint: 'bg-orange-500/10',
    borderTint: 'border-orange-500/30',
    progressBar: '[&>div]:bg-orange-500',
    mobileHex: '#f97316',
    gradientFrom: '#f97316',
    gradientTo: '#c2410c',
  },
  slate: {
    hex: '#7c3aed',
    headerGrad: 'from-violet-500 to-violet-700 dark:from-violet-800 dark:to-violet-950 border-violet-600/50',
    border: 'border-violet-200 dark:border-violet-800/40',
    hoverBorder: 'hover:border-violet-400/60',
    text: 'text-violet-600 dark:text-violet-400',
    bgTint: 'bg-violet-500/10',
    borderTint: 'border-violet-500/30',
    progressBar: '[&>div]:bg-violet-500',
    mobileHex: '#8b5cf6',
    gradientFrom: '#8b5cf6',
    gradientTo: '#6d28d9',
  },
  emerald: {
    hex: '#059669',
    headerGrad: 'from-emerald-500 to-emerald-700 dark:from-emerald-800 dark:to-emerald-950 border-emerald-600/50',
    border: 'border-emerald-200 dark:border-emerald-800/40',
    hoverBorder: 'hover:border-emerald-400/60',
    text: 'text-emerald-600 dark:text-emerald-400',
    bgTint: 'bg-emerald-500/10',
    borderTint: 'border-emerald-500/30',
    progressBar: '[&>div]:bg-emerald-500',
  },
  rose: {
    hex: '#e11d48',
    headerGrad: 'from-rose-500 to-rose-700 dark:from-rose-800 dark:to-rose-950 border-rose-600/50',
    border: 'border-rose-200 dark:border-rose-800/40',
    hoverBorder: 'hover:border-rose-400/60',
    text: 'text-rose-600 dark:text-rose-400',
    bgTint: 'bg-rose-500/10',
    borderTint: 'border-rose-500/30',
    progressBar: '[&>div]:bg-rose-500',
  },
  indigo: {
    hex: '#4f46e5',
    headerGrad: 'from-indigo-500 to-indigo-700 dark:from-indigo-800 dark:to-indigo-950 border-indigo-600/50',
    border: 'border-indigo-200 dark:border-indigo-800/40',
    hoverBorder: 'hover:border-indigo-400/60',
    text: 'text-indigo-600 dark:text-indigo-400',
    bgTint: 'bg-indigo-500/10',
    borderTint: 'border-indigo-500/30',
    progressBar: '[&>div]:bg-indigo-500',
  },
  sky: {
    hex: '#0284c7',
    headerGrad: 'from-sky-500 to-sky-700 dark:from-sky-800 dark:to-sky-950 border-sky-600/50',
    border: 'border-sky-200 dark:border-sky-800/40',
    hoverBorder: 'hover:border-sky-400/60',
    text: 'text-sky-600 dark:text-sky-400',
    bgTint: 'bg-sky-500/10',
    borderTint: 'border-sky-500/30',
    progressBar: '[&>div]:bg-sky-500',
  },
  fuchsia: {
    hex: '#c026d3',
    headerGrad: 'from-fuchsia-500 to-fuchsia-700 dark:from-fuchsia-800 dark:to-fuchsia-950 border-fuchsia-600/50',
    border: 'border-fuchsia-200 dark:border-fuchsia-800/40',
    hoverBorder: 'hover:border-fuchsia-400/60',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
    bgTint: 'bg-fuchsia-500/10',
    borderTint: 'border-fuchsia-500/30',
    progressBar: '[&>div]:bg-fuchsia-500',
  },
  orange: {
    hex: '#ea580c',
    headerGrad: 'from-orange-500 to-orange-700 dark:from-orange-800 dark:to-orange-950 border-orange-600/50',
    border: 'border-orange-200 dark:border-orange-800/40',
    hoverBorder: 'hover:border-orange-400/60',
    text: 'text-orange-600 dark:text-orange-400',
    bgTint: 'bg-orange-500/10',
    borderTint: 'border-orange-500/30',
    progressBar: '[&>div]:bg-orange-500',
  },
  lime: {
    hex: '#65a30d',
    headerGrad: 'from-lime-500 to-lime-700 dark:from-lime-800 dark:to-lime-950 border-lime-600/50',
    border: 'border-lime-200 dark:border-lime-800/40',
    hoverBorder: 'hover:border-lime-400/60',
    text: 'text-lime-600 dark:text-lime-400',
    bgTint: 'bg-lime-500/10',
    borderTint: 'border-lime-500/30',
    progressBar: '[&>div]:bg-lime-500',
  },
  stone: {
    hex: '#78716c',
    headerGrad: 'from-stone-500 to-stone-700 dark:from-stone-800 dark:to-stone-950 border-stone-600/50',
    border: 'border-stone-200 dark:border-stone-800/40',
    hoverBorder: 'hover:border-stone-400/60',
    text: 'text-stone-600 dark:text-stone-400',
    bgTint: 'bg-stone-500/10',
    borderTint: 'border-stone-500/30',
    progressBar: '[&>div]:bg-stone-500',
  },
};

export function getModuleTheme(colorKey: string | undefined): ModuleTheme {
  return MODULE_THEME[colorKey as ModuleColorKey] ?? MODULE_THEME.slate;
}
