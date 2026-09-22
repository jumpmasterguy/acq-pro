/**
 * Career path shape: how a track's modules break into legs, and what a learner
 * can do at the end of each one.
 *
 * Why legs exist. A track is 6 to 11 modules and 20 to 38 hours. Presented as
 * one run it reads as a wall, and the only finish line is the whole track away.
 * Breaking it into three legs puts a real milestone every few modules, and each
 * milestone states a capability rather than a percentage, because "you can read
 * a solicitation and see how it got written" pulls and "27%" does not.
 *
 * Legs are defined by BOUNDARIES, not by counts or index ranges. `endsAfter`
 * names the module a leg closes on. The module list for a track is derived at
 * runtime from its primaryLessons, so a count would silently mis-split the
 * moment a lesson is added to or removed from a track. A boundary module that
 * is not in the track just merges its leg into the next one, which degrades
 * quietly instead of drawing a checkpoint in the wrong place.
 *
 * The last leg has no `endsAfter`: it runs to the end of the track, and its
 * checkpoint is the finish tile.
 */

export type PathLeg = {
  /** Short name for the leg, e.g. "Follow the money". */
  name: string;
  /** Module id this leg closes on. Omitted on the final leg. */
  endsAfter?: string;
  /** What the learner can do once the leg is done. Shown on the gate. */
  claim: string;
};

export type TrackPath = {
  legs: PathLeg[];
  finish: {
    headline: string;
    /** Four things they can explain out loud. Concrete, never adjectives. */
    lines: string[];
  };
};

export const TRACK_PATHS: Record<string, TrackPath> = {
  usg_pm: {
    legs: [
      {
        name: 'Learn the system',
        endsAfter: 'finance',
        claim: 'You can read your program’s budget and name the color of every dollar in it.',
      },
      {
        name: 'Put work on contract',
        endsAfter: 'preaward',
        claim: 'You can take a requirement from need to RFP without guessing at any step.',
      },
      { name: 'Run it to closeout', claim: '' },
    ],
    finish: {
      headline: 'You run the program instead of reacting to it.',
      lines: [
        'Why your Q1 obligation forecast always runs light and September turns into a scramble',
        'What color of money pays for what, and what an ADA violation actually costs',
        'How to read an EVM report and spot the trend two quarters before it becomes a breach',
        'Which instructions need a mod first, and how to say so without a fight',
      ],
    },
  },

  contractor_pm: {
    legs: [
      {
        name: 'Follow the money',
        endsAfter: 'business',
        claim: 'You can read a program’s budget and say where every dollar came from.',
      },
      {
        name: 'Win the work',
        endsAfter: 'smallbiz',
        claim: 'You can read a solicitation and see how it got written, and who it was written for.',
      },
      { name: 'Run the program', claim: '' },
    ],
    finish: {
      headline: 'You walk into the room and know what you are looking at.',
      lines: [
        'Why Q1 forecasts always run light and Q4 turns into a spending sprint',
        'Why a CPAF contract is really a rolling performance review that lands in your CPARS',
        'What a COR can and cannot tell you to do, and what “just start” actually costs',
        'Which FAR clause matters on a Tuesday, and which ones are noise',
      ],
    },
  },

  contracting_officer: {
    legs: [
      {
        name: 'Learn the rulebook',
        endsAfter: 'finance',
        claim: 'You can say which appropriation pays for a requirement, and what breaks if the wrong one does.',
      },
      {
        name: 'Run a source selection',
        endsAfter: 'preaward',
        claim: 'You can take a requirement from need to award and defend every step of it.',
      },
      { name: 'Stay out of trouble', claim: '' },
    ],
    finish: {
      headline: 'You can defend every signature you put on a file.',
      lines: [
        'Why a neutral past performance rating is not a penalty, and when to use it',
        'How to run a tradeoff that survives a protest, and what LPTA quietly costs you',
        'Which small business set-aside applies before you ever write the solicitation',
        'What the CICA stay really does to your schedule, and how to plan around it',
      ],
    },
  },

  capture_bd: {
    legs: [
      {
        name: 'Learn the buyer',
        endsAfter: 'contracts',
        claim: 'You can read a contract type and know how your customer gets paid to care.',
      },
      {
        name: 'Shape and win',
        endsAfter: 'capture',
        claim: 'You can size up a pursuit before the RFP drops and say whether it is worth chasing.',
      },
      { name: 'Deliver and repeat', claim: '' },
    ],
    finish: {
      headline: 'You stop bidding and start choosing.',
      lines: [
        'Why the pursuit that starts when the RFP drops is a donation to your competitor',
        'What your customer’s color of money says about when they can actually award',
        'How to ghost a competitor’s approach without naming them, and back it with proof',
        'Which recompetes you already lost on the day you won the contract',
      ],
    },
  },
};

/** Fallback for a track with no authored path: one unnamed leg, no gates. */
const SINGLE_LEG: TrackPath = {
  legs: [{ name: 'Your path', claim: '' }],
  finish: {
    headline: 'You walk into the room and know what you are looking at.',
    lines: [],
  },
};

export function getTrackPath(trackId: string): TrackPath {
  return TRACK_PATHS[trackId] ?? SINGLE_LEG;
}

/**
 * Cuts an ordered module-id list into legs at the authored boundaries.
 * Anything after the last boundary lands in the final leg, so a track that
 * grows a module still renders without touching this file.
 */
export function splitIntoLegs<T extends { id: string }>(
  mods: T[],
  path: TrackPath,
): { leg: PathLeg; mods: T[] }[] {
  const out: { leg: PathLeg; mods: T[] }[] = [];
  let rest = mods;
  path.legs.forEach((leg, i) => {
    const isLast = i === path.legs.length - 1;
    if (isLast || !leg.endsAfter) {
      if (rest.length) out.push({ leg, mods: rest });
      rest = [];
      return;
    }
    const cut = rest.findIndex(m => m.id === leg.endsAfter);
    // Boundary module absent from this track: skip the gate rather than
    // guessing a position. The leg's modules roll into the next leg.
    if (cut === -1) return;
    out.push({ leg, mods: rest.slice(0, cut + 1) });
    rest = rest.slice(cut + 1);
  });
  if (rest.length) {
    if (out.length) out[out.length - 1].mods.push(...rest);
    else out.push({ leg: path.legs[path.legs.length - 1], mods: rest });
  }
  return out.filter(g => g.mods.length > 0);
}
