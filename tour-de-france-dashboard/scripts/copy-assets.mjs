import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('public/duckdb',{recursive:true});
for(const file of ['duckdb-mvp.wasm','duckdb-eh.wasm','duckdb-browser-mvp.worker.js','duckdb-browser-eh.worker.js']) {
 await copyFile(`node_modules/@duckdb/duckdb-wasm/dist/${file}`,`public/duckdb/${file}`);
}
await copyFile('config/points.csv','public/data/points.csv');
console.log('Local DuckDB WASM assets and points configuration copied.');
