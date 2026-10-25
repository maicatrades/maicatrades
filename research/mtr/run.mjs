import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {pendingSessions} from './schedule.mjs';
import * as F from '../historical-reconstruction/frozen.mjs';
import {signal,startTrade,advance,metrics,simulateAccount,entryWindowOpen,RULES,ACCOUNT} from './engine.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)), project=path.resolve(root,'../..');
// Read only named credentials, never print values or URLs containing tokens.
if(fs.existsSync(path.join(project,'.env.local')))for(const line of fs.readFileSync(path.join(project,'.env.local'),'utf8').split(/\r?\n/)){const m=line.match(/^(EODHD_API_TOKEN|NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SECRET_KEY)=(.*)$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].trim().replace(/^(['"])(.*)\1$/,'$2');}
const members=Object.values(F.sectorSymbols).flat(), dir=path.join(root,'journal'), file=path.join(dir,'ledger.json'), lock=path.join(dir,'run.lock');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const engineHash=sha(fs.readFileSync(path.join(root,'engine.mjs'))),breadthHash=sha(fs.readFileSync(path.join(root,'../historical-reconstruction/frozen.mjs')));
const current=()=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',weekday:'short'}).formatToParts(new Date()).map(x=>[x.type,x.value]));return {date:`${p.year}-${p.month}-${p.day}`,hour:Number(p.hour),minute:Number(p.minute),weekday:p.weekday};};
async function fetchRows(endpoint,symbol,from,to){
 const url=new URL(`https://eodhd.com/api/${endpoint}/${symbol}.US`);url.search=new URLSearchParams({api_token:process.env.EODHD_API_TOKEN,from,to,fmt:'json',period:'d',order:'a'});
 const response=await fetch(url,{signal:AbortSignal.timeout(30000),redirect:'error'});if(!response.ok)throw Error(`${symbol} ${endpoint}: HTTP ${response.status}`);const rows=await response.json();if(!Array.isArray(rows))throw Error(`${symbol}: invalid response`);return rows;
}
function validate(rows){const dates=new Set();for(const b of rows){if(!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||dates.has(b.date)||['open','high','low','close'].some(k=>!Number.isFinite(b[k])||b[k]<=0)||b.low>Math.min(b.open,b.close)||b.high<Math.max(b.open,b.close))throw Error('Invalid or duplicate OHLC');dates.add(b.date);}return rows.sort((a,b)=>a.date.localeCompare(b.date));}
function splitFactor(splits,after,through){return splits.filter(s=>s.date>after&&s.date<=through).reduce((n,s)=>{const [a,b]=String(s.split).split('/').map(Number);if(!(a>0&&b>0))throw Error('Invalid split ratio');return n*a/b;},1);}
function normalized(rows,splits,date){return rows.filter(b=>b.date<=date).map(b=>{const factor=splitFactor(splits,b.date,date);return {...b,open:b.open/factor,high:b.high/factor,low:b.low/factor,close:b.close/factor};});}
// Download staging is separate from the frozen research ledger. No credentials are cached.
function scanThrough(now) {
 const day=new Date(`${now.date}T12:00:00Z`);
 if(now.hour<22)day.setUTCDate(day.getUTCDate()-1);
 while([0,6].includes(day.getUTCDay()))day.setUTCDate(day.getUTCDate()-1);
 return day.toISOString().slice(0,10);
}
function downloadCache(from,to) {
 const cacheFile=path.join(dir,'download-cache.json');
 let cache={version:1,from,to,entries:{}};
 if(fs.existsSync(cacheFile)){
  const saved=JSON.parse(fs.readFileSync(cacheFile,'utf8'));
  if(saved.version===1&&saved.from===from&&saved.to===to&&saved.entries&&typeof saved.entries==='object')cache=saved;
 }
 const save=()=>{fs.writeFileSync(cacheFile+'.tmp',JSON.stringify(cache));fs.renameSync(cacheFile+'.tmp',cacheFile);};
 return async(endpoint,symbol,latest=null)=>{
  const key=`${endpoint}:${symbol}`;
  const check=rows=>{
   if(!Array.isArray(rows))throw Error('Invalid download cache.');
   if(endpoint==='eod'){
    validate(rows);
    if(!rows.length||rows.some(b=>b.date<from||b.date>to))throw Error(`${symbol}: invalid daily coverage`);
    if(latest&&rows.at(-1).date!==latest)throw Error(`${symbol}: incomplete latest-session coverage`);
   }else for(const action of rows){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(action.date))throw Error('Invalid split date');
    splitFactor([action],'0000-00-00','9999-99-99');
   }
   return rows;
  };
  // Re-probe SPY if the provider had not supplied the requested completed date.
  if(Object.hasOwn(cache.entries,key)){
   try {
    const rows=check(cache.entries[key]);
    if(!(endpoint==='eod'&&symbol==='SPY'&&rows.at(-1).date<to))return rows;
   } catch { delete cache.entries[key]; } // Re-fetch incomplete or invalid staging data.
  }
  const rows=await fetchRows(endpoint,symbol,from,to);
  check(rows);
  cache.entries[key]=rows;save();
  return rows;
 };
}
async function main(){
 if(process.argv[2]==='publish'){
  if(!fs.existsSync(file))throw Error('Run scan first.');const payload=JSON.parse(fs.readFileSync(file,'utf8'));
  if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.SUPABASE_SECRET_KEY)throw Error('Supabase credentials missing.');
  // Raw prices and source archives never reach the Pro view.
  const {rawBars,splits,...view}=payload;void rawBars;void splits;
  const response=await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/mtr_research_log?on_conflict=id`,{method:'POST',headers:{apikey:process.env.SUPABASE_SECRET_KEY,...(process.env.SUPABASE_SECRET_KEY.startsWith('sb_secret_')?{}:{Authorization:`Bearer ${process.env.SUPABASE_SECRET_KEY}`}),'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},body:JSON.stringify({id:'MTR-1',payload:view,updated_at:new Date().toISOString()})});
  if(!response.ok)throw Error(`Pro publication failed: HTTP ${response.status}. Apply schema.sql first.`);console.log('Published the saved MTR journal to private Pro.');return;
 }
 if(process.argv[2]!=='scan'){console.log('Usage: node research/mtr/run.mjs scan | publish');return;}
 if(!process.env.EODHD_API_TOKEN)throw Error('Set EODHD_API_TOKEN in the environment or .env.local.');
 fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(lock); // Exclusive writer; second run fails safely.
 try{
  const ledger=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{ruleVersion:RULES.version,rules:RULES,accountAssumptions:ACCOUNT,engineHash,breadthHash,signals:[],observations:[],rawBars:{},splits:{}};
  if(ledger.engineHash!==engineHash||ledger.breadthHash!==breadthHash)throw Error('Frozen formulas changed. Start a new research version.');
  const now=current(),to=scanThrough(now);
  if(ledger.lastSession&&ledger.lastSession===to){console.log(`MTR ${to}: already frozen; journal unchanged. No provider requests.`);return;}
  const from=new Date(Math.min(Date.parse(to)-220*86400000,ledger.lastSession?Date.parse(ledger.lastSession)-100*86400000:Infinity)).toISOString().slice(0,10);
  const cached=downloadCache(from,to),data={};
  const spyRows=await cached('eod','SPY');
  const completed=spyRows.map(b=>b.date),latest=completed.at(-1);
  if(!latest||completed.length<60||Date.now()-Date.parse(latest)>5*86400000)throw Error('Missing or stale completed daily data.');
  const pending=pendingSessions(completed,ledger);
  if(!pending.length){console.log(`MTR ${latest}: already frozen; journal unchanged.`);return;}
  for(const s of [...new Set(['SPY','RSP',...members])]){
   const rows=s==='SPY'?spyRows:await cached('eod',s,latest),splits=await cached('splits',s);
   data[s]={rows,splits};await new Promise(r=>setTimeout(r,250));
  }
  for(const date of pending){
  const calendar=completed.filter(d=>d<=date);
  if(!date||calendar.length<60)throw Error('Missing or stale completed daily data.');

  const six=calendar.slice(-6),breadth={};
  for(const d of six){
   const expected=calendar.filter(x=>x<=d).slice(-50),series={};
   for(const s of ['SPY','RSP',...members]){const by=new Map(normalized(data[s].rows,data[s].splits,d).map(b=>[b.date,b]));if(expected.some(x=>!by.has(x)))throw Error(`${s}: incomplete 50-session coverage`);series[s]=expected.map(x=>by.get(x).close);}
   const pct=n=>n/122*100, advancingPercent=pct(members.filter(s=>F.getReturn(series[s],1)>0).length),above20Percent=pct(members.filter(s=>series[s].at(-1)>F.simpleMovingAverage(series[s],20)).length),above50Percent=pct(members.filter(s=>series[s].at(-1)>F.simpleMovingAverage(series[s],50)).length);
   const positiveSectorPercent=Object.values(F.sectorSymbols).filter(group=>F.round(group.filter(s=>F.getReturn(series[s],1)>0).length/group.length*100)>50).length/Object.keys(F.sectorSymbols).length*100;
   breadth[d]=F.round(F.calculateBreadthScore({advancingPercent,above20Percent,above50Percent,positiveSectorPercent,rspRelativePerformance:F.round(F.getReturn(series.RSP,1)-F.getReturn(series.SPY,1))}));
  }
  // Every decision input is saved before any next-session outcome is processed.
  const capturedAt=new Date().toISOString(),eligible=entryWindowOpen(date,now);
  const candidates=members.map(s=>signal(s,normalized(data[s].rows,data[s].splits,date),calendar,breadth)).filter(Boolean);
  if(eligible)for(const s of candidates)ledger.signals.push({...s,capturedAt,source:'EODHD completed daily / frozen breadth',inputHash:sha(JSON.stringify({bars:data[s],breadth,calendar:calendar.slice(-22)}))});
  ledger.observations.push({date,capturedAt,breadth,coverage:122,candidateCount:candidates.length,loggedCount:eligible?candidates.length:0,status:eligible?'forward':'missed_entry_window',recoveredCandidates:eligible?[]:candidates,sourceHash:sha(JSON.stringify(data))});
  const archive=path.join(dir,`${date}.json`);
  // Freeze first-observed raw bars; a provider revision never silently overwrites them.
  for(const s of ['SPY','RSP',...members]){ledger.rawBars[s]??={};for(const b of data[s].rows.filter(b=>b.date<=date))ledger.rawBars[s][b.date]??=b;const known=new Map((ledger.splits[s]??[]).map(a=>[a.date,a]));for(const a of data[s].splits){if(known.has(a.date)&&known.get(a.date).split!==a.split)throw Error(`${s}: split revision needs review`);known.set(a.date,a);}ledger.splits[s]=[...known.values()];}
  const savedCalendar=Object.keys(ledger.rawBars.SPY).sort(),prices=Object.fromEntries(members.map(s=>[s,normalized(Object.values(ledger.rawBars[s]).sort((a,b)=>a.date.localeCompare(b.date)),ledger.splits[s],date)]));
  const pairs=[],basisSignals=ledger.signals.map(s=>{const f=splitFactor(ledger.splits[s.symbol],s.signalDate,date);return {...s,stop:s.stop/f,support:s.support/f};});
  for(const s of basisSignals){const future=savedCalendar.filter(d=>d>s.signalDate);const result={signalId:s.id};for(const [version,partial] of [[RULES.version,false],[RULES.partialVersion,true]]){let t={status:'pending'};if(future.length){const bars=future.map(d=>prices[s.symbol].find(b=>b.date===d));if(bars.some(b=>!b))throw Error('Missing forward session; refusing to advance trades.');t=startTrade(s,bars[0],partial);for(const b of bars.slice(0,20))t=advance(t,b);}result[version]=t;}pairs.push(result);}
  ledger.pairs=pairs;ledger.metrics=Object.fromEntries([RULES.version,RULES.partialVersion].map(v=>[v,metrics(pairs.map(p=>p[v]))]));
  ledger.signalDates=new Set(ledger.signals.map(s=>s.signalDate)).size;
  ledger.accounts=Object.fromEntries([[RULES.version,false],[RULES.partialVersion,true]].map(([v,p])=>[v,simulateAccount(basisSignals,savedCalendar,prices,p)]));
  ledger.updatedAt=capturedAt;ledger.lastSession=date;
  fs.writeFileSync(file+'.tmp',JSON.stringify(ledger));
  fs.writeFileSync(archive,JSON.stringify({date,capturedAt,data,breadth,calendar}),{flag:'wx'});
  fs.renameSync(file+'.tmp',file);
  console.log(`MTR ${date}: ${eligible?candidates.length:0} new signals saved; ${pairs.length} total paired signals. ${eligible?'':'Entry window missed: candidates were not labeled forward signals.'}`);
  }
 }finally{fs.rmdirSync(lock);}
}
main().catch(e=>{console.error(e instanceof Error?e.message:'MTR run failed');process.exitCode=1;});
