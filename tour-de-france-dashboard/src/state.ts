export const pages = ['overview','stages','rider','teams','classifications','nations','pivot','about','head-to-head'] as const;
export type Page = typeof pages[number];
export const terrains = ['flat','hilly','mountain','individual time-trial'] as const;
export type Terrain = typeof terrains[number];
export const dimensions = ['nation','team','rider','type','stage'] as const;
export type Dimension = typeof dimensions[number];
export const measures = ['adjusted_time','mean_rank','top10','wins','podiums','speed'] as const;
export type Measure = typeof measures[number];
export interface ViewState {
 page: Page; from: number; to: number; types: Terrain[]; team: string; nation: string; search: string;
 rider: number; stage: number; compare: number; selected: number[]; young: 'start'|'calendar';
 teamRule: 'stage'|'final'; nationMode: 'riders'|'teams'; noBonus: boolean; noPenalty: boolean;
 dims: Dimension[]; measure: Measure; demo: number; theme: 'light'|'dark'; sql: string;
 sort: string; descending: boolean; legends: string;
}
export const defaults: ViewState = {page:'overview',from:1,to:21,types:[],team:'',nation:'',search:'',rider:1,stage:12,compare:11,selected:[],young:'start',teamRule:'stage',nationMode:'riders',noBonus:false,noPenalty:false,dims:['nation','team'],measure:'adjusted_time',demo:-1,theme:'light',sql:'',sort:'',descending:false,legends:''};
const number=(v:string|null,d:number,min:number,max:number)=>{const n=Number(v);return v!==null&&Number.isFinite(n)?Math.min(max,Math.max(min,Math.trunc(n))):d;};
export function parseState(hash:string):ViewState {
 const [path,search='']=hash.replace(/^#\/?/,'').split('?'); const p=new URLSearchParams(search);
 const from=number(p.get('from'),1,1,21), to=Math.max(from,number(p.get('to'),21,1,21));
 const dims=Array.from(new Set((p.get('dims')||'nation,team').split(',').filter((x):x is Dimension=>dimensions.includes(x as Dimension)))).slice(0,5);
 return {...defaults,page:pages.includes(path as Page)?path as Page:'overview',from,to,
 types:(p.get('types')||'').split(',').filter((x):x is Terrain=>terrains.includes(x as Terrain)),team:p.get('team')||'',nation:p.get('nation')||'',search:p.get('search')||'',
 rider:number(p.get('rider'),1,1,9999),stage:number(p.get('stage'),12,1,21),compare:number(p.get('compare'),11,1,9999),
 selected:(p.get('selected')||'').split(',').filter(x=>/^\d+$/.test(x)).map(Number).filter(n=>Number.isSafeInteger(n)&&n>=1&&n<=9999).slice(0,10),
 young:p.get('young')==='calendar'?'calendar':'start',teamRule:p.get('teamRule')==='final'?'final':'stage',nationMode:p.get('nationMode')==='teams'?'teams':'riders',
 noBonus:p.get('noBonus')==='true',noPenalty:p.get('noPenalty')==='true',dims:dims.length?dims:['nation'],measure:measures.includes(p.get('measure') as Measure)?p.get('measure') as Measure:'adjusted_time',
 demo:number(p.get('demo'),-1,-1,30),theme:p.get('theme')==='dark'?'dark':'light',sql:p.get('sql')||'',sort:p.get('sort')||'',descending:p.get('descending')==='true',legends:p.get('legends')||''};
}
export function toHash(s:ViewState):string {
 const p=new URLSearchParams();
 for(const key of Object.keys(s) as (keyof ViewState)[]) {
  if(key==='page'||JSON.stringify(s[key])===JSON.stringify(defaults[key]))continue;
  p.set(key,Array.isArray(s[key])?(s[key] as (string|number)[]).join(','):String(s[key]));
 }
 return `#/${s.page}${p.size?'?'+p.toString():''}`;
}
export type ChangeState=(patch:Partial<ViewState>,reset?:boolean)=>void;
