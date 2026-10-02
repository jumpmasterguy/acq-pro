import { getTrackPath, splitIntoLegs } from '../client/src/lib/careerPath';

const TRACKS: Record<string, string[]> = {
  usg_pm: ['foundations','finance','contracts','data','preaward','lifecycle','operations'],
  contractor_pm: ['foundations','finance','business','contracts','data','preaward','smallbiz','onramp','compliance','lifecycle','operations'],
  contracting_officer: ['foundations','finance','contracts','preaward','smallbiz','compliance'],
  capture_bd: ['foundations','contracts','preaward','capture','smallbiz','onramp','compliance','operations'],
};

let bad = 0;
for (const [tid, ids] of Object.entries(TRACKS)) {
  const path = getTrackPath(tid);
  const groups = splitIntoLegs(ids.map(id => ({ id })), path);
  const flat = groups.flatMap(g => g.mods.map(m => m.id));
  const ok = JSON.stringify(flat) === JSON.stringify(ids);
  if (!ok) { bad++; console.log('LOST MODULES in', tid, flat); }
  console.log(`\n${tid}  (${groups.length} legs, every module kept: ${ok})`);
  groups.forEach((g, i) => {
    const gate = i < groups.length - 1 ? '  -> gate' : '  -> finish';
    console.log(`  Leg ${i+1} ${g.leg.name.padEnd(22)} ${g.mods.map(m=>m.id).join(', ')}${gate}`);
  });
  console.log(`  finish: "${path.finish.headline}" (${path.finish.lines.length} lines)`);
}
// a track with no authored path must still render
const fb = splitIntoLegs([{id:'foundations'},{id:'finance'}], getTrackPath('nonexistent_track'));
console.log(`\nfallback track: ${fb.length} leg(s), ${fb[0].mods.length} modules kept`);
console.log(bad === 0 ? '\nALL TRACKS OK' : `\n${bad} TRACK(S) BROKEN`);
