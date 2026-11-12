// Read-only adapter. Ledger bars take priority over reconstruction cache revisions.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as F from '../historical-reconstruction/frozen.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
export const requiredSymbols=[...new Set(['SPY','RSP',...Object.values(F.sectorSymbols).flat()])];
export function validateStoredBars(rows){
 if(!Array.isArray(rows))throw Error('Stored OHLC must be an array.');
 const dates=new Set();
 for(const b of rows){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||dates.has(b.date)||['open','high','low','close'].some(k=>!Number.isFinite(b[k])||b[k]<=0)||b.low>Math.min(b.open,b.close)||b.high<Math.max(b.open,b.close))throw Error('Invalid or duplicate stored OHLC.');
  dates.add(b.date);
 }
 return [...rows].sort((a,b)=>a.date.localeCompare(b.date));
}
function checkSplits(rows){
 if(!Array.isArray(rows))throw Error('Missing stored split history.');
 const dates=new Set();
 for(const s of rows){const ratio=String(s.split).split('/').map(Number);if(!/^\d{4}-\d{2}-\d{2}$/.test(s.date)||dates.has(s.date)||ratio.length!==2||ratio.some(n=>!Number.isFinite(n)||n<=0))throw Error('Invalid stored split history.');dates.add(s.date);}
 return rows;
}
export function loadStoredData({cacheDir=path.join(root,'../historical-reconstruction/cache'),ledger=null,collected=null}={}){
 const data={},sources=[];
 const ensure=s=>data[s]??={by:new Map(),actions:new Map(),splitThrough:null};
 if(fs.existsSync(cacheDir))for(const name of fs.readdirSync(cacheDir).sort()){
  if(!/^(eod|splits)-.*\.json$/.test(name))continue;
  const item=JSON.parse(fs.readFileSync(path.join(cacheDir,name),'utf8'));
  if(!requiredSymbols.includes(item.symbol))continue;
  if(!['eod','splits'].includes(item.endpoint)||item.eodhdSymbol!==`${item.symbol}.US`||!/^\d{4}-\d{2}-\d{2}$/.test(item.from)||!/^\d{4}-\d{2}-\d{2}$/.test(item.to)||item.from>item.to)throw Error('Invalid stored source metadata.');
  const target=ensure(item.symbol),rows=item.endpoint==='eod'?validateStoredBars(item.rows):checkSplits(item.rows);
  if(rows.some(b=>b.date<item.from||b.date>item.to))throw Error('Stored rows exceed declared coverage.');
  for(const row of rows){const map=item.endpoint==='eod'?target.by:target.actions,old=map.get(row.date);if(old&&(item.endpoint==='eod'?['open','high','low','close'].some(k=>old[k]!==row[k]):old.split!==row.split))throw Error('Conflicting stored source revisions require review.');map.set(row.date,row);}
  if(item.endpoint==='splits')target.splitThrough=target.splitThrough>item.to?target.splitThrough:item.to;
  sources.push(name);
 }
 if(collected){
  if(collected.version!==1||collected.adjust!=='none'||!/^\d{4}-\d{2}-\d{2}$/.test(collected.through)||requiredSymbols.some(s=>!collected.data?.[s]))throw Error('Invalid collected dataset.');
  for(const s of requiredSymbols){
   const item=collected.data[s],target=ensure(s);
   if(item.splitThrough!==collected.through)throw Error('Incomplete collected split coverage.');
   for(const b of validateStoredBars(item.rows)){if(b.date>collected.through)throw Error('Future collected candle.');target.by.set(b.date,b);}
   for(const a of checkSplits(item.splits)){
    const old=target.actions.get(a.date),r=x=>{const [n,d]=x.split.split('/').map(Number);return n/d;};
    if(old&&Math.abs(r(old)/r(a)-1)>1e-10)throw Error('Stored split revision needs review.');
    if(!old)target.actions.set(a.date,a);
   }
   target.splitThrough=collected.through;
  }
 }
 if(ledger)for(const s of requiredSymbols){
  if(!ledger.rawBars?.[s])continue;
  const target=ensure(s);
  for(const b of validateStoredBars(Object.values(ledger.rawBars[s])))target.by.set(b.date,b);
  for(const a of checkSplits(ledger.splits?.[s])){const old=target.actions.get(a.date);if(old){const ratio=x=>{const [n,d]=x.split.split('/').map(Number);return n/d;};if(Math.abs(ratio(old)/ratio(a)-1)>1e-10)throw Error('Stored split revision needs review.');}target.actions.set(a.date,a);}
  target.splitThrough=target.splitThrough>ledger.lastSession?target.splitThrough:ledger.lastSession;
 }
 return {sources,data:Object.fromEntries(Object.entries(data).map(([s,x])=>[s,{rows:[...x.by.values()].sort((a,b)=>a.date.localeCompare(b.date)),splits:[...x.actions.values()].sort((a,b)=>a.date.localeCompare(b.date)),splitThrough:x.splitThrough}]))};
}
export function auditStoredData(store){
 const calendar=store.data.SPY?.rows.map(b=>b.date)??[];
 const missingSymbols=requiredSymbols.filter(s=>!store.data[s]?.rows.length||!store.data[s]?.splitThrough);
 const dates=Object.fromEntries(requiredSymbols.map(s=>[s,new Set(store.data[s]?.rows.map(b=>b.date))]));
 const usable=calendar.filter((d,i)=>i>=54&&requiredSymbols.every(s=>store.data[s]?.splitThrough>=d&&calendar.slice(i-54,i+1).every(day=>dates[s].has(day))));
 return {requiredSymbols:requiredSymbols.length,availableSymbols:requiredSymbols.length-missingSymbols.length,missingSymbols,firstSession:calendar[0]??null,lastSession:calendar.at(-1)??null,spySessions:calendar.length,usableSignalSessions:usable.length,firstUsableSignal:usable[0]??null,lastUsableSignal:usable.at(-1)??null,coverage:requiredSymbols.map(s=>({symbol:s,rows:dates[s].size,first:store.data[s]?.rows[0]?.date??null,last:store.data[s]?.rows.at(-1)?.date??null,splitThrough:store.data[s]?.splitThrough??null}))};
}
export function storedReader(store,from,to){
 return async(endpoint,symbol,latest=null)=>{
  const item=store.data[symbol];
  if(!item)throw Error(`${symbol}: missing stored data`);
  if(!item.splitThrough||item.splitThrough<to)throw Error(`${symbol}: stored split coverage does not reach requested date`);
  const rows=(endpoint==='eod'?item.rows:item.splits).filter(b=>b.date>=from&&b.date<=to);
  if(endpoint==='eod'&&(!rows.length||(latest&&rows.at(-1).date!==latest)))throw Error(`${symbol}: incomplete stored daily coverage`);
  return rows;
 };
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const ledgerFile=path.join(root,'journal/ledger.json');
  const ledger=fs.existsSync(ledgerFile)?JSON.parse(fs.readFileSync(ledgerFile,'utf8')):null;
  const collectedFile=path.join(root,'journal/market-data.json');
  const collected=fs.existsSync(collectedFile)?JSON.parse(fs.readFileSync(collectedFile,'utf8')):null;
  const store=loadStoredData({cacheDir:process.env.MTR_DATA_DIR,ledger,collected});
  console.log(JSON.stringify(auditStoredData(store),null,2));
 }catch(e){console.error(e.message);process.exitCode=1;}
}
