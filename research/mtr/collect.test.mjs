import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {collect,completedThrough,expectedSession,candleRows,splitRows,checkOverlap,appendAfterBoundary,providerClient} from './collect.mjs';
import {requiredSymbols,loadStoredData} from './stored-data.mjs';
const temp=t=>{const p=fs.mkdtempSync(path.join(os.tmpdir(),'mtr-collect-'));t.after(()=>fs.rmSync(p,{force:true,recursive:true}));return p;};
const bar=(date,close=100)=>({date,open:close,high:close+1,low:close-1,close});
const calendar=[];for(let d=new Date('2026-04-06T12:00:00Z');d<=new Date('2026-11-11T12:00:00Z');d.setUTCDate(d.getUTCDate()+1))if(![0,6].includes(d.getUTCDay()))calendar.push(d.toISOString().slice(0,10));
const rows=calendar.map(d=>bar(d));
function baseline(){return {data:Object.fromEntries(requiredSymbols.map(s=>[s,{rows:rows.filter(b=>b.date<='2026-10-12'),splits:[],splitThrough:'2026-10-12'}]))};}
function client(overrides={}){return {candles:async()=>rows,splits:async()=>Object.fromEntries(requiredSymbols.map(s=>[s,[]])),...overrides};}
test('ET cutoff excludes active candles across DST and weekends',()=>{
 assert.equal(completedThrough(new Date('2026-11-12T15:00:00Z')),'2026-11-11');
 assert.equal(completedThrough(new Date('2026-11-13T03:00:00Z')),'2026-11-12');
 assert.equal(completedThrough(new Date('2026-07-10T01:00:00Z')),'2026-07-08');
 assert.equal(completedThrough(new Date('2026-11-15T15:00:00Z')),'2026-11-13');
});
test('candles validate identity, timezone, numeric OHLC, duplicates; future candle is excluded',()=>{
 const body={status:'ok',meta:{symbol:'SPY',interval:'1day',exchange_timezone:'America/New_York'},values:[{datetime:'2026-11-11',open:'100',high:'101',low:'99',close:'100'},{datetime:'2026-11-12',open:'100',high:'101',low:'99',close:'100'}]};
 assert.equal(candleRows(body,'SPY','2026-11-01','2026-11-11').length,1);
 assert.throws(()=>candleRows(body,'RSP','2026-11-01','2026-11-11'),/invalid/);
 const bad=structuredClone(body);bad.values[0].close='NaN';assert.throws(()=>candleRows(bad,'SPY','2026-11-01','2026-11-11'),/Invalid/);
 bad.values=[body.values[0],body.values[0]];assert.throws(()=>candleRows(bad,'SPY','2026-11-01','2026-11-11'),/duplicate/);
});
test('split ratios include reverse splits and stock dividends; duplicates and future actions fail',()=>{
 const record={ticker:'NVDA',execution_date:'2026-10-20',adjustment_type:'stock_dividend',split_from:1,split_to:10};
 assert.equal(splitRows([record],'2026-10-01','2026-11-11').NVDA[0].split,'10/1');
 assert.equal(splitRows([{...record,split_from:10,split_to:1,adjustment_type:'reverse_split'}],'2026-10-01','2026-11-11').NVDA[0].split,'1/10');
 assert.throws(()=>splitRows([record,record],'2026-10-01','2026-11-11'),/Duplicate/);
 assert.throws(()=>splitRows([record],'2026-10-01','2026-10-19'),/Invalid/);
});
test('overlap detects adjusted prices, split revisions and newly discovered frozen-date actions',()=>{
 const old=baseline().data.SPY;
 assert.ok(checkOverlap('SPY',rows,old,[],'2026-04-05','2026-11-11').overlapSessions>5);
 assert.throws(()=>checkOverlap('SPY',rows.map(b=>bar(b.date,50)),old,[],'2026-04-05','2026-11-11'),/OHLC mismatch/);
 assert.throws(()=>checkOverlap('SPY',rows,old,[{date:'2026-10-01',split:'2/1'}],'2026-04-05','2026-11-11'),/historical split/);
 assert.throws(()=>checkOverlap('SPY',rows,{...old,splits:[{date:'2026-10-01',split:'2/1'}]},[],'2026-04-05','2026-11-11'),/split history/);
});
test('collector resumes staged downloads, fails closed on gaps, leaves ledger untouched',async t=>{
 const dir=temp(t),ledger='{"lastSession":"2026-10-12"}';fs.writeFileSync(path.join(dir,'ledger.json'),ledger);
 let count=0;
 await assert.rejects(collect({dir,baseline:baseline(),client:client({candles:async s=>{if(++count===4)throw Error('Twelve Data HTTP 429');return rows;}}),now:new Date('2026-11-12T15:00:00Z'),progress:()=>{}}),/429/);
 assert.ok(!fs.existsSync(path.join(dir,'market-data.json')));assert.equal(Object.keys(JSON.parse(fs.readFileSync(path.join(dir,'collector-cache.json'))).data).length,3);
 let resumed=0;const result=await collect({dir,baseline:baseline(),client:client({candles:async()=>{resumed++;return rows;}}),now:new Date('2026-11-12T15:00:00Z'),progress:()=>{}});
 assert.equal(resumed,121);assert.equal(result.latest,'2026-11-11');assert.equal(fs.readFileSync(path.join(dir,'ledger.json'),'utf8'),ledger);
 const merged=loadStoredData({cacheDir:path.join(dir,'absent'),collected:result});assert.equal(merged.data.AAPL.rows.at(-1).date,'2026-11-11');
 await collect({dir,baseline:baseline(),client:client({candles:async()=>{throw Error('Unexpected redownload');}}),now:new Date('2026-11-12T15:00:00Z'),progress:()=>{}});
 const badDir=temp(t);await assert.rejects(collect({dir:badDir,baseline:baseline(),client:client({candles:async s=>s==='AAPL'?rows.slice(1):rows}),now:new Date('2026-11-12T15:00:00Z'),progress:()=>{}}),/missing completed/);
 assert.ok(!fs.existsSync(path.join(badDir,'market-data.json')));
});
test('provider pacing, raw-price parameters, paginated splits and secret-safe failures',async()=>{
 let now=0;const waits=[],urls=[];
 const env={TWELVEDATA_API_KEY:'secret-one',MASSIVE_API_KEY:'secret-two'};
 const p=providerClient({env,clock:()=>now,sleep:async ms=>{waits.push(ms);now+=ms;},fetchFn:async url=>{
  urls.push(new URL(url));
  if(url.hostname==='api.twelvedata.com')return {ok:true,status:200,json:async()=>({status:'ok',meta:{symbol:'SPY',interval:'1day',exchange_timezone:'America/New_York'},values:[{datetime:'2026-11-11',open:'100',high:'101',low:'99',close:'100'}]})};
  return {ok:true,status:200,json:async()=>({status:'OK',results:[],...(url.searchParams.has('cursor')?{}:{next_url:'https://api.massive.com/stocks/v1/splits?cursor=two'})})};
 }});
 await p.candles('SPY','2026-11-01','2026-11-11');await p.candles('SPY','2026-11-01','2026-11-11');await p.splits('2026-11-01','2026-11-11');
 assert.ok(waits.includes(9000));assert.ok(waits.includes(15000));assert.equal(urls[0].searchParams.get('adjust'),'none');assert.equal(urls[0].searchParams.has('end_date'),false);assert.equal(urls.at(-1).searchParams.get('apiKey'),'secret-two');
 const fail=providerClient({env,sleep:async()=>{},fetchFn:async()=>{throw Error('secret-one URL');}});
 await assert.rejects(fail.candles('SPY','2026-11-01','2026-11-11'),e=>!e.message.includes('secret-one'));
});
test('unsafe pagination never receives the Massive credential',async()=>{
 let calls=0;const p=providerClient({env:{TWELVEDATA_API_KEY:'a',MASSIVE_API_KEY:'b'},sleep:async()=>{},fetchFn:async()=>{calls++;return {ok:true,status:200,json:async()=>({status:'OK',results:[],next_url:'https://evil.invalid/stocks/v1/splits'})};}});
 await assert.rejects(p.splits('2026-11-01','2026-11-11'),/Unsafe/);assert.equal(calls,1);
});

test('expected completed SPY session handles exchange holidays and early-close days',()=>{
 assert.equal(expectedSession('2026-12-25'),'2026-12-24');
 assert.equal(expectedSession('2026-11-26'),'2026-11-25');
 assert.equal(expectedSession('2026-11-27'),'2026-11-27');
 assert.equal(expectedSession('2026-04-03'),'2026-04-02');
 assert.equal(expectedSession('2026-07-03'),'2026-07-02');
 assert.equal(expectedSession('2027-01-01'),'2026-12-31');
});
test('stale or incomplete staged candles are refreshed on retry',async t=>{
 const dir=temp(t);await assert.rejects(collect({dir,baseline:baseline(),client:client({candles:async s=>s==='SPY'?rows.slice(0,-1):rows}),now:new Date('2026-11-12T11:00:00Z'),progress:()=>{}}),/SPY data is stale/);
 const stage=JSON.parse(fs.readFileSync(path.join(dir,'collector-cache.json')));assert.ok(!stage.data.SPY);
 let calls=0;await collect({dir,baseline:baseline(),client:client({candles:async s=>{calls++;assert.equal(s,'SPY');return rows;}}),now:new Date('2026-11-12T11:00:00Z'),progress:()=>{}});assert.equal(calls,1);
});
test('real collector feeds the scanner; catch-up preserves old archives and never backdates forward signals',async t=>{
 const {spawnSync}=await import('node:child_process');const {fileURLToPath,pathToFileURL}=await import('node:url');
 const base=temp(t),here=path.dirname(fileURLToPath(import.meta.url)),mtr=path.join(base,'research/mtr'),history=path.join(base,'research/historical-reconstruction'),cache=path.join(history,'cache');
 fs.mkdirSync(mtr,{recursive:true});fs.mkdirSync(cache,{recursive:true});
 for(const name of ['run.mjs','schedule.mjs','engine.mjs','stored-data.mjs','collect.mjs'])fs.copyFileSync(path.join(here,name),path.join(mtr,name));
 fs.copyFileSync(path.join(here,'../historical-reconstruction/frozen.mjs'),path.join(history,'frozen.mjs'));
 for(const symbol of requiredSymbols)for(const endpoint of ['eod','splits'])fs.writeFileSync(path.join(cache,`${endpoint}-${symbol}.json`),JSON.stringify({symbol,eodhdSymbol:`${symbol}.US`,endpoint,from:calendar[0],to:'2026-10-12',rows:endpoint==='eod'?rows.filter(b=>b.date<='2026-10-12'):[]}));
 fs.writeFileSync(path.join(base,'prices.json'),JSON.stringify(rows));
 const mock=path.join(base,'provider.mjs');fs.writeFileSync(mock,`
 import fs from 'node:fs';const D=Date;
 globalThis.Date=class extends D{constructor(...a){super(...(a.length?a:[process.env.TEST_NOW]));}static now(){return D.parse(process.env.TEST_NOW);}};
 const timeout=setTimeout;globalThis.setTimeout=(f,ms,...a)=>timeout(f,ms>=9000?0:ms,...a);
 globalThis.fetch=async raw=>{const u=new URL(raw);if(u.hostname==='api.massive.com')return {ok:true,status:200,json:async()=>({status:'OK',results:[]})};
 if(u.hostname!=='api.twelvedata.com')throw Error('Unexpected provider');
 const bars=JSON.parse(fs.readFileSync(process.env.PRICES)).filter(b=>b.date>=u.searchParams.get('start_date')&&b.date<=(u.searchParams.get('end_date')??'9999-12-31'));
 return {ok:true,status:200,json:async()=>({status:'ok',meta:{symbol:u.searchParams.get('symbol'),interval:'1day',exchange_timezone:'America/New_York'},values:bars.map(b=>({...b,datetime:b.date}))})};};
 `);
 const execute=(script,command,clock,source)=>{const r=spawnSync(process.execPath,['--import',pathToFileURL(mock).href,path.join(mtr,script),...(command?[command]:[])],{encoding:'utf8',env:{...process.env,MTR_DATA_SOURCE:source,EODHD_API_TOKEN:'',TWELVEDATA_API_KEY:'test',MASSIVE_API_KEY:'test',TEST_NOW:clock,PRICES:path.join(base,'prices.json')}});assert.equal(r.status,0,r.stderr);return r;};
 execute('run.mjs','scan','2026-10-13T03:00:00Z','stored');
 const originalArchive=fs.readFileSync(path.join(mtr,'journal/2026-10-12.json'),'utf8');
 execute('collect.mjs',null,'2026-11-12T11:00:00Z','free');
 execute('run.mjs','scan','2026-11-12T11:00:00Z','free');
 const ledger=JSON.parse(fs.readFileSync(path.join(mtr,'journal/ledger.json')));
 assert.equal(ledger.lastSession,'2026-11-11');assert.equal(fs.readFileSync(path.join(mtr,'journal/2026-10-12.json'),'utf8'),originalArchive);
 assert.ok(ledger.observations.filter(o=>o.date>'2026-10-12'&&o.date<'2026-11-11').every(o=>o.status==='missed_entry_window'));
 assert.ok(ledger.observations.find(o=>o.date==='2026-11-11').status==='forward');
 const before=JSON.stringify(ledger);execute('run.mjs','scan','2026-11-12T11:00:00Z','free');assert.equal(JSON.stringify(JSON.parse(fs.readFileSync(path.join(mtr,'journal/ledger.json')))),before);
});

test('old date-bound caches are refreshed without resetting completed downloads or the journal',async t=>{
 const dir=temp(t),through='2026-11-11',from=new Date(Date.parse(through)-220*86400000).toISOString().slice(0,10);
 const stage={version:1,from,through,splits:Object.fromEntries(requiredSymbols.map(s=>[s,[]])),data:Object.fromEntries(requiredSymbols.map(s=>[s,{rows:s==='SPY'?rows:rows.slice(0,-1),splits:[],splitThrough:through}]))};
 fs.writeFileSync(path.join(dir,'collector-cache.json'),JSON.stringify(stage));
 const ledger='{"lastSession":"2026-10-12"}';fs.writeFileSync(path.join(dir,'ledger.json'),ledger);
 const calls=[];const result=await collect({dir,baseline:baseline(),client:client({candles:async s=>{calls.push(s);return rows;},splits:async()=>{throw Error('Unexpected splits redownload');}}),now:new Date('2026-11-12T15:00:00Z'),progress:()=>{}});
 assert.equal(calls.length,123);assert.ok(!calls.includes('SPY'));assert.equal(result.latest,through);
 assert.equal(fs.readFileSync(path.join(dir,'ledger.json'),'utf8'),ledger);
});

test('historical vendor adjustment is audited; frozen bars/actions stay exact while only new dates append',()=>{
 const old=baseline().data.HON,action={date:'2026-06-29',split:'1907.000000/2000.000000'};old.splits=[action];
 const incoming=rows.map(b=>b.date<'2026-06-25'?Object.fromEntries(Object.entries(b).map(([k,v])=>[k,k==='date'?v:v*.9535])):{...b});
 const audit=checkOverlap('HON',incoming,old,[],calendar[0],'2026-11-11');
 assert.equal(audit.overlapSessions,55);assert.equal(audit.maxRelativeDifference,0);assert.ok(audit.olderOverlapMaxRelativeDifference>.04);assert.equal(audit.legacyActionDifferences.length,1);
 const merged=appendAfterBoundary({rows:incoming,splits:[],splitThrough:'2026-11-11'},old,audit.boundary,calendar[0]);
 assert.deepEqual(merged.rows.filter(b=>b.date<=audit.boundary),old.rows);assert.deepEqual(merged.splits,[action]);assert.equal(merged.rows.at(-1).date,'2026-11-11');
});
test('recent-window mismatches and historical action revisions inside the handoff window still fail',()=>{
 const old=baseline().data.HON;
 assert.throws(()=>checkOverlap('HON',rows.map(b=>b.date==='2026-10-01'?bar(b.date,99):b),old,[],calendar[0],'2026-11-11'),/OHLC mismatch/);
 assert.throws(()=>checkOverlap('HON',rows,old,[{date:'2026-10-01',split:'2/1'}],calendar[0],'2026-11-11'),/historical split/);
 assert.throws(()=>checkOverlap('HON',rows.filter(b=>b.date!=='2026-10-01'),old,[],calendar[0],'2026-11-11'),/missing frozen overlap/);
});
