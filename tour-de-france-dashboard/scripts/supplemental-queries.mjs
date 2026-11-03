// Supplemental diagnostics only. This does not replace the real DuckDB tests.
import {writeFile} from 'node:fs/promises';
import {defaults} from '../src/state.ts';
import {makeQuery,queryIds} from '../src/queries.ts';
const cases=[defaults,{...defaults,nation:'FRA',from:5,to:13,types:['mountain']},{...defaults,search:"O'Neil_50%",team:"a'b"},{...defaults,teamRule:'final',young:'calendar',noBonus:true,noPenalty:true,to:4}];
await writeFile('docs/qa-queries.json',JSON.stringify(cases.flatMap((state,i)=>queryIds.map(id=>({case:i,...makeQuery(id,state)})))));
