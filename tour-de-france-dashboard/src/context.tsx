import {createContext,useContext,useEffect,useState} from 'react';
import type {ViewState,ChangeState} from './state';
import {makeQuery,type QueryId,type QueryResult,type Row} from './queries';
import {runQuery} from './db';
export interface AppContextValue {state:ViewState;change:ChangeState;lookup:{riders:Row[];teams:Row[];nations:Row[];stages:Row[]}}
export const AppContext=createContext<AppContextValue|null>(null);
export function useApp(){const ctx=useContext(AppContext);if(!ctx)throw new Error('Missing dashboard context');return ctx;}
const cache=new Map<string,Promise<QueryResult>>();
export function useQuery(id:QueryId){const {state}=useApp();const query=makeQuery(id,state);const [value,setValue]=useState<{key:string;data?:QueryResult;error?:string}>({key:''});
 useEffect(()=>{let active=true;let pending=cache.get(query.sql);if(!pending){pending=runQuery(query);cache.set(query.sql,pending);pending.catch(()=>cache.delete(query.sql));}pending.then(data=>{if(active)setValue({key:query.sql,data});}).catch(e=>{if(active)setValue({key:query.sql,error:String(e)});});return()=>{active=false;};},[query.sql]);
 return value.key===query.sql?value:{key:query.sql};
}
