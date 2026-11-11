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

From the repo root, run `node peloton-pronostics-complete/tests/check.test.mjs`. It compares every figure on pages 02–05 with the pandas reference in `betting-dashboard/tests/expected/` and the verified engine in `betting-dashboard/src/`. It only reads those files and changes nothing. Result: 14/14 pass.

This folder is self-contained. Nothing outside it is changed.

## Page 06: Place your bet

A bet builder in three steps: (1) pick an objective (yellow, best climber, green, white, best team), (2) pick rider or team A against B, (3) check the race-day weather. The weather is set automatically from the live Open-Meteo forecast for the finish town when the race date is within 16 days. Otherwise it uses the most common 2025 race-day weather. The player can overrule any condition. That weather call then becomes part of the bet, so the odds go up.

- Chance that A beats B = (weighted 2025 stages where A finished ahead + 1) / (weighted stages + 2). A stage with the same weather as the race day counts fully; each condition that differs halves its weight.
- Odds = 1 / (chance × probability of each overruled weather call). Fair odds, no bookmaker margin.
- 2025 race-day weather: `data/weather/stage_weather_2025.csv`, made by `data/weather/fetch_weather.py` (finish town, 13:00–18:00; wet ≥ 1 mm, hot ≥ 28 °C, windy ≥ 20 km/h).
- In `index.html`: `<style id="bet-css">`, `<section id="ppBet" data-xpage="6">`, `<script id="bet-weather-2025">` (the weather data) and `<script id="bet-page">` (all bet logic, commented). Placed bets are kept in the browser's local storage only.
- The live forecast needs an internet connection. Without one, the page says so and falls back to the 2025 weather.
