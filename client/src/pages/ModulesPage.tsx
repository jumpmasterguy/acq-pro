/**
 * My Path — the Learn tab's root screen, and where the sidebar's family links
 * land. Two views of the same modules:
 *
 *  - Path (the default). The learner's career track drawn as a route with legs,
 *    checkpoint gates and a finish line. A track has an order and an end, so
 *    it reads as a road rather than a shelf.
 *  - By subject. Every module grouped by subject family. The families are the
 *    organising idea everywhere else in the product, so a list that ignores
 *    them makes the colour system look decorative. Passing a `family` filters
 *    to that group; the chips switch between them.
 *
 * The dashboard keeps its card grid. The path lives here because this is the
 * page a learner opens to see where they are going, not what to do next.
 */

import type { ReactNode } from 'react';
import { modules, getTotalLessons } from '@/lib/curriculum';
import { FREE_MODULES, getModuleProgress, type UserProgress } from '@/lib/progress';
import { totalClps } from '@shared/moduleClps';
import { getModuleFamily, FAMILY_LABEL, FAMILY_THEME, type ModuleFamily } from '@/lib/moduleTheme';
import { ModuleRow } from '@/components/mobile/ModuleRow';
import { CareerPath } from '@/components/CareerPath';
import { getTrackModules } from '@/lib/careerPath';
import { getActiveTrack, getTrackData } from '@/lib/careerTracks';
import { cn } from '@/lib/utils';

const FAMILIES: ModuleFamily[] = ['foundations', 'money', 'contracts', 'winning', 'program'];

export type ModulesPageMode = 'path' | 'subject';

interface ModulesPageProps {
  progress: UserProgress;
  /** `activeCareer` is passed from the path so the module page orders its
   *  lessons by the learner's track. */
  onSelectModule: (moduleId: string, activeCareer?: string) => void;
  onUpgrade: () => void;
  /** When set, only this family's modules are listed (implies By subject). */
  family?: ModuleFamily;
  onSelectFamily?: (family?: ModuleFamily) => void;
  /** Which view to show. Defaults to the path. */
  mode?: ModulesPageMode;
  onSelectMode?: (mode: ModulesPageMode) => void;
  /** The career track is chosen on My Account. */
  onOpenAccount?: () => void;
}

function ModeTab({ active, onClick, children, testId }: { active: boolean; onClick: () => void; children: ReactNode; testId: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      data-testid={testId}
    >
      {children}
    </button>
  );
}

export default function ModulesPage({ progress, onSelectModule, onUpgrade, family, onSelectFamily, mode, onSelectMode, onOpenAccount }: ModulesPageProps) {
  // A family filter only makes sense on the subject list, so it wins.
  const view: ModulesPageMode = family ? 'subject' : (mode ?? 'path');
  const trackId = getActiveTrack();
  const track = getTrackData(trackId);

  // Sequence numbers stay global so a module keeps the same number whether the
  // list is filtered or not.
  const seqOf = new Map(modules.map((m, i) => [m.id, i + 1]));
  const shownFamilies = family ? FAMILIES.filter(f => f === family) : FAMILIES;

  const modeTabs = onSelectMode && (
    <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5 flex-shrink-0 self-start" data-testid="mypath-mode">
      <ModeTab active={view === 'path'} onClick={() => onSelectMode('path')} testId="mypath-mode-path">
        Career Path
      </ModeTab>
      <ModeTab active={view === 'subject'} onClick={() => onSelectMode('subject')} testId="mypath-mode-subject">
        By Subject
      </ModeTab>
    </div>
  );

  if (view === 'path') {
    const { mods, lessonsByModule } = getTrackModules(trackId);
    const offTrack = modules.length - mods.length;
    return (
      <div className="flex flex-col gap-4 px-4 pb-8 pt-4" data-testid="modules-page">
        <h1 className="hidden md:block text-2xl font-bold tracking-tight">My Path</h1>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {modeTabs}
            {track && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-primary/10 border-primary/40 text-primary">
                <span aria-hidden="true">{track.icon}</span>{track.shortLabel}
              </span>
            )}
            {onOpenAccount && (
              <button
                onClick={onOpenAccount}
                className="text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
                data-testid="change-path-link"
              >
                Change path in My Account
              </button>
            )}
          </div>
          {track && <p className="text-[12px] text-muted-foreground">{track.desc}</p>}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">{track ? `${track.label} Path` : 'Your path'}</h2>
          <span className="text-xs text-muted-foreground">
            {mods.length} module{mods.length !== 1 ? 's' : ''}
          </span>
        </div>

        <CareerPath
          mods={mods}
          progress={progress}
          trackId={trackId}
          primaryLessonSetForModule={lessonsByModule}
          onSelectModule={(id) => onSelectModule(id, trackId)}
          onUpgrade={onUpgrade}
        />

        {offTrack > 0 && onSelectMode && (
          <p className="text-[13px] text-muted-foreground text-center pt-2">
            {offTrack} more module{offTrack !== 1 ? 's' : ''} sit outside this track.{' '}
            <button
              onClick={() => onSelectMode('subject')}
              className="font-semibold text-primary hover:underline underline-offset-2"
              data-testid="mypath-see-all"
            >
              See every module by subject
            </button>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-4" data-testid="modules-page">
      <h1 className="hidden md:block text-2xl font-bold tracking-tight">My Path</h1>
      {modeTabs}
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
