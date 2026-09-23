// GENERATED FILE — DO NOT EDIT BY HAND.
// Written by scripts/gen-module-clps.mjs from client/src/lib/curriculum.ts,
// regenerated at the top of every build. Edit lesson durations in the
// curriculum, not the numbers here.
//
// 1 CLP = 1 hour of instruction (DAU policy): each module's summed lesson
// durations over 60, to one decimal.
//
// 14 modules · 123 lessons · 2684 minutes · 44.2 CLPs total

import type { ModuleClp } from "./moduleClps";

export const GENERATED_MODULE_CLPS: Record<string, ModuleClp> = {
  foundations: { title: "DoD Acquisitions Foundations", clps: 2.5 }, // 10 lessons, 151 min
  finance: { title: "Defense Finance & Budgeting", clps: 4.0 }, // 10 lessons, 245 min
  contracts: { title: "Defense Contracting Fundamentals", clps: 4.1 }, // 13 lessons, 249 min
  data: { title: "Data Analytics for Program Managers", clps: 2.9 }, // 8 lessons, 174 min
  capture: { title: "Capture Management & Business Development", clps: 1.6 }, // 5 lessons, 96 min
  operations: { title: "Program Operations & Leadership", clps: 1.8 }, // 7 lessons, 109 min
  business: { title: "The Business of Defense Contracting", clps: 4.2 }, // 10 lessons, 257 min
  smallbiz: { title: "Small Business in Defense Contracting", clps: 3.9 }, // 10 lessons, 237 min
  compliance: { title: "The Compliance Stack", clps: 4.0 }, // 10 lessons, 245 min
  preaward: { title: "From Need to RFP: The Government Pre-Award Process", clps: 4.0 }, // 10 lessons, 241 min
  lifecycle: { title: "Beyond Award: Sustainment, Test, Software, and Closeout", clps: 3.2 }, // 8 lessons, 192 min
  onramp: { title: "The Startup On-Ramp: SBIR, OTs, DIU, and the Valley of Death", clps: 3.0 }, // 8 lessons, 184 min
  veteran: { title: "Veteran Transition: From Uniform to Acquisition", clps: 2.5 }, // 7 lessons, 152 min
  history: { title: "Why the Rules Exist: A History of Defense Acquisition", clps: 2.5 }, // 7 lessons, 152 min
};

/** Sum of every module's CLPs, as advertised. */
export const GENERATED_TOTAL_CLPS = 44.2;
