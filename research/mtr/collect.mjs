// Provider collection only. Does not change frozen trading or breadth formulas.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {requiredSymbols,validateStoredBars} from './stored-data.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
export const PARITY_TOLERANCE=0.001; // 0.1% maximum relative OHLC difference; fail for review above it.
const dayRE=/^\d{4}-\d{2}-\d{2}$/;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const read=file=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;
function atomic(file,value){fs.writeFileSync(file+'.tmp',JSON.stringify(value));fs.renameSync(file+'.tmp',file);}
export function loadEnvironment(project,env=process.env){
 const file=path.join(project,'.env.local');
 if(fs.existsSync(file))for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){
  const m=line.match(/^(TWELVEDATA_API_KEY|MASSIVE_API_KEY)=(.*)$/);
  if(m&&!env[m[1]])env[m[1]]=m[2].trim().replace(/^(['"])(.*)\1$/,'$2');
 }
}
export function completedThrough(now=new Date()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
 const d=new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00Z`);
 if(Number(parts.hour)<22)d.setUTCDate(d.getUTCDate()-1);
 while([0,6].includes(d.getUTCDay()))d.setUTCDate(d.getUTCDate()-1);
 return d.toISOString().slice(0,10);
}
// Scheduled NYSE full-day holidays. An unexpected closure fails closed as a stale feed.
export function expectedSession(through){
 const observed=(y,m,d)=>{const x=new Date(Date.UTC(y,m-1,d,12)),w=x.getUTCDay();x.setUTCDate(d+(w===6?-1:w===0?1:0));return x.toISOString().slice(0,10);};
 const nth=(y,m,w,n)=>{const x=new Date(Date.UTC(y,m-1,1,12));x.setUTCDate(1+(w-x.getUTCDay()+7)%7+7*(n-1));return x.toISOString().slice(0,10);};
 const lastMonday=(y,m)=>{const x=new Date(Date.UTC(y,m,0,12));x.setUTCDate(x.getUTCDate()-(x.getUTCDay()+6)%7);return x.toISOString().slice(0,10);};
 function holidays(y){
  const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;
  const goodFriday=new Date(Date.UTC(y,month-1,day-2,12)).toISOString().slice(0,10);
  const newYear=new Date(Date.UTC(y,0,1,12));if(newYear.getUTCDay()===0)newYear.setUTCDate(2);
  return new Set([newYear.toISOString().slice(0,10),nth(y,1,1,3),nth(y,2,1,3),goodFriday,lastMonday(y,5),observed(y,6,19),observed(y,7,4),nth(y,9,1,1),nth(y,11,4,4),observed(y,12,25),...(y===2025?['2025-01-09']:[])]);
 }
 const date=new Date(through+'T12:00:00Z');
 while([0,6].includes(date.getUTCDay())||holidays(date.getUTCFullYear()).has(date.toISOString().slice(0,10)))date.setUTCDate(date.getUTCDate()-1);
 return date.toISOString().slice(0,10);
}
export function candleRows(body,symbol,from,through){
 if(body.status!=='ok'||body.meta?.symbol!==symbol||body.meta?.interval!=='1day'||!Array.isArray(body.values))throw Error(`${symbol}: invalid Twelve Data response`);
 if(body.meta.exchange_timezone!=='America/New_York')throw Error(`${symbol}: unexpected exchange timezone`);
 if(body.values.some(b=>!dayRE.test(b.datetime)||new Date(b.datetime+'T00:00:00Z').toISOString().slice(0,10)!==b.datetime))throw Error(`${symbol}: invalid candle date`);
 // Never retain an unfinished/future candle, even if the provider ignores end_date.
 return validateStoredBars(body.values.filter(b=>dayRE.test(b.datetime)&&b.datetime>=from&&b.datetime<=through).map(b=>({date:b.datetime,...Object.fromEntries(['open','high','low','close'].map(k=>[k,Number(b[k])])),...(b.volume!==undefined?{volume:Number(b.volume)}:{})})));
}
export function splitRows(results,from,through){
 if(!Array.isArray(results))throw Error('Invalid Massive splits response');
 const data=Object.fromEntries(requiredSymbols.map(s=>[s,[]])),seen=new Set();
 for(const s of results){
  if(!requiredSymbols.includes(s.ticker))continue;
  if(!dayRE.test(s.execution_date)||s.execution_date<from||s.execution_date>through||!Number.isFinite(s.split_from)||!Number.isFinite(s.split_to)||s.split_from<=0||s.split_to<=0||!['forward_split','reverse_split','stock_dividend'].includes(s.adjustment_type))throw Error('Invalid Massive split action');
  const key=`${s.ticker}:${s.execution_date}`;
  if(seen.has(key))throw Error('Duplicate Massive split action requires review');seen.add(key);
  data[s.ticker].push({date:s.execution_date,split:`${s.split_to}/${s.split_from}`});
 }
 return data;
}
function ratio(s){const p=String(s.split).split('/').map(Number);if(p.length!==2||p.some(n=>!Number.isFinite(n)||n<=0))throw Error('Invalid split ratio');return p[0]/p[1];}
export function checkOverlap(symbol,rows,baseline,splits,from,through){
 const prior=new Map(baseline.rows.map(b=>[b.date,b])),by=new Map(rows.map(b=>[b.date,b]));
 // 50 sessions for breadth + five preceding sessions for its comparison.
 // The source handoff appends after this frozen boundary, never replaces its history.
 const window=baseline.rows.filter(b=>b.date>=from&&b.date<=through).slice(-55);
 if(window.length!==55)throw Error(`${symbol}: fewer than 55 frozen overlap sessions; review required`);
 if(window.some(b=>!by.has(b.date)))throw Error(`${symbol}: missing frozen overlap session`);
 const windowStart=window[0].date,boundary=window.at(-1).date;
 let maxRelativeDifference=0,olderOverlapMaxRelativeDifference=0;
 for(const row of rows){const old=prior.get(row.date);if(!old)continue;
  const delta=Math.max(...['open','high','low','close'].map(k=>Math.abs(row[k]-old[k])/old[k]));
  if(row.date>=windowStart&&row.date<=boundary)maxRelativeDifference=Math.max(maxRelativeDifference,delta);
  else if(row.date<windowStart)olderOverlapMaxRelativeDifference=Math.max(olderOverlapMaxRelativeDifference,delta);
 }
 if(maxRelativeDifference>PARITY_TOLERANCE)throw Error(`${symbol}: cross-provider OHLC mismatch; review required`);
 const known=new Map(baseline.splits.filter(s=>s.date>=from&&s.date<=boundary).map(s=>[s.date,ratio(s)]));
 const fresh=new Map(splits.map(s=>[s.date,ratio(s)])),legacyActionDifferences=[];
 for(const [date,value] of known)if(!fresh.has(date)||Math.abs(fresh.get(date)/value-1)>1e-10){
  if(date>=windowStart)throw Error(`${symbol}: split history mismatch; review required`);
  legacyActionDifferences.push({date,savedRatio:value,incomingRatio:fresh.get(date)??null,policy:'retain frozen saved action'});
 }
 for(const [date,value] of fresh)if(date<=boundary&&!known.has(date)){
  if(date>=windowStart)throw Error(`${symbol}: newly reported historical split; review required`);
  legacyActionDifferences.push({date,savedRatio:null,incomingRatio:value,policy:'do not add retrospective action'});
 }
 return {policy:'append-only-55-session-handoff-v1',overlapSessions:window.length,windowStart,boundary,maxRelativeDifference,olderOverlapMaxRelativeDifference,legacyActionDifferences,tolerance:PARITY_TOLERANCE};
}
export function appendAfterBoundary(item,baseline,boundary,from){
 const rows=[...baseline.rows.filter(b=>b.date>=from&&b.date<=boundary),...item.rows.filter(b=>b.date>boundary)];
 const splits=[...baseline.splits.filter(s=>s.date>=from&&s.date<=boundary),...item.splits.filter(s=>s.date>boundary)];
 return {...item,rows:validateStoredBars(rows),splits};
}
export function providerClient({env=process.env,fetchFn=fetch,sleep=pause,clock=Date.now}={}){
 if(!env.TWELVEDATA_API_KEY||!env.MASSIVE_API_KEY)throw Error('TWELVEDATA_API_KEY and MASSIVE_API_KEY are required.');
 const last={},budget={twelve:0,massive:0};
 async function request(url,provider){
  const host=provider==='twelve'?'api.twelvedata.com':'api.massive.com';
  if(url.protocol!=='https:'||url.hostname!==host||url.port||url.username||url.password)throw Error('Unsafe provider URL');
  for(let attempt=0;attempt<3;attempt++){
   // Conservative pacing: <=7 Twelve requests/min and <=4 Massive requests/min.
   if(last[provider]!==undefined)await sleep(Math.max(0,(provider==='twelve'?9000:15000)-(clock()-last[provider])));
   if(++budget[provider]>(provider==='twelve'?300:100))throw Error('Collector request budget reached; retry later.');
   last[provider]=clock();
   let response,body;
   try{response=await fetchFn(url,{signal:AbortSignal.timeout(30000),redirect:'error'});body=await response.json();}catch{throw Error('Provider connection or JSON failed; retry later.');}
   const code=Number(body?.code??response.status);
   if(response.status===429||code===429||response.status>=500){if(attempt<2){await sleep(60000);continue;}}
   if(!response.ok||body?.status==='error')throw Error(`${provider==='twelve'?'Twelve Data':'Massive'} HTTP ${code}`);
   return body;
  }
 }
 return {
  async candles(symbol,from,through){
   const u=new URL('https://api.twelvedata.com/time_series');u.search=new URLSearchParams({symbol,interval:'1day',start_date:from,outputsize:'5000',order:'asc',adjust:'none',country:'United States',apikey:env.TWELVEDATA_API_KEY});
   return candleRows(await request(u,'twelve'),symbol,from,through);
  },
  async splits(from,through){
   let u=new URL('https://api.massive.com/stocks/v1/splits');u.search=new URLSearchParams({'execution_date.gte':from,'execution_date.lte':through,limit:'5000',sort:'execution_date.asc'});
   const all=[],visited=new Set();
   while(u){
    if(u.origin!=='https://api.massive.com'||u.pathname!=='/stocks/v1/splits'||visited.has(u.href))throw Error('Unsafe or repeated Massive pagination');
    visited.add(u.href);u.searchParams.set('apiKey',env.MASSIVE_API_KEY);
    const b=await request(u,'massive');if(b.status!=='OK'||!Array.isArray(b.results))throw Error('Invalid Massive splits response');all.push(...b.results);
    u=b.next_url?new URL(b.next_url):null;
   }
   return splitRows(all,from,through);
  }
 };
}
export async function collect({dir=path.join(root,'journal'),baseline,client,now=new Date(),progress=console.log}={}){
 if(!baseline?.data)throw Error('Stored baseline is required.');
 const through=completedThrough(now),from=new Date(Date.parse(through)-220*86400000).toISOString().slice(0,10);
 const finalFile=path.join(dir,'market-data.json'),stageFile=path.join(dir,'collector-cache.json');
 const final=read(finalFile);
 if(final?.version===1&&final.handoffVersion===1&&final.through===through&&requiredSymbols.every(s=>final.data?.[s]?.rows?.length))return final;
 fs.mkdirSync(dir,{recursive:true});const lock=path.join(dir,'collect.lock');fs.mkdirSync(lock);
 try{
  if(fs.existsSync(path.join(dir,'run.lock')))throw Error('MTR scan is active; retry later.');
  let stage=read(stageFile);
  if(stage?.version!==1||stage.from!==from||stage.through!==through)stage={version:1,from,through,data:{},splits:null};
  // Older date-only end_date requests excluded the requested session on the live feed.
  // Keep complete downloads, refresh affected symbols, and filter active candles locally.
  for(const [symbol,item] of Object.entries(stage.data)){
   if(item.rows?.at(-1)?.date!==expectedSession(through))delete stage.data[symbol];
  }
  atomic(stageFile,stage);
  if(!stage.splits){stage.splits=await client.splits(from,through);atomic(stageFile,stage);}
  for(const symbol of requiredSymbols){
   if(!stage.data[symbol]){const rows=await client.candles(symbol,from,through);if(rows.length<60)throw Error(`${symbol}: fewer than 60 completed candles`);stage.data[symbol]={rows,splits:stage.splits[symbol],splitThrough:through};atomic(stageFile,stage);progress(`Saved candles ${symbol} (${Object.keys(stage.data).length}/124).`);}
  }
  const calendar=stage.data.SPY.rows.map(b=>b.date),latest=calendar.at(-1);
  if(latest!==expectedSession(through)){delete stage.data.SPY;atomic(stageFile,stage);throw Error('Collected SPY data is stale; retry will refresh SPY.');}
  const parity={},merged={};
  for(const symbol of requiredSymbols){
   const item=stage.data[symbol];validateStoredBars(item.rows);
   if(item.rows.some(b=>b.date<from||b.date>through))throw Error('Staged candles exceed completed date range.');
   const dates=new Set(item.rows.map(b=>b.date));
   if(calendar.some(d=>!dates.has(d))||item.rows.at(-1)?.date!==latest){delete stage.data[symbol];atomic(stageFile,stage);throw Error(`${symbol}: missing completed SPY-calendar session`);}
   const old=baseline.data[symbol];if(!old)throw Error(`${symbol}: missing historical baseline`);
   parity[symbol]=checkOverlap(symbol,item.rows,old,item.splits,from,through);
   merged[symbol]=appendAfterBoundary(item,old,parity[symbol].boundary,from);
  }
  const result={version:1,handoffVersion:1,from,through,latest,capturedAt:now.toISOString(),source:'Twelve Data raw OHLC + Massive corporate actions',adjust:'none',parity,data:merged};
  atomic(finalFile,result);progress(`Validated 124 symbols through ${latest}. Forward journal was not changed.`);return result;
 }finally{fs.rmdirSync(lock);}
}
async function main(){
 loadEnvironment(path.resolve(root,'../..'));
 const {loadStoredData}=await import('./stored-data.mjs');
 const dir=path.join(root,'journal'),ledger=read(path.join(dir,'ledger.json'));
 if(!ledger?.lastSession)throw Error('Existing MTR journal required; do not initialize or reset it.');
 const baseline=loadStoredData({cacheDir:process.env.MTR_DATA_DIR,ledger,collected:read(path.join(dir,'market-data.json'))});
 await collect({dir,baseline,client:providerClient()});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});
