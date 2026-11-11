// Build the Tour 2025 Form Guide.
//   node build.mjs          -> dist/index.html (full page, deploy anywhere)
//                              dist/artifact.html (same page as a body fragment, for claude.ai)
// Inputs: the group's verified cleaned CSVs (../data/cleaned in the team repo, ../cleaned in a
// local Task 3 folder) and data/official_classifications_2025.csv
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CLEAN = [path.resolve(here, '..', 'data', 'cleaned'), path.resolve(here, '..', 'cleaned')]
  .find((d) => fs.existsSync(path.join(d, 'result.csv')));
if (!CLEAN) throw new Error('cleaned CSVs not found in ../data/cleaned or ../cleaned');
const DATA = path.join(here, 'data');
const SRC = path.join(here, 'src');
const DIST = path.join(here, 'dist');

/** RFC 4180 CSV parser (quotes, doubled quotes, commas and newlines inside quotes). */
export function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [], cell = '', i = 0, q = false;
  while (i < text.length) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i += 2; continue; } q = false; i++; continue; }
      cell += c; i++; continue;
    }
    if (c === '"') { q = true; i++; continue; }
    if (c === ',') { row.push(cell); cell = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; i++; continue; }
    cell += c; i++;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.length > 1 || r[0] !== '');
  return body.map((r) => Object.fromEntries(head.map((h, j) => [h, r[j] ?? ''])));
}
const read = (dir, f) => parseCSV(fs.readFileSync(path.join(dir, f), 'utf8'));
const int = (x) => { const n = Number(x); if (!Number.isInteger(n)) throw new Error(`not an integer: ${x}`); return n; };

/** Load the cleaned tables into the compact shape the engine expects. */
export function loadData() {
  const riders = read(CLEAN, 'rider.csv').map((r) => [int(r.bib_number), r.rider_name, r.dob, r.rider_team, r.rider_country]);
  const teams = read(CLEAN, 'team.csv').map((t) => [t.team_name, t.team_country]);
  const stages = read(CLEAN, 'stage.csv').map((s) => [int(s.stage_id), s.date, Number(s.distance), s.type, s.start_location, s.finish_location]);
  const results = read(CLEAN, 'result.csv').map((r) => [int(r.bib_number), int(r.stage_id), int(r.finish_time), int(r.rank), int(r.time_bonus), int(r.time_penalty)]);
  const exits = read(CLEAN, 'exit.csv').map((e) => [int(e.bib_number), int(e.exit_stage), e.reason]);
  const countries = read(CLEAN, 'country.csv').map((c) => [c.country_code, c.country_name]);
  const official = read(DATA, 'official_classifications_2025.csv').map((o) => ({
    c: o.classification, rank: int(o.rank), bib: o.bib_number ? int(o.bib_number) : null, name: o.name,
    team: o.team_name, value: o.value_text, num: Number(o.value_numeric), unit: o.unit, url: o.source_url,
  }));
  // full published points and mountains standings (top 10 = official file); [classification, rank, bib, points]
  const published = read(DATA, 'published_points_kom_2025.csv').map((p) => [p.classification, int(p.rank), int(p.bib_number), int(p.points)]);
  // map outlines and stage towns for the route and nation maps (presentation only)
  const geo = JSON.parse(fs.readFileSync(path.join(DATA, 'geo_2025.json'), 'utf8'));
  // sanity checks against the documented shape of the cleaned data
  const expect = (cond, msg) => { if (!cond) throw new Error(`data check failed: ${msg}`); };
  expect(published.filter((p) => p[0] === 'points').length === 132 && published.filter((p) => p[0] === 'kom').length === 55, 'published points 132 / kom 55');
  for (const c of ['points', 'kom']) {
    const top = published.filter((p) => p[0] === c).slice(0, 10), off = official.filter((o) => o.c === c).sort((a, b) => a.rank - b.rank);
    expect(top.every((p, i) => p[1] === off[i].rank && p[2] === off[i].bib && p[3] === off[i].num), `published ${c} top 10 equals the official top 10`);
  }
  expect(stages.every((s) => geo.places[s[4]] && geo.places[s[5]]), 'every stage town has coordinates');
  expect(riders.length === 184, 'riders 184');
  expect(teams.length === 23, 'teams 23');
  expect(stages.length === 21, 'stages 21');
  expect(results.length === 3602, 'results 3602');
  expect(exits.length === 24, 'exits 24');
  expect(official.length === 50, 'official rows 50');
  const bibs = new Set(riders.map((r) => r[0]));
  expect(results.every((r) => bibs.has(r[0])), 'result bibs exist');
  expect(official.every((o) => o.bib == null || bibs.has(o.bib)), 'official bibs exist');
  expect(published.every((p) => bibs.has(p[2])), 'published bibs exist');
  return { riders, teams, stages, results, exits, countries, official, published, geo };
}

// Make inline <script> content safe: "</script" must not appear literally, and the
// JS line separators U+2028/U+2029 are written as escapes. (BS = one backslash.)
const BS = String.fromCharCode(92), LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
const escScript = (s) => s.replace(/<\/(script)/gi, '<' + BS + '/$1').split(LS).join(BS + 'u2028').split(PS).join(BS + 'u2029');

export function build() {
  const data = loadData();
  const css = fs.readFileSync(path.join(SRC, 'styles.css'), 'utf8');
  const body = fs.readFileSync(path.join(SRC, 'body.html'), 'utf8');
  const engine = fs.readFileSync(path.join(SRC, 'engine.js'), 'utf8');
  const app = fs.readFileSync(path.join(SRC, 'app.js'), 'utf8');
  const head = [
    '<title>Tour 2025 Form Guide</title>',
    '<meta name="claude:viewport-fit-sides" content="cover">',
    '<meta name="description" content="Interactive Tour de France 2025 form guide for bettors: outright, stage, jersey, team, nation and head-to-head markets.">',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap">',
    `<style>\n${css}\n</style>`,
  ].join('\n');
  const scripts = [
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/echarts/5.6.0/echarts.min.js"></script>',
    `<script>window.TDF_DATA = ${escScript(JSON.stringify(data))};</script>`,
    `<script>\n${escScript(engine)}\n</script>`,
    `<script>\n${escScript(app)}\n</script>`,
  ].join('\n');
  fs.mkdirSync(DIST, { recursive: true });
  const fragment = `${head}\n${body}\n${scripts}\n`;
  const full = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${head}\n</head>\n<body>\n${body}\n${scripts}\n</body>\n</html>\n`;
  fs.writeFileSync(path.join(DIST, 'artifact.html'), fragment);
  fs.writeFileSync(path.join(DIST, 'index.html'), full);
  return { bytes: Buffer.byteLength(full), dataBytes: Buffer.byteLength(JSON.stringify(data)) };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = build();
  console.log(`built dist/index.html (${(r.bytes / 1024).toFixed(0)} KB, data ${(r.dataBytes / 1024).toFixed(0)} KB) and dist/artifact.html`);
}
