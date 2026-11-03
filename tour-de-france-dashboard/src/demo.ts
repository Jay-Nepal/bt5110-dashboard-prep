import {defaults,toHash,type ViewState} from './state';
export interface DemoStep {id:string;title:string;caption:string;state:Partial<ViewState>}
export const demoSteps:DemoStep[]=[
 {id:'E1',title:'A pivotal day',caption:'Pogacar’s Stage 12 time was 206.5 seconds faster than the final top-ten median. Follow the stage trace to explain the difference.',state:{page:'rider',rider:1}},
 {id:'E2',title:'A stage in focus',caption:'Explore Stage 8. Jonathan Milan crossed first, but his penalty gave Wout Van Aert the lowest adjusted time.',state:{page:'stages',stage:8}},
 {id:'E3',title:'Team contribution',caption:'The team award counts the three fastest riders each day. The workload roll-up is shown separately; drill from team to rider to stage.',state:{page:'teams',team:'TEAM VISMA | LEASE A BIKE'}},
 {id:'E4',title:'Parallel classifications',caption:'Compare GC, Young Rider and the two clearly labelled proxies. A different rank reflects a different objective.',state:{page:'classifications'}},
 {id:'E5',title:'Mountain contours',caption:'Compare the selected rider’s mountain podiums with their mean gap to each stage winner.',state:{page:'rider',rider:11,types:['mountain']}},
 {id:'E6',title:'When the terrain changes',caption:'Speed is summed distance divided by summed time. Terrain indices compare performance against finisher benchmarks.',state:{page:'teams'}},
 {id:'E7',title:'Replay the race',caption:'Removing both adjustments gives 0 final position changes. Move the end-stage control to 1–4 to see a different leader.',state:{page:'classifications',noBonus:true,noPenalty:true}},
 {id:'E8',title:'Who is represented?',caption:'France has 38 riders but five teams. Switch the nationality basis, then drill into the country’s riders.',state:{page:'nations'}},
 {id:'E9',title:'National outcomes',caption:'Inspect French wins, podiums and best final GC rank, then follow the supporting rider and stage links.',state:{page:'nations',nation:'FRA'}},
 {id:'E10',title:'The GC storyline',caption:'Read gaps to the daily leader. Mountain shading connects the changes to the race terrain.',state:{page:'overview'}},
 {id:'E11',title:'Against the clock',caption:'The ITT catalogue contains Stage 5 in Caen and Stage 13 to Peyragudes, with distances and winners.',state:{page:'stages',types:['individual time-trial'],stage:5}},
 {id:'E12',title:'Consistency near the front',caption:'Pogacar finished in the top ten on 13 stages. Inspect the list and terrain of those finishes.',state:{page:'rider',rider:1}},
 {id:'E13',title:'Squad depth',caption:'All squads registered eight riders. Finishers, riders with results and nationality counts reveal meaningful differences.',state:{page:'teams'}},
 {id:'E14',title:'Top-ten intensity',caption:'Click a team–terrain heatmap cell to see the riders and stages behind its count.',state:{page:'teams'}},
 {id:'E15',title:'The long day',caption:'Stage 2 is the longest at 209.1 km. Its route and leading finishers sit beside the stage catalogue.',state:{page:'stages',stage:2}},
 {id:'X1',title:'Demo controls',caption:'Use this menu to jump to any scenario in one click, or use the left and right arrow keys. Escape leaves the tour.',state:{page:'overview'}},
 {id:'X2',title:'Show the SQL',caption:'Every chart and table exposes its executed SQL, measured query time and OLAP operation.',state:{page:'pivot',sql:'pivot'}},
 {id:'X3',title:'Share the view',caption:'Copy link includes every filter, selected rider, drill and demo step. Open it in a new tab to reproduce this view.',state:{page:'rider',rider:11,types:['mountain']}},
 {id:'X4',title:'Head to head',caption:'Compare any two riders on common stages. Time deltas and crossing-line win/loss counts answer different questions.',state:{page:'head-to-head',rider:1,compare:11}},
 {id:'X5',title:'Export the evidence',caption:'Use CSV on a table and PNG on a chart. Exports represent the current filtered query.',state:{page:'nations'}},
 {id:'X6',title:'Theme and accessibility',caption:'Try the dark theme. Terrain labels and symbols preserve meaning without relying on colour.',state:{page:'overview',theme:'dark'}}
];
export function demoHash(index:number,theme:ViewState['theme']){const i=Math.min(demoSteps.length-1,Math.max(0,index));return toHash({...defaults,theme,...demoSteps[i].state,demo:i});}
