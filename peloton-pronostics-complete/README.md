# Peloton & Pronostics: completed version

`index.html` is a copy of Jay's `jay.html` (repo root) with the four WIP pages filled in. Jay's `jay.html` is not changed. Open `index.html` in a browser; it works offline.

## What is added

| Page | Panels |
|---|---|
| 02 Who suits each stage? | Route map of France (21 stages, coloured by terrain) with a stage card · stage winners by terrain · terrain heatmap · specialist finder · rider head-to-head |
| 03 Who is most reliable? | Consistency scatter · rider heatmap with exits · finish rate by team · exit timeline |
| 04 Which teams are strongest? | Team leaderboard (calculated team classification equals the published top 10) · team terrain heatmap · who scored for the team · team time trend · team registration map |
| 05 Which countries stand out? | Europe country map, with tiles for nations outside Europe · results per 100 stage starts · age distribution · country × jersey heatmap for 2024 / 2025 / 2026 |

Page 01 and the glossary are Jay's, unchanged. The WIP tags and placeholder page are removed, and the Data & methods dialog gains a "Pages 02–05" section and the new sources.

## Where the additions are in the file

- `<style id="pp-css">`: styles for pages 02–05
- `<section class="pp-page" data-xpage="1…4">`: the four pages
- `<script type="application/json" id="pp-geo">`: map outlines (Natural Earth via world-atlas) and stage town positions (© OpenStreetMap contributors)
- `<script id="pp-analytics">`: all calculations (pure function, also run by the tests)
- `<script id="pp-tabs">`: charts and interaction
- Three keys added to the embedded 2025 data: `exits` (from `data/cleaned/exit.csv`), `teamOfficial` (published team classification top 10), and `teamCountry` (from `data/cleaned/team.csv`)

## Checks

`node betting-dashboard/tests/jay_tabs.test.mjs` compares every figure on pages 02–05 with the pandas reference in `betting-dashboard/tests/expected/` and the verified engine: 14/14 pass.
