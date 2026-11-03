# Delivery report — 3 November 2026

## Status

**Source implementation delivered; production readiness is not established.** No live deployment, successful production build, full dependency-aware TypeScript check, real DuckDB/Vitest run or browser-rendered screenshots are claimed.

The environment rejects npm registry requests with HTTP 403, including an actual lockfile-only installation attempt for `@duckdb/duckdb-wasm`. The connected GitHub account still receives 404 for `Jay-Nepal/bt5110-dashboard-prep`. These prevent completing the dependency installation, lockfile, full build/verification, screenshots and deployment here. The stack has not been substituted.

## Implemented in source

| Area | Implementation |
|---|---|
| Eight requested pages | Overview, Stages, Rider profile, Teams, Classifications, Nations, Pivot explorer and About the data |
| Extra comparison page | Head to head: common-stage adjusted-time deltas and rank-based wins/losses by terrain |
| Data layer | Immutable cleaned CSVs; explicit star-schema DDL with keys; analytical views; separate DuckDB and PostgreSQL loaders |
| Calculations | SQL windows for GC/eligibility/ties; exact even-sample medians; points configuration join; mountain proxy; both Young rules; both team awards; counterfactuals; speed ratios; participation/outcomes |
| OLAP | Operation tags; linked country/team/rider/stage cells; global dice filters; hierarchy/measure explorer using SQL ROLLUP |
| Presentation | 21-step URL-driven tour: E1–E15 and six extra-feature steps; captions, menu and keyboard controls |
| Evidence controls | SQL text and measured runtime panels; CSV table export; PNG chart export; deep links |
| Appearance/accessibility | Light/dark themes; labelled terrain palette; responsive layout; focus styles; chart data tables; loading and error states |
| Official references | Empty CSV template; validation of required and duplicate keys; reference-rank columns; exact-match agreement on supplied proxy rows |
| Deployment | GitHub Actions verify/build/browser/deploy workflow; relative asset base and hash routing; Vercel/Netlify configuration |
| Documentation | README, METRICS, DEMO_SCRIPT, original brief PDFs and build brief, checksum and audit evidence |

Every scenario has a directly selectable demo step. This reachability is implemented through URL state, but the click paths are **not browser-verified** until the included browser script runs.

## Checks actually completed

| Check | Result | What it does and does not establish |
|---|---|---|
| ZIP integrity and text/PDF readability | Passed | All 16 original files accessible; both PDFs extract text |
| Cleaned input checksums | 9/9 identical | Eight cleaned CSVs and README preserved byte-for-byte |
| Independent CSV audit | 28/28 passed after one evidenced expectation correction | Python/pandas verifies counts and all stated acceptance families; not the required SQL runtime |
| Supplemental SQL smoke | 144 queries executed; 0 errors; 4 ROLLUP cases skipped | SQLite loaded the shared model/views and application queries after adapting date syntax and ordered string aggregation; not DuckDB/PostgreSQL validation |
| Core strict TypeScript | Passed | State, query builders and formatters checked using locally available TypeScript 6.0.3; not the entire app or pinned compiler |
| URL state round trip | Passed | Filters, names with punctuation/accents, selections, tour and legend state survive serialization |
| TS/TSX syntax | No syntax diagnostics | All application and test files parsed/transpiled with the local compiler; unresolved dependency types prevent full type-checking |
| Build/screenshot script syntax | Passed | Node parses both scripts; this does not verify browser execution |
| Native DuckDB/Vitest suite | **Not run** | Required suite is included in tests/metrics.test.ts |
| Production build and browser tests | **Not run** | Requires installing the pinned packages first |
| PostgreSQL execution | **Not run** | Shared SQL is written for portability; the provided loader still needs an actual PostgreSQL run |
| Hosted deployment | **Not performed** | Repository inaccessible from the connection |

The supplemental SQLite smoke is explicitly distinguished because it cannot execute DuckDB-WASM or ROLLUP and cannot establish package/API compatibility, chart rendering or browser behavior.

## Data discrepancy and decisions

The brief’s pivotal-day definition gives exact half-second values. The expected integers appear truncated. The dashboard retains the actual medians:

| Rider | Stage | Actual delta | Brief expectation |
|---|---:|---:|---:|
| Tadej Pogacar | 12 | −206.5 s | −206 s |
| Jonas Vingegaard | 19 | −101.5 s | −101 s |
| Florian Lipowitz | 19 | −91.5 s | −91 s |
| Oscar Onley | 18 | −59.5 s | −59 s |

`METRICS.md` shows the middle two benchmark times and arithmetic. `docs/pivotal-evidence.csv` includes all ten benchmark riders on each relevant day. This is the only acceptance-value correction; no source CSV was edited.

Other intentional semantics:

- The title follows the 2025 CSV dates; 2026 is the academic project year.
- Loop stages remain valid, and ranks include rank 1, following the cleaned-data notes.
- Classification filters slice participants **after full-field ranking**. GC/Young use stages 1 through the end-stage control; Points/KOM remain labelled full-race references. This avoids silently presenting a terrain subtotal as overall GC.
- The team per-stage award respects the selected stages; participant filters select teams after award calculation. The final-GC-three alternative is a labelled full-race reference.
- Pivotal-day selection respects the selected stage slice but uses a fixed final-top-ten benchmark. Exact deltas, including halves, remain visible.
- Team workload is distinct from the award. Equal times are attributed to bibs deterministically for contribution breakdowns, without changing team totals.
- Speed medians are based on full-race finishers and stay fixed while the selected population changes.
- Registered rider count includes the two riders with zero results and is labelled accordingly. XXX is included as a nationality category and never mapped.
- A sourced Natural Earth world basemap is an auxiliary geometry asset; all analytical race values come solely from the cleaned CSVs. Small countries absent at 1:110m remain available in the table.
- The optional stage-town coordinate map is not implemented.

## Remaining work and exact path to completion

1. In an environment with npm registry access, run `npm install`. This produces the missing **package-lock.json**. Review and commit it; do not treat exact direct pins as a complete lock.
2. Run `npm test` and `npm run build`. Resolve any native DuckDB, browser DuckDB, ECharts, TanStack v9 or strict TypeScript incompatibility before claiming readiness.
3. Run `npx playwright install chromium` and `npm run screenshots`. The script visits all pages and 21 tour steps, tests counterfactual movement, exports, projector/mobile widths and the absence of console errors/external requests, then writes screenshots and a browser result JSON.
4. Visually inspect all report screenshots at 1920×1080 and the actual app at 1366×768. Check keyboard focus, contrast, legend state, zero-result filters, zero counterfactual changes and mobile scrolling.
5. Commit the lockfile and screenshot outputs. Set GitHub Pages to GitHub Actions, then push to `main`. The workflow deploys only after verification succeeds. Full commands are in README.
6. Open the URL reported by the deployment job and rehearse E1–E15 on the actual presentation machine. No live URL is currently asserted.

Because these steps remain, the requested ready-to-present deliverable and working deployed URL are **not yet complete**.
