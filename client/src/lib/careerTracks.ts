/**
 * Career track lesson priorities — pure data, no JSX.
 * Shared between Dashboard (filter bar) and ModulePage (lesson ordering).
 */

import { getAllLessons, parseDuration } from "./curriculum";

export type CareerTrackId = 'usg_pm' | 'contractor_pm' | 'contracting_officer' | 'capture_bd';

export interface CareerTrackData {
  id: CareerTrackId;
  label: string;
  shortLabel: string;
  desc: string;
  /** Emoji for the path-switcher card (My Account page). Plain string, not
   * JSX, to keep this file's "pure data" contract from the header comment. */
  icon: string;
  /** Funny "before" one-liner for the path-switcher card. */
  before: string;
  /** Funny "after" one-liner for the path-switcher card. */
  after: string;
  /** Lessons shown first, in order — this is what the user should focus on */
  primaryLessons: string[];
  /** Lessons shown below a divider — useful but not the core path */
  bonusLessons: string[];
}

export const CAREER_TRACK_DATA: CareerTrackData[] = [
  {
    id: 'usg_pm',
    label: 'USG Program Manager',
    shortLabel: 'USG PM',
    desc: 'Government-side PM managing programs, budgets, oversight, and the full acquisition lifecycle',
    icon: '🏛️',
    before: 'Before: buried in status decks, hoping nobody asks about the IPMR',
    after: "After: the PM who reads the IPMR before the PMR — and brings receipts",
    primaryLessons: [
      'foundations-1', 'foundations-3', 'foundations-5',
      'foundations-6', 'foundations-9', 'foundations-2', 'foundations-7',
      'foundations-8', 'foundations-4',
      'finance-1', 'finance-4', 'finance-3', 'finance-2', 'finance-5', 'finance-7',
      'contracts-2', 'contracts-3', 'contracts-6',
      'data-1', 'data-2', 'data-3', 'data-4',
      'ops-1', 'ops-2', 'ops-5',
    ],
    bonusLessons: [
      'finance-6', 'finance-8', 'finance-9', 'finance-10',
      'contracts-8', 'contracts-1', 'contracts-4', 'contracts-9', 'contracts-7', 'contracts-5',
      'capture-1', 'capture-3', 'capture-2', 'capture-4', 'capture-5',
      'ops-3', 'ops-4', 'ops-6', 'ops-7',
    ],
  },
  {
    id: 'contractor_pm',
    label: 'DoD Contractor PM',
    shortLabel: 'Contractor PM',
    desc: 'Industry-side PM executing contracts, managing costs, task orders, and subcontractors',
    icon: '💼',
    before: 'Before: nodding along when someone says "fully burdened rate"',
    after: 'After: fluent in burn rate, DCAA audits, and CPAF math',
    primaryLessons: [
      // Foundations — what you need to operate, skip ACAT/congressional deep dives
      'foundations-1', 'foundations-3', 'foundations-5', 'foundations-9',
      // Contracts — this is your day job: vehicles, admin, mods, COR, CDRLs, Section H, MSRs
      'contracts-8', 'contracts-1', 'contracts-4', 'contracts-9',
      'contracts-3', 'contracts-6', 'contracts-7', 'contracts-5',
      'contracts-10', 'contracts-11', 'contracts-12',
      // Finance — wrap rates, burn rate, CPAF, DCAA, revenue recognition
      'finance-2', 'finance-5', 'finance-6', 'finance-7', 'finance-8', 'finance-9', 'finance-10',
      // Data — metrics, EVM, IPMR
      'data-1', 'data-3', 'data-4',
      // Ops — risk, comms, subs, PM mistakes
      'ops-1', 'ops-2', 'ops-4', 'ops-5', 'ops-7',
    ],
    bonusLessons: [
      // Useful context but not your core job
      'foundations-6', 'foundations-2', 'foundations-7', 'foundations-8', 'foundations-4',
      'finance-1', 'finance-4', 'finance-3',
      'contracts-2',
      'data-2',
      'capture-1', 'capture-3', 'capture-2', 'capture-4', 'capture-5',
      'ops-3', 'ops-6',
    ],
  },
  {
    id: 'contracting_officer',
    label: 'Contracting Specialist / KO',
    shortLabel: 'KO / Specialist',
    desc: 'Source selection, contract administration, FAR/DFARS compliance',
    icon: '📜',
    before: 'Before: FAR Part 15 gives you a minor existential crisis',
    after: 'After: running source selection like you wrote the FAR yourself',
    primaryLessons: [
      'foundations-1', 'foundations-3', 'foundations-5',
      'foundations-6', 'foundations-9', 'foundations-2', 'foundations-7',
      'foundations-8', 'foundations-4',
      'contracts-1', 'contracts-2', 'contracts-3', 'contracts-6',
      'contracts-4', 'contracts-8', 'contracts-7', 'contracts-5', 'contracts-9',
      'finance-4', 'finance-3',
    ],
    bonusLessons: [
      'finance-1', 'finance-2', 'finance-5', 'finance-6', 'finance-7', 'finance-8', 'finance-9', 'finance-10',
      'data-1', 'data-2', 'data-3', 'data-4',
      'capture-1', 'capture-2', 'capture-3', 'capture-4', 'capture-5',
      'ops-1', 'ops-2', 'ops-3', 'ops-4', 'ops-5', 'ops-6', 'ops-7',
    ],
  },
  {
    id: 'capture_bd',
    label: 'Capture & Business Development',
    shortLabel: 'Capture / BD',
    desc: 'Win more business — proposals, pipeline, and source selection strategy',
    icon: '🎯',
    before: 'Before: chasing revenue and QoQ project fire drills',
    after: 'After: running the full capture lifecycle like a playbook, not a scramble',
    primaryLessons: [
      'foundations-1', 'foundations-3', 'foundations-5',
      'contracts-8', 'contracts-1', 'contracts-4', 'contracts-7', 'contracts-5', 'contracts-9', 'contracts-2',
      'capture-1', 'capture-3', 'capture-2', 'capture-4', 'capture-5',
      'ops-2',
    ],
    bonusLessons: [
      'foundations-6', 'foundations-9', 'foundations-2', 'foundations-7',
      'foundations-8', 'foundations-4',
      'finance-6', 'finance-8', 'finance-9', 'finance-10',
      'contracts-3', 'contracts-6',
      'data-1', 'data-2', 'data-3', 'data-4',
      'finance-1', 'finance-4', 'finance-3', 'finance-2', 'finance-5', 'finance-7',
      'ops-1', 'ops-3', 'ops-4', 'ops-5', 'ops-6', 'ops-7',
    ],
  },
];

/** Quick lookup: get track data by ID */
export function getTrackData(id: CareerTrackId | null): CareerTrackData | null {
  if (!id) return null;
  return CAREER_TRACK_DATA.find(t => t.id === id) ?? null;
}

/** Returns lesson IDs for a module sorted by track priority:
 *  primary lessons first (in track order), then bonus, then unclassified */
export function sortLessonsByTrack(
  lessonIds: string[],
  trackData: CareerTrackData | null,
): { primary: string[]; bonus: string[]; unclassified: string[] } {
  if (!trackData) {
    return { primary: [], bonus: [], unclassified: lessonIds };
  }
  const primarySet = new Set(trackData.primaryLessons);
  const bonusSet   = new Set(trackData.bonusLessons);

  const primary: string[]       = [];
  const bonus: string[]         = [];
  const unclassified: string[]  = [];

  // Primary: preserve track order (not module order)
  for (const id of trackData.primaryLessons) {
    if (lessonIds.includes(id)) primary.push(id);
  }
  // Bonus: preserve track order
  for (const id of trackData.bonusLessons) {
    if (lessonIds.includes(id)) bonus.push(id);
  }
  // Anything not in either list
  for (const id of lessonIds) {
    if (!primarySet.has(id) && !bonusSet.has(id)) unclassified.push(id);
  }

  return { primary, bonus, unclassified };
}

/**
 * Core-focus lesson count + total minutes for a track, for the path-switcher
 * card on the My Account page ("24 core lessons · 5h 10m"). Computed against
 * the actual curriculum rather than trackData.primaryLessons.length directly,
 * so a lesson id that's been renamed or removed can never inflate the count.
 */
export function getTrackStats(id: CareerTrackId): { lessonCount: number; totalMinutes: number } {
  const track = getTrackData(id);
  if (!track) return { lessonCount: 0, totalMinutes: 0 };
  const primarySet = new Set(track.primaryLessons);
  const matches = getAllLessons().filter(({ lesson }) => primarySet.has(lesson.id));
  const totalMinutes = matches.reduce((sum, { lesson }) => sum + parseDuration(lesson.duration), 0);
  return { lessonCount: matches.length, totalMinutes };
}
