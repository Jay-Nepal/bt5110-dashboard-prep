# Le Tour Lab — BT5110 Group 31

An educational Tour de France **2025** OLAP dashboard. The original project PDF is labelled 2026, but the supplied CSV race dates are July 2025.

**Delivery status (3 November 2026): source implementation, not a verified production build.** The authoring environment could not reach the npm registry and could not access the target GitHub repository. No live deployment, dependency lockfile, browser screenshots or successful DuckDB/Vitest run is claimed. Read `FINAL_REPORT.md` before using this in the presentation.

## Start here

Requires Node 24 (or a supported Node >=22.13), npm and registry access. No API keys, server or database service are needed.

```bash
npm install
npm test
npm run build
npx playwright install chromium
npm run screenshots
npm run dev
```

`npm install` generates the **missing** `package-lock.json`. Review it and commit it before pushing. Subsequent installations use `npm ci`. Direct dependencies are exactly pinned; transitive dependencies are not reproducibly locked until this first install succeeds. Do not invent a lockfile or bypass failing tests. If current registry metadata reveals a compatibility problem, resolve it and rerun the full checks before deployment.

`npm run dev` copies the local DuckDB workers/WASM files before starting Vite. `npm run build` runs strict TypeScript, copies those assets and creates `dist/`. `npm run preview` serves that build. Never open index.html with file://: WASM workers and CSV fetches require an HTTP origin.

## Architecture

- Vite, React, strict TypeScript and Tailwind CSS, with a custom responsive design.
- DuckDB-WASM reads the immutable CSVs, creates the star schema and computes every aggregate in SQL.
- Apache ECharts renders the charts; TanStack Table v9 renders tables. Table sorting is SQL.
- All analysis filters, table sorting, selected riders/stages, drill paths, chart legend selection, theme and demo step live in the URL hash. Reloading/copying a link restores them.
- No external runtime CDN, database server, analytics service or API key. The basemap is a bundled Natural Earth geometry file.

## Structure

- `public/data/`: original cleaned CSVs and notes, plus the empty official-reference template.
- `config/points.csv`: the four finish-line point scales; loaded directly, not encoded in UI logic.
- `sql/00_load_duckdb.sql`: DuckDB-only ingestion.
- `sql/00_load_postgres.sql`: psql staging/import recipe for an empty schema.
- `sql/01_star_schema.sql`, `sql/02_views.sql`: portable DuckDB/PostgreSQL schema and views.
- `src/queries.ts`: parameter-escaped query builders for every view; whitelist-driven pivot dimensions/measures.
- `src/state.ts`: typed hash-state parser/serializer.
- `src/db.ts`: local WASM bootstrap, SQL execution and measured query runtime.
- `src/pages.tsx`, `components.tsx`, `charts.ts`: presentation, without numeric aggregation.
- `tests/`: Vitest acceptance tests using the same SQL files in native DuckDB for Node.
- `scripts/screenshots.mjs`: browser smoke tests and nine 1920×1080 page screenshots.
- `METRICS.md`, `DEMO_SCRIPT.md`, `FINAL_REPORT.md`: definitions, presenting guide and verification status.

## GitHub Pages

The original target is `Jay-Nepal/bt5110-dashboard-prep`. Use your existing authenticated Git installation; never place a token in a file or paste credentials into a chat.

1. Copy the working files from this source repository into your checkout of that repository, **excluding this package’s `.git/` folder**. Preserve the existing repository history and other work. This package has an initialized, staged Git working tree with no commits; it is not a clone of your original history.
2. Run the start commands above. Fix any failing check. Commit the generated lockfile and screenshots.
3. In the GitHub repository: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Commit and push to `main`:

```bash
git add src sql public config scripts tests docs .github package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts postcss.config.js index.html README.md METRICS.md DEMO_SCRIPT.md FINAL_REPORT.md vercel.json netlify.toml .gitignore
git commit -m "Add Tour de France OLAP dashboard"
git push origin main
```

The workflow requires the lockfile, runs `npm ci → tests → typecheck/build → browser checks/screenshots`, then deploys. PRs verify without publishing. Report screenshots are also uploaded as an Actions artifact. A failed test blocks deployment.

The expected Pages address is `https://jay-nepal.github.io/bt5110-dashboard-prep/`. **This is the intended address, not a verified live URL.** The actual published URL appears in the successful Actions deployment.

## Base path, Vercel and Netlify

Vite defaults to `base: './'`, so the same build works at a repository subdirectory or a domain root. Routing is hash-based (`#/rider?rider=11`); no rewrite rules are needed. URLs for CSVs, map and WASM are resolved relative to Vite’s base. You can explicitly override the base if needed:

```bash
VITE_BASE=/bt5110-dashboard-prep/ npm run build
```

On Windows PowerShell, use `$env:VITE_BASE='/bt5110-dashboard-prep/'; npm run build`.

For Vercel or Netlify, import your Git repository, select Node 24, use `npm run build` and output directory `dist`. Included configuration files specify these defaults. For a manual static deployment, publish the entire `dist` directory, including `duckdb`, `data` and `world.json`. Check that the server serves `.wasm` as `application/wasm`.

## Password protection (Vercel)

`middleware.ts` puts the Vercel deployment behind a single shared password, with no username. Vercel runs it before every request, so the page, CSVs and WASM files are served only after the password is entered.

- In Vercel → Project Settings → Environment Variables, set `DASHBOARD_PASSWORD` for Production and Preview. Then redeploy, because environment variable changes only apply to new deployments.
- If the variable is missing, the deployment refuses every request (HTTP 503).
- A correct password sets a 30-day HttpOnly cookie. Changing the password signs everyone out. Visit `/__logout` to sign out manually.
- Local `npm run dev` and `npm run preview` do not run the middleware, so they stay open. GitHub Pages and Netlify ignore the file.

## Official references

`public/data/official_classifications.csv` is an empty header-only template:

```csv
classification,rank,bib_number,team_name,value,source_url
```

Use classification `points`, `kom`, `young`, `gc` or `team`; a positive integer rank; an existing rider bib or (for team rows) an exact team name; the reported value; and a source URL. Supply one row per classification and rider/team. No official data is scraped or hard-coded. Empty input displays **Official standings not loaded**. Exact-rank agreement is computed only over supplied matched proxy rows. Rebuild after changing the file.

## PostgreSQL / Task 4

In an empty PostgreSQL database or empty search path, from this repository’s root:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/00_load_postgres.sql
```

The loader imports the same CSVs and executes `01` and `02`. It is intentionally separate from the DuckDB loader. Shared views use portable window functions, middle-row medians and `ROLLUP`. The interactive terrain-shift query uses DuckDB’s `MEDIAN`; it is in application query code, not the portable views. PostgreSQL execution has not been performed in this environment.

For the Task 4 comparison, use `EXPLAIN ANALYZE` on the star query and an equivalent query joining the normalized `raw_*` tables. Measure on the team’s actual PostgreSQL instance; browser query times are not a server benchmark.

## Validation and evidence

`npm test` is the required real-DuckDB suite. It loads the actual SQL files rather than duplicating the metrics in JavaScript. `npm run screenshots` runs against a real production preview, requires no external requests or console errors, visits every page/demo step, checks responsive widths and exports, and writes report images. **Neither command has passed yet in the authoring environment.**

`python scripts/audit-data.py` is an independent CSV audit (pandas required). It passed 28 checks, including the documented half-second pivotal-day correction. It is supplemental evidence, not a substitute for the DuckDB suite. `docs/pivotal-evidence.csv` records the ten benchmark riders on the relevant days.

The cleaned CSVs remain byte-for-byte identical to the supplied bundle. See `docs/data-checksums.json`.

To reproduce the supplemental SQLite diagnostics (Node 24 and pandas): `node scripts/supplemental-queries.mjs` then `python scripts/supplemental-sqlite-smoke.py`. The script documents its syntax adaptations and ROLLUP exclusions; this is not the required DuckDB test.
