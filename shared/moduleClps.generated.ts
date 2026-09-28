// GENERATED FILE — DO NOT EDIT BY HAND.
// Written by scripts/gen-module-clps.mjs from client/src/lib/curriculum.ts,
// regenerated at the top of every build. Edit lesson durations in the
// curriculum, not the numbers here.
//
// 1 CLP = 1 hour of instruction (DAU policy): each module's summed lesson
// durations over 60, to one decimal.
//
// 14 modules · 124 lessons · 2708 minutes · 44.6 CLPs total

import type { ModuleClp } from "./moduleClps";

export const GENERATED_MODULE_CLPS: Record<string, ModuleClp> = {
  foundations: { title: "DoD Acquisitions Foundations", clps: 2.5 }, // 10 lessons, 151 min
  finance: { title: "Defense Finance & Budgeting", clps: 4.0 }, // 10 lessons, 245 min
  contracts: { title: "Defense Contracting Fundamentals", clps: 4.1 }, // 13 lessons, 249 min
  data: { title: "Data Analytics for Program Managers", clps: 2.9 }, // 8 lessons, 174 min
  capture: { title: "Capture Management & Business Development", clps: 1.6 }, // 5 lessons, 96 min
  operations: { title: "Program Operations & Leadership", clps: 1.8 }, // 7 lessons, 109 min
  business: { title: "The Business of Defense Contracting", clps: 4.6 }, // 11 lessons, 281 min
  smallbiz: { title: "Small Business in Defense Contracting", clps: 3.9 }, // 10 lessons, 237 min
  compliance: { title: "The Compliance Stack", clps: 4.0 }, // 10 lessons, 245 min
  preaward: { title: "From Need to RFP: The Government Pre-Award Process", clps: 4.0 }, // 10 lessons, 241 min
  lifecycle: { title: "Beyond Award: Sustainment, Test, Software, and Closeout", clps: 3.2 }, // 8 lessons, 192 min
  onramp: { title: "The Startup On-Ramp: SBIR, OTs, DIU, and the Valley of Death", clps: 3.0 }, // 8 lessons, 184 min
  veteran: { title: "Veteran Transition: From Uniform to Acquisition", clps: 2.5 }, // 7 lessons, 152 min
  history: { title: "Why the Rules Exist: A History of Defense Acquisition", clps: 2.5 }, // 7 lessons, 152 min
};

/** Sum of every module's CLPs, as advertised. */
export const GENERATED_TOTAL_CLPS = 44.6;

/**
 * Course-wide totals: the ONE place code reads "how many modules/lessons".
 * Emails, pages and generators all take their numbers from here (pages via
 * shared/courseTotals.generated.json, filled in by scripts/sync-blog.mjs).
 */
export const COURSE_TOTALS = {
  modules: 14,
  modulesWord: "Fourteen",
  lessons: 124,
  minutes: 2708,
  hours: 45.1,
  clps: 44.6,
  avgMinutes: 22,
  clpsWhole: 44
} as const;

/** Lesson ids per module. The server uses this to decide when a module is
 *  finished, which is what gates its Certificate of Completion. */
export const MODULE_LESSON_IDS: Record<string, readonly string[]> = {
  foundations: ["foundations-1","foundations-2","foundations-3","foundations-4","foundations-5","foundations-6","foundations-7","foundations-8","foundations-9","foundations-10"],
  finance: ["finance-1","finance-4","finance-3","finance-2","finance-5","finance-6","finance-7","finance-8","finance-9","finance-10"],
  contracts: ["contracts-8","contracts-13","contracts-1","contracts-2","contracts-4","contracts-7","contracts-5","contracts-9","contracts-3","contracts-6","contracts-11","contracts-10","contracts-12"],
  data: ["data-1","data-2","data-3","data-4","data-5","data-6","data-7","data-8"],
  capture: ["capture-1","capture-3","capture-2","capture-4","capture-5"],
  operations: ["ops-3","ops-1","ops-2","ops-4","ops-5","ops-6","ops-7"],
  business: ["business-1","business-2","business-11","business-3","business-4","business-5","business-6","business-7","business-8","business-9","business-10"],
  smallbiz: ["smallbiz-1","smallbiz-2","smallbiz-3","smallbiz-4","smallbiz-5","smallbiz-6","smallbiz-7","smallbiz-8","smallbiz-9","smallbiz-10"],
  compliance: ["compliance-1","compliance-2","compliance-3","compliance-4","compliance-5","compliance-6","compliance-7","compliance-8","compliance-9","compliance-10"],
  preaward: ["preaward-1","preaward-2","preaward-3","preaward-4","preaward-5","preaward-6","preaward-7","preaward-8","preaward-9","preaward-10"],
  lifecycle: ["lifecycle-1","lifecycle-2","lifecycle-3","lifecycle-4","lifecycle-5","lifecycle-6","lifecycle-7","lifecycle-8"],
  onramp: ["onramp-1","onramp-2","onramp-3","onramp-4","onramp-5","onramp-6","onramp-7","onramp-8"],
  veteran: ["veteran-1","veteran-2","veteran-3","veteran-4","veteran-5","veteran-6","veteran-7"],
  history: ["history-1","history-2","history-3","history-4","history-5","history-6","history-7"],
};

/** DAWIA functional areas printed on each module's certificate. */
export const MODULE_FUNCTIONAL_AREAS: Record<string, readonly string[]> = {
  foundations: ["Program Management (PM)","Contracting (CON)"],
  finance: ["Business Financial Management (BFM)","Program Management (PM)"],
  contracts: ["Contracting (CON)","Program Management (PM)"],
  data: ["Program Management (PM)","Business Financial Management (BFM)"],
  capture: ["Contracting (CON)","Program Management (PM)"],
  operations: ["Program Management (PM)"],
  business: ["Business Financial Management (BFM)","Program Management (PM)"],
  smallbiz: ["Contracting (CON)","Program Management (PM)"],
  compliance: ["Contracting (CON)","Program Management (PM)"],
  preaward: ["Contracting (CON)","Program Management (PM)"],
  lifecycle: ["Program Management (PM)","Life Cycle Logistics (LCL)"],
  onramp: ["Contracting (CON)","Program Management (PM)"],
  veteran: ["Program Management (PM)"],
  history: ["Program Management (PM)","Contracting (CON)"],
};
