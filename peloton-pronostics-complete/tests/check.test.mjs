// Checks the calculations behind pages 02-05 of peloton-pronostics-complete/index.html against the
// independent pandas reference (betting-dashboard/tests/expected/) and the verified engine
// (betting-dashboard/src/engine.js). Read-only: it changes no files.
//   node peloton-pronostics-complete/tests/check.test.mjs        (from the repo root)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..', '..');
// team repo: betting-dashboard/ and data/cleaned ; local Task 3 folder: dashboard/ and cleaned/
const DASH = ['betting-dashboard', 'dashboard'].map((d) => path.join(ROOT, d)).find((d) => fs.existsSync(path.join(d, 'src', 'engine.js')));
const CLEAN = [path.join(ROOT, 'data', 'cleaned'), path.join(ROOT, 'cleaned')].find((d) => fs.existsSync(path.join(d, 'result.csv')));
if (!DASH || !CLEAN) throw new Error('betting-dashboard/ (or dashboard/) and data/cleaned/ (or cleaned/) are needed next to this folder');
const { parseCSV, loadData } = await import(pathToFileURL(path.join(DASH, 'build.mjs')).href);

const html = fs.readFileSync(path.join(here, '..', 'index.html'), 'utf8');
const block = (open) => { const a = html.indexOf(open); if (a < 0) throw new Error(`missing ${open}`); const s = a + open.length; return html.slice(s, html.indexOf('</script>', s)); };
const ALL = JSON.parse(block('<script type="application/json" id="embedded-data">'));
const ctx = { module: { exports: {} } }; vm.createContext(ctx);
vm.runInContext(block('<script id="pp-analytics">'), ctx);
const A = ctx.module.exports.ppAnalytics(ALL.editions['2025']);
const exp = (f) => parseCSV(fs.readFileSync(path.join(DASH, 'tests', 'expected', f), 'utf8'));
const clean = (f) => parseCSV(fs.readFileSync(path.join(CLEAN, f), 'utf8'));
const require = createRequire(import.meta.url);
const engine = require(path.join(DASH, 'src', 'engine.js')).createEngine(loadData());

let pass = 0, fail = 0;
function check(name, fn) {
  const errs = [];
  try { fn((cond, msg) => { if (!cond && errs.length < 6) errs.push(msg); }); } catch (e) { errs.push('threw: ' + e.message); }
  if (errs.length) { fail++; console.log(`FAIL ${name}\n   ` + errs.join('\n   ')); } else { pass++; console.log(`ok   ${name}`); }
}
const near = (a, b, tol) => a == null || b === '' ? a == null && b === '' : Math.abs(a - Number(b)) <= tol;
const num = (x) => (x === '' ? null : Number(x));

check('2025 stage records in the page equal data/cleaned/result.csv', (t) => {
  const ref = clean('result.csv');
  const mine = new Map(); ALL.editions['2025'].riders.forEach((r) => r.s.forEach((a) => mine.set(`${r.bib}/${a[0] + 1}`, a)));
  t(mine.size === ref.length && ref.length === 3602, `count ${mine.size} vs ${ref.length}`);
  ref.forEach((x) => { const a = mine.get(`${x.bib_number}/${x.stage_id}`);
    t(a && a[1] === +x.finish_time && a[2] === +x.time_bonus && a[3] === +x.time_penalty && a[4] === +x.rank, `bib ${x.bib_number} stage ${x.stage_id}`); });
});
check('exits added to the data equal data/cleaned/exit.csv', (t) => {
  const ref = clean('exit.csv'); const ex = ALL.editions['2025'].exits;
  t(ex.length === ref.length, 'count'); ref.forEach((x) => t(ex.some((e) => e[0] === +x.bib_number && e[1] === +x.exit_stage && e[2] === x.reason), `bib ${x.bib_number}`));
});
check('rider totals, consistency, overall and young rank (rider_overall.csv)', (t) => {
  exp('rider_overall.csv').forEach((x) => { const r = A.byBib.get(+x.bib);
    t(r.starts === +x.starts && r.wins === +x.wins && r.podiums === +x.podiums && r.top10s === +x.top10s, `counts ${x.bib}`);
    t(near(r.avgRank, x.avg_rank, 1e-3) && near(r.sdRank, x.rank_stdev, 2e-3), `avg/sd ${x.bib}: ${r.avgRank} ${r.sdRank} vs ${x.avg_rank} ${x.rank_stdev}`);
    t((r.gc ?? null) === num(x.gc_rank), `gc ${x.bib}`);
    t((r.yr ?? null) === num(x.young_rank), `young ${x.bib}`);
    t(r.finished === (x.finished_race === 'True'), `finished ${x.bib}`);
    t(r.age === num(x.age_at_start), `age ${x.bib}: ${r.age} vs ${x.age_at_start}`);
    t((r.exit ? r.exit.stage : null) === num(x.exit_stage) && (r.exit ? r.exit.reason : '') === x.exit_reason, `exit ${x.bib}`); });
});
check('terrain record per rider (rider_terrain.csv)', (t) => {
  exp('rider_terrain.csv').forEach((x) => { const s = A.byBib.get(+x.bib).terrain[x.type_code];
    t(s.starts === +x.starts && s.wins === +x.wins && s.podiums === +x.podiums && s.top10s === +x.top10s && near(s.avgRank, x.avg_rank, 1e-3), `${x.bib} ${x.type_code}`); });
});
check('stage winners, margins, bunch size and leader (stage_summary.csv)', (t) => {
  exp('stage_summary.csv').forEach((x) => { const s = A.stages[+x.stage_id - 1];
    t(s.winner === +x.winner_bib && s.field === +x.riders_finished && s.inWinnerTime === +x.riders_in_winner_time, `stage ${x.stage_id} winner/field`);
    t(s.margin === num(x.winning_margin_s) && s.marginToSecond === num(x.margin_to_second_s), `stage ${x.stage_id} margins ${s.margin}/${s.marginToSecond} vs ${x.winning_margin_s}/${x.margin_to_second_s}`);
    t(A.byBib.get(s.leader).n === x.yellow_after_stage, `stage ${x.stage_id} leader ${A.byBib.get(s.leader).n} vs ${x.yellow_after_stage}`); });
});
check('team record (team_summary.csv)', (t) => {
  exp('team_summary.csv').forEach((x) => { const T = A.teams.find((y) => y.name === x.team);
    t(T && T.size === +x.riders && T.finishers === +x.riders_finished && T.dns === +x.exits_dns && T.withdrawals === +x.exits_withdrawal, `${x.team} riders/exits`);
    t(T.wins === +x.stage_wins && T.podiums === +x.podiums && T.top10s === +x.top10s && T.bestGc === num(x.best_gc_rank) && T.classRank === +x.team_class_rank_raw, `${x.team} results`);
    ['flat', 'hilly', 'mountain', 'itt'].forEach((c) => t(T.byTerrain[c].wins === +x[`wins_${c}`] && T.byTerrain[c].top10s === +x[`top10_${c}`], `${x.team} ${c}`)); });
});
check('team top-10s by terrain (extra_team_top10_terrain.csv)', (t) => {
  exp('extra_team_top10_terrain.csv').forEach((x) => t(A.teams.find((y) => y.name === x.team).byTerrain[x.code].top10s === +x.top10s, `${x.team} ${x.code}`));
});
check('team classification totals and gaps (team_classification.csv)', (t) => {
  exp('team_classification.csv').forEach((x) => { const T = A.teamClass[+x.team_class_rank_raw - 1];
    t(T.name === x.team && T.classTotal === +x.total_raw_s && T.classGap === +x.gap_raw_s && T.firsts === +x.stage_team_firsts, `rank ${x.team_class_rank_raw} ${x.team}`); });
});
check('team gap to the leading team after every stage (team_class_by_stage.csv)', (t) => {
  exp('team_class_by_stage.csv').forEach((x) => { const T = A.teams.find((y) => y.name === x.team);
    t(T.gapAt[+x.stage_id - 1] === num(x.cum_gap_raw_s), `${x.team} stage ${x.stage_id}: ${T.gapAt[+x.stage_id - 1]} vs ${x.cum_gap_raw_s}`); });
});
check('calculated team classification equals the published top 10', (t) => t(A.matchesOfficial === true, 'does not match'));
check('nation record (nation_summary.csv)', (t) => {
  const codeOf = new Map(clean('rider.csv').map((r) => [+r.bib_number, r.rider_country]));
  exp('nation_summary.csv').filter((x) => +x.riders > 0).forEach((x) => { const bibs = [...codeOf].filter(([, c]) => c === x.country_code).map(([b]) => b);
    const names = new Set(bibs.map((b) => A.byBib.get(b).c));
    t(names.size === 1, `${x.country_code} maps to ${[...names]}`);
    const N = A.nations.find((n) => n.c === [...names][0]);
    t(N && N.riders === +x.riders && N.finishers === +x.riders_finished && N.wins === +x.stage_wins && N.podiums === +x.podiums && N.top10s === +x.top10s && N.bestGc === num(x.best_gc_rank), `${x.country_code}`); });
});
check('riders starting, finishing and leaving each stage (exits_by_stage.csv)', (t) => {
  exp('exits_by_stage.csv').forEach((x) => { const s = A.exitStages[+x.stage_id - 1];
    t(s.started === +x.riders_started && s.finished === +x.riders_finished && s.dns === +x.exits_dns && s.withdrawals === +x.exits_withdrawal, `stage ${x.stage_id}`); });
});
check('terrain specialists equal the engine ranking (consistency)', (t) => {
  ['flat', 'hilly', 'mountain', 'itt'].forEach((c) => { const mine = A.specialists(c).slice(0, 10).map((x) => x.bib), ref = engine.consistency(c).slice(0, 10).map((x) => x.bib);
    t(JSON.stringify(mine) === JSON.stringify(ref), `${c}: ${mine} vs ${ref}`); });
});
check('2024 and 2026 published standings are complete', (t) => {
  ['2024', '2026'].forEach((y) => { const g = ALL.editions[y].riders.map((r) => r.gc).sort((a, b) => a - b);
    t(g.every((v, i) => v === i + 1), `${y} GC ranks not 1..n`); });
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
