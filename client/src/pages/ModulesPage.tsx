/**
 * Modules list — the Learn tab's root screen.
 *
 * Mobile-only: the desktop shell reaches modules through the sidebar tree, so
 * there was no standalone list page before.
 */

import { modules, getTotalLessons } from '@/lib/curriculum';
import { FREE_MODULES, getModuleProgress, type UserProgress } from '@/lib/progress';
import { totalClps } from '@shared/moduleClps';
import { ModuleRow } from '@/components/mobile/ModuleRow';

interface ModulesPageProps {
  progress: UserProgress;
  onSelectModule: (moduleId: string) => void;
  onUpgrade: () => void;
}

export default function ModulesPage({ progress, onSelectModule, onUpgrade }: ModulesPageProps) {
  return (
    <div className="flex flex-col gap-2.5 px-4 pb-8 pt-4" data-testid="modules-page">
      <p className="text-[13px] leading-relaxed" style={{ color: 'var(--acq-text-muted)' }}>
        {modules.length} modules · {getTotalLessons()} lessons · {totalClps().toFixed(1)} CLPs.
        Module 1 is free; the first lesson of every other module is a free preview.
      </p>

      {modules.map((mod, i) => {
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
            seq={i + 1}
            pct={pct}
            locked={locked}
            onOpen={() => (locked ? onUpgrade() : onSelectModule(mod.id))}
          />
        );
      })}
    </div>
  );
}
