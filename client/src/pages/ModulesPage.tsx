/**
 * Modules list — the Learn tab's root screen, and where the sidebar's family
 * links land.
 *
 * Grouped by subject family rather than presented as one flat run of fourteen:
 * the families are the organising idea everywhere else in the product, so a
 * list that ignores them makes the colour system look decorative. Passing a
 * `family` filters to that group; the chips switch between them.
 */

import { modules, getTotalLessons } from '@/lib/curriculum';
import { FREE_MODULES, getModuleProgress, type UserProgress } from '@/lib/progress';
import { totalClps } from '@shared/moduleClps';
import { getModuleFamily, FAMILY_LABEL, FAMILY_THEME, type ModuleFamily } from '@/lib/moduleTheme';
import { ModuleRow } from '@/components/mobile/ModuleRow';
import { cn } from '@/lib/utils';

const FAMILIES: ModuleFamily[] = ['foundations', 'money', 'contracts', 'winning', 'program'];

interface ModulesPageProps {
  progress: UserProgress;
  onSelectModule: (moduleId: string) => void;
  onUpgrade: () => void;
  /** When set, only this family's modules are listed. */
  family?: ModuleFamily;
  onSelectFamily?: (family?: ModuleFamily) => void;
}

export default function ModulesPage({ progress, onSelectModule, onUpgrade, family, onSelectFamily }: ModulesPageProps) {
  // Sequence numbers stay global so a module keeps the same number whether the
  // list is filtered or not.
  const seqOf = new Map(modules.map((m, i) => [m.id, i + 1]));
  const shownFamilies = family ? FAMILIES.filter(f => f === family) : FAMILIES;

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-4" data-testid="modules-page">
      <p className="text-[13px] leading-relaxed" style={{ color: 'var(--acq-text-muted)' }}>
        {modules.length} modules · {getTotalLessons()} lessons · {totalClps().toFixed(1)} CLPs.
        Module 1 is free; the first lesson of every other module is a free preview.
      </p>

      {onSelectFamily && (
        <div className="flex flex-wrap gap-1.5" data-testid="family-filter">
          <button
            onClick={() => onSelectFamily(undefined)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[13px] font-semibold border transition-colors",
              !family ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
            )}
            data-testid="family-filter-all"
          >
            All {modules.length}
          </button>
          {FAMILIES.map(f => {
            const count = modules.filter(m => getModuleFamily(m.id) === f).length;
            if (count === 0) return null;
            const active = family === f;
            return (
              <button
                key={f}
                onClick={() => onSelectFamily(f)}
                className="px-3 py-1.5 rounded-full text-[13px] font-semibold border transition-colors"
                style={active
                  ? { backgroundColor: FAMILY_THEME[f].hex, borderColor: FAMILY_THEME[f].hex, color: '#fff' }
                  : { borderColor: `${FAMILY_THEME[f].hex}55`, color: FAMILY_THEME[f].hex }}
                data-testid={`family-filter-${f}`}
              >
                {FAMILY_LABEL[f]} {count}
              </button>
            );
          })}
        </div>
      )}

      {shownFamilies.map(f => {
        const inFamily = modules.filter(m => getModuleFamily(m.id) === f);
        if (inFamily.length === 0) return null;
        return (
          <section key={f} className="flex flex-col gap-2.5" data-testid={`family-section-${f}`}>
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: FAMILY_THEME[f].hex }} />
              <h2 className="text-[13px] font-bold uppercase tracking-widest" style={{ color: FAMILY_THEME[f].hex }}>
                {FAMILY_LABEL[f]}
              </h2>
              <span className="text-xs text-muted-foreground">{inFamily.length} modules</span>
            </div>
            {inFamily.map(mod => {
              const locked = !progress.isPremium && !FREE_MODULES.includes(mod.id) && !mod.free;
              const pct = getModuleProgress(
                mod.id,
                mod.lessons.map(l => l.id),
                progress.completedLessons,
              );
              return (
                <ModuleRow
                  key={mod.id}
                  module={mod}
                  seq={seqOf.get(mod.id) ?? 1}
                  pct={pct}
                  locked={locked}
                  onOpen={() => (locked ? onUpgrade() : onSelectModule(mod.id))}
                />
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
