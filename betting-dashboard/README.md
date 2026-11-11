# Tour 2025 Form Guide (BT5110 Group 31, Task 3)

An interactive dashboard about the 2025 Tour de France, written for a sports-betting audience: what the 2025 results say about outright, stage, jersey, top-10, team, nationality and head-to-head markets for 2026.
added to deploy

## View it

- **Online:** the published claude.ai link (see the chat where it was built).
- **Locally:** open `dist/index.html` in any browser. It is a single self-contained page: all race data is inside the file. It needs an internet connection only for the chart library (ECharts 5.6.0 from cdnjs) and the fonts.
- **Deploy (Vercel, Netlify or GitHub Pages):** upload `dist/index.html` as the site's index page. No build step or server is needed.

## Pages

| Page | Betting market | Brief functions |
|---|---|---|
| Race card | Overview, jersey winners, road book, bet notes | landing |
| Outright | Yellow jersey | E1, E10, E7 |
| Stages | Stage winner | E2, E11, drill-down terrain → stage → rider |
| Terrain | Stage winner by terrain | E5, E6, specialists |
| Jerseys | Points, mountains, young rider | Task 3b, E4 |
| Form & risk | Top-10 / each-way, non-finish risk | E12 |
| Teams | Team classification, team-v-team | E3, E14 |
| Head-to-head | Rider v rider, team v team | user request |
| Nations | Top nationality | E8, E9 |
| Method | Definitions, sources, caveats | — |

Click any rider name to open their profile (drill-through). E13 (squad depth) and E15 (longest stage) are not used: every team had 8 riders, and stage length is trivia for bettors.

## Files

- `src/engine.js`: all calculations (standings after every stage, counterfactuals, team classification, terrain stats, head-to-heads and so on). The same file runs in the browser and in the tests.
- `src/app.js`, `src/styles.css`, `src/body.html`: the interface.
- `build.mjs`: reads `../cleaned/*.csv` and `data/official_classifications_2025.csv`, checks row counts, and writes `dist/index.html` (full page) and `dist/artifact.html` (the same page as a fragment for claude.ai).
- `data/official_classifications_2025.csv`: official final top 10s (overall, points, mountains, young, team) with source URLs. `data/official_sources.md` records how they were checked.
- `tests/engine.test.mjs`: compares every engine output with an independent pandas reference (`tests/expected/`). `tests/extra_truth.py` regenerates the extra reference files. `tests/harness.html` is a screenshot helper.

## Rebuild and test

```
node build.mjs
node tests/engine.test.mjs          # 25 checks, all must pass
node tests/jay_tabs.test.mjs        # 14 checks on pages 02-05 of ../peloton-pronostics-complete/index.html
python -P tests/extra_truth.py      # optional: regenerate the extra reference files
```

## Data notes

- Adjusted time = finish time − bonus + penalty. The standings after stage *s* rank only riders with a result on every stage 1..*s*; ties go to the lower sum of stage placings.
- Stage 21 was timed for the overall 50.3 km from the finish (rain was forecast), so race-data totals are 1h 01' 57" longer than official totals. All gaps match the official results.
- Our recomputed young-rider (born on or after 1 Jan 2000) and team (best three raw times per stage) top 10s equal the official ones.
- Points and mountains need official figures, because intermediate sprints and climb points are not in the data. The finish-line points use the official 2025 per-stage scale; Vingegaard's estimate equals his official 182.
