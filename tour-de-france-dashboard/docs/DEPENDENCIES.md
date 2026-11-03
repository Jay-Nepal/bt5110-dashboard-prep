# Dependency choices

Direct dependencies are exact pins in package.json. Stable package metadata was checked on 3 November 2026 against publisher package pages. DuckDB-WASM uses the stable v1.33.0 release, not the npm `latest` tag pointing to a `-dev` build. Runtime dependencies are never loaded from a CDN.

- React: https://www.npmjs.com/package/react
- Vite: https://www.npmjs.com/package/vite
- React plugin: https://www.npmjs.com/package/@vitejs/plugin-react
- TypeScript: https://www.npmjs.com/package/typescript
- Tailwind: https://www.npmjs.com/package/tailwindcss
- DuckDB-WASM stable releases: https://github.com/duckdb/duckdb-wasm/releases
- DuckDB Node: https://www.npmjs.com/package/@duckdb/node-api
- ECharts: https://www.npmjs.com/package/echarts
- TanStack Table: https://www.npmjs.com/package/@tanstack/react-table
- Vitest: https://www.npmjs.com/package/vitest
- Playwright: https://www.npmjs.com/package/playwright

The React/Node declaration packages are pinned to versions present in the local type cache; these support the used APIs but are not claimed to be the latest declaration releases. Package metadata does not establish mutual compatibility. The first real install, typecheck, test and production build remain mandatory. A lockfile could not be generated because registry metadata retrieval returns 403. No transitive resolutions or integrity hashes were fabricated.

The supplemental local TypeScript check used the available 6.0.3 compiler. The application manifest targets the separately pinned current compiler; a full run of that exact compiler remains pending.
