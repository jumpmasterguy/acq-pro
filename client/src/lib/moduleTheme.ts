/**
 * Single source of truth for "which color is this module" — used by the
 * Dashboard module cards AND the Module detail page, so a module's color
 * is the same everywhere the user sees it (previously these lived as two
 * separate, mismatched color maps).
 *
 * Keyed by the `color` field on each module in curriculum.ts.
 */
export type ModuleColorKey = 'navy' | 'gold' | 'blue' | 'teal' | 'amber' | 'slate';

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
  },
};

export function getModuleTheme(colorKey: string | undefined): ModuleTheme {
  return MODULE_THEME[colorKey as ModuleColorKey] ?? MODULE_THEME.slate;
}
