import {DuckDBInstance} from '@duckdb/node-api';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
export async function createTestDatabase(){
 const instance=await DuckDBInstance.create(':memory:');const conn=await instance.connect();
 let loader=await readFile('sql/00_load_duckdb.sql','utf8');
 for(const file of ['country','team','rider','location','stage','result','exit','official_classifications','points']){
  const path=resolve(file==='points'?'config/points.csv':`public/data/${file}.csv`).replaceAll("'","''");
  loader=loader.replaceAll(`'${file}.csv'`,`'${path}'`);
 }
 await conn.run(loader);await conn.run(await readFile('sql/01_star_schema.sql','utf8'));await conn.run(await readFile('sql/02_views.sql','utf8'));
 async function rows(sql:string){const reader=await conn.runAndReadAll(sql);return reader.getRowObjectsJson().map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,typeof v==='string'&&/^-?\d+(\.\d+)?$/.test(v)?Number(v):v])));}
 return {rows,conn,instance};
}
