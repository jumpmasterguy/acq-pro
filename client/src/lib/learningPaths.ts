/**
 * Learning Path System
 * 
 * Determines which modules are "primary" (highlighted, shown first)
 * vs "bonus" (collapsed under "See How the Sauce Is Made") based on
 * the user's onboarding profile.
 */

import type { UserProfile } from "@/pages/AuthPage";

export type ModuleRelevance = 'primary' | 'bonus' | 'standard';

export interface ModuleTrackConfig {
  relevance: ModuleRelevance;
  reason: string; // Shown as a tooltip/badge
}

export interface LearningPath {
  label: string;
  description: string;
  primaryModules: string[];   // moduleIds — shown prominently
  bonusModules: string[];     // moduleIds — collapsed "bonus" section
  recommendedStart: string;   // lessonId to start with
}

// ── Track definitions ──────────────────────────────────────────────────────

const PATHS: Record<string, LearningPath> = {
  // DoD employee who wants to be a better PM
  dod_employee_program_management: {
    label: 'Government PM Track',
    description: 'Master the government side of program management — budgets, oversight, contracts, and execution.',
    primaryModules: ['foundations', 'finance', 'contracts', 'data', 'ops'],
    bonusModules: ['capture'],
    recommendedStart: 'foundations-5',
  },
  // DoD employee focused on contracts/finance
  dod_employee_contracts_finance: {
    label: 'Government Contracting & Finance Track',
    description: 'Deep expertise in appropriations, contract vehicles, EVM, and oversight.',
    primaryModules: ['foundations', 'finance', 'contracts', 'data'],
    bonusModules: ['capture', 'ops'],
    recommendedStart: 'foundations-5',
  },
  // DoD employee, full picture
  dod_employee_full_picture: {
    label: 'Full Government Track',
    description: 'The complete DoD acquisition picture from Congress to contract execution.',
    primaryModules: ['foundations', 'finance', 'contracts', 'data', 'ops'],
    bonusModules: ['capture'],
    recommendedStart: 'foundations-5',
  },
  // DoD employee, BD/capture curiosity
  dod_employee_bd_capture: {
    label: 'Government + Industry Track',
    description: 'Understand both sides — how government runs acquisitions and how contractors win work.',
    primaryModules: ['foundations', 'contracts', 'capture', 'finance'],
    bonusModules: ['data', 'ops'],
    recommendedStart: 'foundations-5',
  },

  // DoD Contractor — BD/Capture primary goal
  dod_contractor_bd_capture: {
    label: 'BD & Capture Track',
    description: 'Win more contracts — master the capture lifecycle, proposal writing, and source selection.',
    primaryModules: ['capture', 'contracts', 'foundations'],
    bonusModules: ['finance', 'data', 'ops'],
    recommendedStart: 'capture-1',
  },
  // DoD Contractor — PM goal
  dod_contractor_program_management: {
    label: 'Contractor PM Track',
    description: 'Execute winning programs — from contract award through delivery.',
    primaryModules: ['contracts', 'finance', 'data', 'ops', 'foundations'],
    bonusModules: ['capture'],
    recommendedStart: 'contracts-4',
  },
  // DoD Contractor — contracts/finance
  dod_contractor_contracts_finance: {
    label: 'Contractor Finance & Compliance Track',
    description: 'Master EVM, cost structures, contract types, DCAA/DCMA, and financial reporting.',
    primaryModules: ['contracts', 'finance', 'data'],
    bonusModules: ['capture', 'foundations', 'ops'],
    recommendedStart: 'contracts-4',
  },
  // DoD Contractor — full picture
  dod_contractor_full_picture: {
    label: 'Defense Industry Full Track',
    description: 'Understand both the contractor and government perspectives across the entire acquisition lifecycle.',
    primaryModules: ['foundations', 'contracts', 'capture', 'finance', 'data', 'ops'],
    bonusModules: [],
    recommendedStart: 'foundations-5',
  },

  // Career changer — any goal
  career_changer_any: {
    label: 'Career Entry Track',
    description: 'Your fast path into DoD acquisitions — start with orientation, then learn the core skills employers need.',
    primaryModules: ['ops', 'foundations', 'contracts', 'finance'],
    bonusModules: ['capture', 'data'],
    recommendedStart: 'ops-3',
  },

  // Student — show everything equally
  student_any: {
    label: 'Exploration Track',
    description: 'Get the full picture of how DoD acquisitions works — explore every module at your own pace.',
    primaryModules: ['foundations', 'finance', 'contracts', 'data', 'capture', 'ops'],
    bonusModules: [],
    recommendedStart: 'foundations-5',
  },
};

// ── Path resolution ────────────────────────────────────────────────────────

export function getLearningPath(profile: UserProfile | null | undefined): LearningPath {
  if (!profile || !profile.completedOnboarding) {
    // Default: show everything
    return {
      label: 'Full Curriculum',
      description: 'All modules — personalize your path by completing the profile quiz.',
      primaryModules: ['foundations', 'finance', 'contracts', 'data', 'capture', 'ops'],
      bonusModules: [],
      recommendedStart: 'foundations-5',
    };
  }

  const { role, goal } = profile;
  const key = `${role}_${goal}`;

  // Exact match
  if (PATHS[key]) return PATHS[key];

  // Fallback by role
  if (role === 'dod_employee') return PATHS['dod_employee_program_management'];
  if (role === 'dod_contractor') return PATHS['dod_contractor_program_management'];
  if (role === 'career_changer') return PATHS['career_changer_any'];
  return PATHS['student_any'];
}

export function getModuleRelevance(moduleId: string, path: LearningPath): ModuleRelevance {
  if (path.primaryModules.includes(moduleId)) return 'primary';
  if (path.bonusModules.includes(moduleId)) return 'bonus';
  return 'standard';
}

// Human-readable labels
export const ROLE_LABELS: Record<UserProfile['role'], string> = {
  dod_employee: 'DoD / Government Employee',
  dod_contractor: 'Defense Industry Contractor',
  career_changer: 'Breaking Into the Field',
  student: 'Student / Exploring',
};

export const EXPERIENCE_LABELS: Record<UserProfile['experience'], string> = {
  new: 'Brand New to Acquisitions',
  some: '1–3 Years Exposure',
  experienced: '4+ Years Experience',
};

export const GOAL_LABELS: Record<UserProfile['goal'], string> = {
  contracts_finance: 'Master Contracts & Finance',
  bd_capture: 'Win More Business (BD/Capture)',
  program_management: 'Become a Better PM',
  full_picture: 'Understand the Full Picture',
};
