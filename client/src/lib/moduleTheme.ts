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
    mobileHex: '#10b981',
    gradientFrom: '#10b981',
    gradientTo: '#047857',
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
    mobileHex: '#f43f5e',
    gradientFrom: '#f43f5e',
    gradientTo: '#be123c',
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
    mobileHex: '#818cf8',
    gradientFrom: '#818cf8',
    gradientTo: '#4f46e5',
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
    mobileHex: '#0ea5e9',
    gradientFrom: '#0ea5e9',
    gradientTo: '#0369a1',
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
    mobileHex: '#d946ef',
    gradientFrom: '#d946ef',
    gradientTo: '#a21caf',
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
    mobileHex: '#fb923c',
    gradientFrom: '#fb923c',
    gradientTo: '#ea580c',
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
    mobileHex: '#84cc16',
    gradientFrom: '#84cc16',
    gradientTo: '#4d7c0f',
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
    mobileHex: '#78716c',
    gradientFrom: '#78716c',
    gradientTo: '#44403c',
  },
};

export function getModuleTheme(colorKey: string | undefined): ModuleTheme {
  return MODULE_THEME[colorKey as ModuleColorKey] ?? MODULE_THEME.slate;
}


// ─────────────────────────────────────────────────────────────────────────────
// Subject families
//
// The 14 module colours above were assigned one per module, which means colour
// carries no information: a learner cannot tell what a hue means, so the eye
// learns to ignore it. Modules are therefore grouped into five subject
// families, and the family owns the colour. Three weeks in, a learner knows
// purple means contracts without anyone explaining it.
//
// Five rather than fourteen is a legibility limit, not a style choice. The
// hexes below were checked pairwise for colour-vision separation (OKLab dE) in
// both light and dark mode against the real surface colours. All ten pairs
// pass; magenta against green sits in the acceptable band only because colour
// is never the sole signal (every tile also carries an icon and a text label).
// If a hue is ever swapped, re-run that check rather than trusting the eye.
// Roughly 1 in 12 men has some colour vision deficiency.
// ─────────────────────────────────────────────────────────────────────────────

export type ModuleFamily = 'foundations' | 'money' | 'contracts' | 'winning' | 'program';

/** Which family each module belongs to. Keyed by module id from curriculum.ts. */
export const MODULE_FAMILY: Record<string, ModuleFamily> = {
  // How the system works, end to end
  foundations: 'foundations',
  preaward: 'foundations',
  lifecycle: 'foundations',
  onramp: 'foundations',
  history: 'foundations',
  // Where the dollars come from and go
  finance: 'money',
  business: 'money',
  // The rules and the paperwork that binds
  contracts: 'contracts',
  compliance: 'contracts',
  // Going after work and landing it
  capture: 'winning',
  smallbiz: 'winning',
  veteran: 'winning',
  // Executing it once you have it
  data: 'program',
  operations: 'program',
};

/** Short label shown on module tiles and in the sidebar legend. */
export const FAMILY_LABEL: Record<ModuleFamily, string> = {
  foundations: 'Foundations',
  money: 'Money',
  contracts: 'Contracts',
  winning: 'Winning work',
  program: 'Run the program',
};

export const FAMILY_THEME: Record<ModuleFamily, ModuleTheme> = {
  foundations: {
    hex: '#3D8FD1',
    headerGrad: 'from-[#3D8FD1] to-[#2A6B9E] dark:from-[#2A6B9E] dark:to-[#1D4C70] border-[#3D8FD1]/50',
    border: 'border-[#3D8FD1]/25 dark:border-[#4A9AE0]/30',
    hoverBorder: 'hover:border-[#3D8FD1]/60',
    text: 'text-[#3D8FD1] dark:text-[#4A9AE0]',
    bgTint: 'bg-[#3D8FD1]/10',
    borderTint: 'border-[#3D8FD1]/30',
    progressBar: '[&>div]:bg-[#3D8FD1]',
    mobileHex: '#3D8FD1',
    gradientFrom: '#4A9AE0',
    gradientTo: '#2A6B9E',
  },
  money: {
    hex: '#2E8B57',
    headerGrad: 'from-[#2E8B57] to-[#216640] dark:from-[#216640] dark:to-[#17482D] border-[#2E8B57]/50',
    border: 'border-[#2E8B57]/25 dark:border-[#41A56B]/30',
    hoverBorder: 'hover:border-[#2E8B57]/60',
    text: 'text-[#2E8B57] dark:text-[#41A56B]',
    bgTint: 'bg-[#2E8B57]/10',
    borderTint: 'border-[#2E8B57]/30',
    progressBar: '[&>div]:bg-[#2E8B57]',
    mobileHex: '#2E8B57',
    gradientFrom: '#41A56B',
    gradientTo: '#216640',
  },
  contracts: {
    hex: '#5E3596',
    headerGrad: 'from-[#5E3596] to-[#45276E] dark:from-[#45276E] dark:to-[#2F1A4D] border-[#5E3596]/50',
    border: 'border-[#5E3596]/25 dark:border-[#8E63D6]/30',
    hoverBorder: 'hover:border-[#5E3596]/60',
    text: 'text-[#5E3596] dark:text-[#8E63D6]',
    bgTint: 'bg-[#5E3596]/10',
    borderTint: 'border-[#5E3596]/30',
    progressBar: '[&>div]:bg-[#5E3596]',
    mobileHex: '#5E3596',
    gradientFrom: '#8E63D6',
    gradientTo: '#45276E',
  },
  winning: {
    hex: '#D1571A',
    headerGrad: 'from-[#D1571A] to-[#A04314] dark:from-[#A04314] dark:to-[#73300E] border-[#D1571A]/50',
    border: 'border-[#D1571A]/25 dark:border-[#DC7129]/30',
    hoverBorder: 'hover:border-[#D1571A]/60',
    text: 'text-[#D1571A] dark:text-[#DC7129]',
    bgTint: 'bg-[#D1571A]/10',
    borderTint: 'border-[#D1571A]/30',
    progressBar: '[&>div]:bg-[#D1571A]',
    mobileHex: '#D1571A',
    gradientFrom: '#DC7129',
    gradientTo: '#A04314',
  },
  program: {
    hex: '#B0327A',
    headerGrad: 'from-[#B0327A] to-[#85255C] dark:from-[#85255C] dark:to-[#5C1940] border-[#B0327A]/50',
    border: 'border-[#B0327A]/25 dark:border-[#D2519A]/30',
    hoverBorder: 'hover:border-[#B0327A]/60',
    text: 'text-[#B0327A] dark:text-[#D2519A]',
    bgTint: 'bg-[#B0327A]/10',
    borderTint: 'border-[#B0327A]/30',
    progressBar: '[&>div]:bg-[#B0327A]',
    mobileHex: '#B0327A',
    gradientFrom: '#D2519A',
    gradientTo: '#85255C',
  },
};

export function getModuleFamily(moduleId: string): ModuleFamily {
  return MODULE_FAMILY[moduleId] ?? 'foundations';
}

/**
 * A module's theme, by family. Prefer this over getModuleTheme(mod.color) for
 * anything module-level, so every surface agrees on what colour a module is.
 */
export function getModuleFamilyTheme(moduleId: string): ModuleTheme {
  return FAMILY_THEME[getModuleFamily(moduleId)];
}
