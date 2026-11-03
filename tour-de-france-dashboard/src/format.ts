import type {Cell} from './queries';
export function time(v:Cell|undefined):string {if(v==null)return '—';const n=Number(v);const a=Math.abs(n),h=Math.floor(a/3600),m=Math.floor(a%3600/60),sec=a%60;return `${n<0?'−':''}${h}:${String(m).padStart(2,'0')}:${(Number.isInteger(sec)?String(sec):sec.toFixed(1)).padStart(2,'0')}`;}
export function gap(v:Cell|undefined):string {if(v==null)return '—';const n=Number(v),a=Math.abs(n),sec=Math.round(a%60*10)/10;return `${n<0?'−':'+'}${Math.floor(a/60)}:${(Number.isInteger(sec)?String(sec):sec.toFixed(1)).padStart(2,'0')}`;}
export function num(v:Cell|undefined,d=0):string {return v==null?'—':Number(v).toLocaleString('en-GB',{minimumFractionDigits:d,maximumFractionDigits:d});}
export const terrainColors:Record<string,string>={'flat':'#0072b2','hilly':'#b56700','mountain':'#a54d97','individual time-trial':'#00856a'};
export const terrainLabel=(s:string)=>s==='individual time-trial'?'ITT':s.charAt(0).toUpperCase()+s.slice(1);
export const labels:Record<string,string>={bib_number:'Bib',gc_rank:'GC rank',tie_count:'Tie size',rider_name:'Rider',team_name:'Team',rider_country:'Rider nation',team_country:'Team nation',total_time:'Cumulative time',gap:'Gap',rank:'Rank',stage_id:'Stage',distance_km:'Distance (km)',points:'Points (finish-line proxy) score',points_rank:'Points (finish-line proxy) rank',kom_rank:'KOM (mountain-stage proxy)',young_rank:'Young rank',gap_to_winner:'Stage gap',finish_time:'Finish time',time_bonus:'Bonus (s)',time_penalty:'Penalty (s)',adjusted_time:'Adjusted time',type:'Stage type',top10:'Top 10',counted_team_time:'Counted team time',workload_time:'Workload time',terrain_index:'Terrain index',speed:'Speed (km/h)',mean_gap:'Mean stage gap',delta:'Delta to benchmark',baseline_rank:'Baseline rank',counter_rank:'Replayed rank',counter_time:'Replayed time',position_changes:'Position changes',country_code:'Nation',display_name:'Country',official_rank:'Official rank',value:'Value',rider_stages:'Rider × stages'};
export const timeColumns=new Set(['total_time','finish_time','adjusted_time','counter_time','baseline_time','mountain_time','workload_time','counted_team_time','median_time']);
export const gapColumns=new Set(['gap','gap_to_winner','mean_gap','delta','stage_delta','cumulative_delta']);
export function formatCell(key:string,v:Cell|undefined):string {
 if(v==null)return '—';if(timeColumns.has(key))return time(v);if(gapColumns.has(key))return gap(v);
 if(key==='type')return terrainLabel(String(v));if(typeof v==='boolean')return v?'Yes':'No';
 if(typeof v==='number')return num(v,key==='distance_km'?1:(/speed|index|gain|percent|mean_rank/.test(key))?2:0);
 return String(v);
}
