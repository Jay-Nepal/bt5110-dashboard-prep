\# Build brief: Tour de France 2025 OLAP dashboard (BT5110 Task 3, Group 31)



Build a custom-coded, internet-deployable analytical dashboard for a university data-warehousing project. It will be graded on how well it supports OLAP-style analysis, and demonstrated live in a presentation. Read this whole brief and the attached files before writing code.



\## 0. Attached files



\- \`cleaned/\` contains \`country.csv\`, \`team.csv\`, \`rider.csv\`, \`location.csv\`, \`stage.csv\`, \`result.csv\`, \`exit.csv\`, \`country_code_map.csv\` and \`README.md\`. These files are the only data source. **\*\*Read \`README.md\` first\*\***, because it explains the data quirks listed below.

\- \`BT5110 Project Tour de France 2026.pdf\` is the project brief. Task 3 sets the requirements.

\- \`project dashboard suggested functions-1.pdf\` describes 15 demo scenarios, E1–E15, which the dashboard must support.



Data at a glance: the 2025 Tour de France, with 21 stages (5–27 July 2025, rest days 15 and 21 July). There are 184 riders in 23 teams of 8, 3,602 stage results, 24 exits and 160 riders who finished all 21 stages. All times are in seconds and distance is in km. Country codes are ISO 3166-1 alpha-3, and \`XXX\` means "Not specified".



\## 1. What must be delivered



The brief's Task 3 requirements:



\- **\*\*a. Drill-down analysis:\*\*** users explore results at different levels of detail, by stage, rider or team.

\- **\*\*b. Classification comparison:\*\*** compare rankings across General Classification (GC), Points, King of the Mountains (KOM) and Young Rider.

\- **\*\*c. Aggregate performance:\*\*** cumulative race times by rider, team and classification.

\- **\*\*d. Country participation:\*\*** number of teams per country and number of riders per country.

\- **\*\*e. Design and presentation:\*\*** a clear, intuitive, visually appealing dashboard with an organised layout, good use of colour and interactive features.



In addition:



\- Every scenario E1–E15 must be demonstrable within 3 clicks from the Demo tour (section 6).

\- Add the extra features in section 6.

\- Label the OLAP operations explicitly: roll-up, drill-down, slice, dice and pivot.



Deadline: a working, deployed URL by **\*\*9 November 2026\*\***. The demo is due by 11 November.



\## 2. Stack (fixed; ask before changing it)



\- **\*\*Vite + React + TypeScript\*\*** (strict mode) and **\*\*Tailwind CSS\*\***.

\- **\*\*DuckDB-WASM\*\*** loads the CSVs in the browser and builds the star schema and analytical views with SQL. **\*\*All aggregation happens in SQL, not in JavaScript.\*\*** Bundle the DuckDB wasm files with the app, so nothing loads from a CDN at runtime.

\- **\*\*Apache ECharts\*\*** for charts and **\*\*TanStack Table\*\*** for tables.

\- **\*\*All filter, selection and drill state lives in the URL\*\***, so every view can be linked to. Use hash routing, or configure Vite's \`base\`, so deep links work on GitHub Pages without server rewrites.

\- **\*\*Static build only:\*\*** no backend, no database server, no API keys or secrets.

\- Deploy to **\*\*GitHub Pages\*\*** through GitHub Actions. The build must also work unchanged on Vercel or Netlify.

\- **\*\*Vitest\*\*** for tests. Run the same SQL files against DuckDB in Node so the metric tests check the real queries.

\- Use current stable versions, pin exact versions, and commit the lockfile.



The reasons for this stack: no server can sleep or fail during the live demo, and the SQL stays central and reusable. The team will run the same star-schema SQL in PostgreSQL for Task 4.



\## 3. Data model



Put the star schema in \`sql/01_star_schema.sql\`, written in SQL that runs in **\*\*both DuckDB and PostgreSQL\*\***. Keep anything DuckDB-only, such as reading the CSVs, in a separate file.



\- \`dim_country(country_code, country_name, display_name)\`. Display names: "Netherlands, Kingdom of the" → "Netherlands", "United Kingdom of Great Britain and Northern Ireland" → "United Kingdom", "United States of America" → "United States". All other names stay as they are.

\- \`dim_team(team_name, team_country, team_country_name)\`.

\- \`dim_rider(bib_number, rider_name, dob, age_at_start, team_name, rider_country, team_country, finished_race, exit_stage, exit_reason)\`.

\- \`dim_stage(stage_id, date, distance_km, type, start_location, finish_location, is_loop)\`.

\- \`fact_results(bib_number, stage_id, team_name, rider_country, finish_time, rank, time_bonus, time_penalty, adjusted_time, gap_to_winner, is_winner, is_podium, is_top10, points_proxy)\`, at one row per rider per stage.



Put the analytical views (GC by stage, classifications, team classification, nations and so on) in \`sql/02_views.sql\`, using window functions and \`GROUP BY ROLLUP\`/\`GROUPING SETS\` where they fit.



Formatting: total times as \`h:mm:ss\`, gaps as \`+m:ss\`, distances to 1 decimal place. Show stages as "Stage 12 · Auch → Hautacam".



\## 4. Metric definitions (follow exactly; document them in \`METRICS.md\` and in UI tooltips)



1\. **\*\*Adjusted time\*\*** = \`finish_time − time_bonus + time_penalty\`.

2\. **\*\*GC after stage k:\*\*** rank only riders who have a result on every stage from 1 to k. Results run without gaps, so a rider who left has no row at stage k. Rank by cumulative adjusted time. Tied riders share a rank (1, 1, 3), shown with "=". The final GC uses the 160 riders with all 21 results. **\*\*Never rank riders who left early alongside finishers.\*\*** Their partial totals are the lowest, so a plain sum puts Jasper Philipsen, who left after stage 2, first.

3\. **\*\*Stage winner\*\*** = \`rank = 1\`. **\*\*Stage gap\*\*** = \`finish_time − finish_time of the rank-1 rider\`. \`rank\` is the order of crossing the line, and the credited time can be lower for a later rider. This happens 12 times, and the gap is −9 s for two riders on stage 21. Show these values as they are, with a tooltip explaining them. Use \`rank\` for placings and time for gaps.

4\. **\*\*Points classification (proxy):\*\*** the data has no intermediate sprints. Award finish-line points by stage rank, using scales kept in a config file:

   - flat: \`50,30,20,18,16,14,12,10,8,7,6,5,4,3,2\`

   - hilly: \`30,25,22,19,17,15,13,11,9,7,6,5,4,3,2\`

   - mountain and individual time trial: \`20,17,15,13,11,10,9,8,7,6,5,4,3,2,1\`



   Break ties by better GC rank. Label it everywhere as **\*\*"Points (finish-line proxy)"\*\***.

5\. **\*\*KOM classification (proxy):\*\*** the data has no climb points. Use the **\*\*mountain-stage GC\*\***: cumulative adjusted time on the 6 mountain stages (10, 12, 14, 16, 18 and 19), counting only riders who finished all six. Label it **\*\*"KOM (mountain-stage proxy)"\*\***. Secondary signals (E5): podium count on mountain stages, and mean stage gap on mountain stages.

6\. **\*\*Young rider:\*\*** GC restricted to riders under 26 at race start, meaning \`dob > 1999-07-05\`. That gives 57 eligible riders. Provide a toggle for the alternative calendar-year rule, \`dob >= 2000-01-01\`, which gives 48. The default is the race-start rule.

7\. **\*\*Team classification:\*\*** for each stage, add up the 3 lowest \`finish_time\` values among the team's riders (no bonuses or penalties), then total over all stages. The lowest total wins. Provide a toggle for the alternative "best three riders in the final GC". **\*\*Never rank teams by the raw sum of all their riders' times.\*\*** Teams that lost riders would then look better; for example, INEOS would "win" with only 7 riders.

8\. **\*\*Pivotal day (E1):\*\*** for each rider and stage, compute \`delta = rider's adjusted time − median adjusted time of the final GC top 10 on that stage\`. The rider's pivotal day is the stage with the largest absolute delta, shown with its sign. Don't use change in GC rank, which is noisy on early stages, or gap to leader, which is always zero for the leader.

9\. **\*\*Counterfactuals (E7):\*\*** recompute GC with toggles to remove bonuses, remove penalties, or both, and a stage slider for GC as of stage k. The honest finding is that the final standings don't move at all; only the leader on stages 1–4 changes. The UI must state "0 position changes" clearly, so the view doesn't look broken. It should show movement wherever it exists: the early-stage leader, and ranks outside the top 10 at any stage.

10\. **\*\*Speed (E6):\*\*** \`km/h = distance / (finish_time / 3600)\`. Combine stages as total distance divided by total time, not as a mean of ratios. Compare riders with a terrain index: the rider's speed divided by the median finisher speed for that stage type. A rider who "gains when the terrain shifts" has a mountain index above their flat-plus-hilly index.

11\. **\*\*Top 10\*\*** = \`rank ≤ 10\`. **\*\*Podium\*\*** = \`rank ≤ 3\`.

12\. **\*\*Nations:\*\*** count teams per country by \`team_country\`, and riders per country by \`rider_country\`, with a switch between the two. For each nation (E9), show the best final GC rank, stage wins and podiums.



\## 5. Pages



**\*\*Global filter bar on every page:\*\*** stage range (1–21), stage type (multi-select), team, nation and rider search. Every view responds to these filters. Include "clear all" and a breadcrumb showing the current drill path, such as \`All › FRA › TOTALENERGIES › Jordan Jegat › Stage 12\`.



1\. **\*\*Overview (a, c, E10):\*\***

   - KPI tiles: stages, total km, riders started, finishers, teams and nations.

   - GC top-10 table with gaps.

   - A strip showing the GC leader after each stage.

   - A storyline line chart of gap to leader after each stage for selected riders (default: final top 5). Shade the mountain stages and annotate leader changes and the biggest swings.

2\. **\*\*Stages (a, E2, E11, E15):\*\***

   - A sortable stage table.

   - For a selected stage: the top finishers (rank, rider, team, nation, finish time, bonus, penalty, adjusted time and gap) and a team view of who filled the top ten.

   - A time-trial (ITT) catalogue showing date, distance and winner.

   - A spotlight on the longest stage.

3\. **\*\*Rider profile (a, E1, E5, E12; every rider name links here):\*\***

   - A stage-by-stage trace of rank, adjusted time, GC rank after the stage, and gap to leader.

   - A callout for the pivotal day.

   - Mountain signals.

   - The rider's top-10 finishes with stage types.

4\. **\*\*Teams (a, c, E3, E6, E13, E14):\*\***

   - The team classification table.

   - A Team → Rider → Stage drill-down showing how each rider's time added to the team total. Show stages ridden next to it, because riders who left contribute less time.

   - Squad depth. Every team started 8, so show the riders who finished, the riders with results, and the number of nations.

   - A heatmap of top-10 finishes by team and stage type; clicking a cell lists the stages and riders.

   - A speed profile by stage type for riders and teams.

5\. **\*\*Classifications (b, c, E4, E7):\*\***

   - A side-by-side table of GC rank, Points proxy rank, KOM proxy rank and Young rank.

   - A bump or slope chart across the classifications.

   - A notice where the mountain proxy differs from overall GC.

   - The counterfactual lab.

   - An official-reference column (section 7).

6\. **\*\*Nations (d, E8, E9):\*\***

   - A world choropleth map keyed on the ISO3 codes, switchable between riders and teams.

   - A bar chart of the same counts.

   - Clicking a country drills down to its riders and their teams.

   - A national outcomes table that links back to stages and riders.

7\. **\*\*Pivot explorer (OLAP sandbox):\*\***

   - Users choose the row dimension(s): nation, team, rider, stage type or stage.

   - Users choose the measure: total adjusted time, mean rank, top-10 count, wins, podiums or km/h.

   - Show subtotals from \`ROLLUP\`, and let users drill down by clicking a row.

8\. **\*\*About the data:\*\***

   - Sources.

   - A summary of the cleaning, from \`README.md\`.

   - Metric definitions.

   - A clear list of the proxies and their limitations.

   - The star-schema diagram.

   - Credits: BT5110 Group 31.



\## 6. Extra features (required)



1\. **\*\*Demo tour:\*\*** a guided mode with one step per scenario, E1–E15, plus one step per extra feature. Each step loads its page, filters and selection through URL state and shows a 1–2 sentence caption on what to notice. Use ←/→ to move between steps and Esc to leave. This is how the team will present.

2\. **\*\*"Show SQL" on every chart and table:\*\*** a panel with the exact SQL that ran, its runtime in ms, and a tag for the OLAP operation (roll-up, drill-down, slice, dice or pivot).

3\. **\*\*Copy link:\*\*** a button that copies the current view's deep link.

4\. **\*\*Head-to-head:\*\*** compare any two riders, with a stage-by-stage gap trace and a win/loss count per stage type.

5\. **\*\*Export:\*\*** CSV download for every table and PNG download for every chart.

6\. **\*\*Themes and palette:\*\***

   - Light and dark themes.

   - Classification accents inspired by the jerseys: yellow for GC, green for Points, polka-dot red for KOM, and white for Young. Keep AA contrast, which means white needs an outline.

   - One stage-type palette (flat, hilly, mountain, ITT) used everywhere, safe for colour-blind viewers, and never the only way information is shown.



Optional stretch, only after everything else passes: a map of stage start and finish towns. Coordinates must come from a geocoding source recorded in a file with its source. Never guess coordinates.



\## 7. Official Points and KOM standings (optional input)



The data has no official Points or KOM results. Support an optional file, \`public/data/official_classifications.csv\`, with these columns: \`classification\` (points | kom | young | gc | team), \`rank\`, \`bib_number\`, \`team_name\`, \`value\`, \`source_url\`. Ship it as an empty template with only the header row; the team will fill it in.



If the file has rows, show the official ranks next to the proxies, with an agreement score. If it's empty, show "Official standings not loaded". **\*\*Never invent, hard-code or scrape official results.\*\***



\## 8. Quality bar



\- Readable on a projector at 1366×768 and at 1920×1080. On mobile, the layout stacks vertically and works read-only.

\- Show skeleton placeholders while DuckDB starts up, show an error state if loading fails, and have no console errors.

\- Keyboard navigable, with aria labels on charts and controls.

\- Format numbers the same way everywhere.

\- Each view gets its data through a typed query function. Components contain no business logic.



\## 9. Acceptance tests (Vitest, running the real SQL; all must pass)



\| Check | Expected |

\|---|---|

\| Row counts | 30 countries, 23 teams, 184 riders, 39 locations, 21 stages, 3,602 results, 24 exits; 160 finishers |

\| Final GC top 5 (gap) | Tadej Pogacar 277,349 s; Jonas Vingegaard +264; Florian Lipowitz +660; Oscar Onley +732; Félix Gall +1,032 |

\| Final GC 6–10 (gap) | Tobias Johannessen +1,214; Kévin Vauquelin +1,355; Primoz Roglic +1,530; Ben Healy +1,682; Jordan Jegat +1,962 |

\| GC leader after each stage | 1 Jasper Philipsen; 2–3 Mathieu Van Der Poel; 4 tie between Pogacar and Van Der Poel; 5 Pogacar; 6 Van Der Poel; 7–9 Pogacar; 10–11 Ben Healy; 12–21 Pogacar |

\| Team classification (per-stage best 3, finish time) | TEAM VISMA \\| LEASE A BIKE; UAE TEAM EMIRATES XRG +1,466 s; RED BULL - BORA - HANSGROHE +5,087 s; ARKEA-B&B HOTELS +7,852 s |

\| Team classification (final-GC best 3 toggle) | Visma; Red Bull +627 s; UAE +659 s |

\| KOM proxy top 5 | Pogacar; Vingegaard +151; Lipowitz +371; Onley +437; Gall +601 |

\| Points proxy top 5 | Pogacar 236; Vingegaard 176; Jonathan Milan 160; Wout Van Aert 121; Onley 118 |

\| Young rider top 3 (race-start rule) | Lipowitz, Onley, Tobias Johannessen; 57 eligible (48 under the calendar-year rule) |

\| Top-10 finishes | Pogacar 13; Vingegaard 11; Onley 8; Vauquelin 7 |

\| Mountain podiums | Vingegaard 4; Pogacar 4; Thymen Arensman 3; Ben Healy 2 |

\| Pivotal day | Pogacar stage 12 (−206 s); Vingegaard stage 19 (−101 s); Lipowitz stage 19 (−91 s); Onley stage 18 (−59 s) |

\| Counterfactual, bonuses and penalties removed | 0 final position changes among the 160 finishers; the leader differs only on stages 1–4 |

\| Stage 8 | Rank 1 is Jonathan Milan (10 s penalty); the lowest adjusted time is Wout Van Aert (rank 2) |

\| ITT catalogue | Stage 5, 2025-07-09, 33.0 km, Remco Evenepoel; Stage 13, 2025-07-18, 10.9 km, Tadej Pogacar |

\| Longest stage | Stage 2, 2025-07-06, 209.1 km, hilly, Lauwin-Planque → Boulogne-Sur-Mer |

\| Nations | Riders: France 38, Belgium 29, Netherlands 13. Teams: France 5, Belgium 4. 27 rider nationalities, 14 team countries; 115 of 184 riders race for a team from another country |



If a test fails, fix the SQL. Don't change the expected value unless you can show it's wrong from the CSVs; if so, report it.



\## 10. Deliverables



\- A Git repository containing:

  - \`README.md\`: local development, build, deploying to GitHub Pages and to Vercel, and base-path setup.

  - \`METRICS.md\`.

  - \`DEMO_SCRIPT.md\`: for E1–E15 and each extra feature, the clicks plus one talking point.

  - The \`sql/\` files and the tests.

  - A GitHub Actions workflow that runs test → build → deploy to Pages on every push to \`main\`.

\- \`docs/screenshots/\`: one PNG per page at 1920×1080, for the written report.

\- The live URL, if you can deploy. Otherwise, give the exact commands the user should run, and never ask for their credentials.

\- A final report: what's done, the test results, anything not done, and any deviation from this brief with the reason.



\## 11. Working rules



1\. Read \`cleaned/README.md\` first. Before building any UI, load the data and confirm the row counts in section 9.

2\. Don't edit the cleaned CSVs. Derive everything else in SQL.

3\. If a requirement conflicts with the data, follow the data and record the conflict in the final report.

4\. Work in this order: data layer and tests → pages → extra features → polish → deploy. Keep the app deployable at every step.
