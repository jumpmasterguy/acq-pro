/**
 * The gate assessment needs the real questions, which live in the heavy half
 * of the curriculum (see lib/curriculumMeta.ts). Everything else on screen is
 * served by the light index, so this is one of only two places that reaches
 * for the full file — the other is LessonPage.
 *
 * In practice the download is usually already done: the dashboard prefetches
 * it as soon as it has painted, and nobody opens an assessment in their first
 * few seconds in the app. The spinner below is for the unlucky case.
 */

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ModuleAssessment } from "@/components/ModuleAssessment";
import { loadCurriculum, type Module, type SkillLevel } from "@/lib/curriculumMeta";

interface Props {
  moduleId: string;
  currentLevel: SkillLevel;
  onClose: () => void;
  onLevelUnlocked: (moduleId: string, newLevel: SkillLevel) => void;
}

export function LazyModuleAssessment({ moduleId, currentLevel, onClose, onLevelUnlocked }: Props) {
  const [mod, setMod] = useState<Module | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setMod(null);
    setFailed(false);
    loadCurriculum()
      .then(({ modules }) => {
        if (!alive) return;
        const found = modules.find(m => m.id === moduleId) ?? null;
        setMod(found);
        if (!found) setFailed(true);
      })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [moduleId]);

  if (failed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
        <div className="max-w-sm rounded-xl bg-white p-6 text-center dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Couldn't load the assessment. Check your connection and try again.
          </p>
          <button
            onClick={onClose}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!mod) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!mod.assessment?.length) return null;

  return (
    <ModuleAssessment
      module={mod}
      currentLevel={currentLevel}
      onClose={onClose}
      onLevelUnlocked={onLevelUnlocked}
    />
  );
}
