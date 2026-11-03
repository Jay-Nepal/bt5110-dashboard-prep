import * as duckdb from '@duckdb/duckdb-wasm';
import loadSQL from '../sql/00_load_duckdb.sql?raw';
import schemaSQL from '../sql/01_star_schema.sql?raw';
import viewsSQL from '../sql/02_views.sql?raw';
import pointScale from '../config/points.csv?raw';
import {tableNames,type QuerySpec,type QueryResult,type Row,type Cell} from './queries';
let connection:Promise<duckdb.AsyncDuckDBConnection>|undefined;
export function database():Promise<duckdb.AsyncDuckDBConnection> {
 if(connection)return connection;
 connection=(async()=>{
  const root=new URL(import.meta.env.BASE_URL,document.baseURI);
  const asset=(file:string)=>new URL(file,root).href;
  const bundle=await duckdb.selectBundle({mvp:{mainModule:asset('duckdb/duckdb-mvp.wasm'),mainWorker:asset('duckdb/duckdb-browser-mvp.worker.js')},eh:{mainModule:asset('duckdb/duckdb-eh.wasm'),mainWorker:asset('duckdb/duckdb-browser-eh.worker.js')}});
  if(!bundle.mainWorker)throw new Error('No compatible DuckDB worker was found.');
  const worker=new Worker(bundle.mainWorker);
  const db=new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING),worker);
  await db.instantiate(bundle.mainModule,bundle.pthreadWorker);
  // Register local bytes, so querying never reaches a CDN or external database.
  for(const name of [...tableNames,'official_classifications']) {
   const response=await fetch(asset(`data/${name}.csv`));
   if(!response.ok)throw new Error(`Could not load ${name}.csv (${response.status}). Check the deployment base path.`);
   await db.registerFileText(name+'.csv',await response.text());
  }
  await db.registerFileText('points.csv',pointScale);
  const conn=await db.connect();
  await conn.query(loadSQL);await conn.query(schemaSQL);await conn.query(viewsSQL);
  const invalid=await conn.query("SELECT COUNT(*) AS n FROM official_classifications WHERE classification NOT IN ('points','kom','young','gc','team') OR rank IS NULL OR rank<1 OR source_url IS NULL OR source_url='' OR (classification='team' AND team_name IS NULL) OR (classification<>'team' AND bib_number IS NULL)");
  if(Number(invalid.toArray()[0]?.n)>0)throw new Error('Invalid official standings: check classification, positive rank, rider/team key and source_url.');
  const references=await conn.query(`SELECT COUNT(*) AS n FROM official_classifications o WHERE
   (classification='team' AND NOT EXISTS(SELECT 1 FROM dim_team t WHERE t.team_name=o.team_name)) OR
   (classification<>'team' AND NOT EXISTS(SELECT 1 FROM dim_rider r WHERE r.bib_number=o.bib_number))`);
  const duplicates=await conn.query(`SELECT COUNT(*) AS n FROM (SELECT classification,CASE WHEN classification='team' THEN team_name ELSE CAST(bib_number AS VARCHAR) END AS participant FROM official_classifications GROUP BY classification,CASE WHEN classification='team' THEN team_name ELSE CAST(bib_number AS VARCHAR) END HAVING COUNT(*)>1) d`);
  if(Number(references.toArray()[0]?.n)>0||Number(duplicates.toArray()[0]?.n)>0)throw new Error('Official standings contain unknown or duplicate rider/team keys.');
  return conn;
 })();
 return connection;
}
function normalize(v:unknown):Cell {if(v===undefined||v===null)return null;if(typeof v==='bigint')return Number(v);if(typeof v==='string'||typeof v==='number'||typeof v==='boolean')return v;return String(v);}
export async function runQuery(q:QuerySpec):Promise<QueryResult> {
 const conn=await database(); const start=performance.now();const result=await conn.query(q.sql);const ms=performance.now()-start;
 const rows=result.toArray().map(item=>Object.fromEntries(Object.entries(item.toJSON()).map(([k,v])=>[k,normalize(v)])) as Row);
 return {rows,sql:q.sql,ms,operation:q.operation,note:q.note};
}
export async function lookups():Promise<{riders:Row[];teams:Row[];nations:Row[];stages:Row[]}> {
 const [riders,teams,nations,stages]=await Promise.all([
  runQuery({id:'riders',sql:'SELECT bib_number,rider_name FROM dim_rider ORDER BY rider_name',operation:'slice',note:''}),
  runQuery({id:'teams',sql:'SELECT team_name FROM dim_team ORDER BY team_name',operation:'slice',note:''}),
  runQuery({id:'nations',sql:'SELECT country_code,display_name FROM dim_country ORDER BY display_name',operation:'slice',note:''}),
  runQuery({id:'stages',sql:"SELECT stage_id,'Stage '||stage_id||' · '||start_location||' → '||finish_location AS label FROM dim_stage ORDER BY stage_id",operation:'slice',note:''})]);
 return {riders:riders.rows,teams:teams.rows,nations:nations.rows,stages:stages.rows};
}
