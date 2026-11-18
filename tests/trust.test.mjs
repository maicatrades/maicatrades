import test from 'node:test';
import assert from 'node:assert/strict';
import {marketSession,isTradingDate,previousTradingDate,formatEasternQuote} from '../src/lib/market-session.ts';
import {rollingScoreWindow,writeScoreSnapshot,writeBreadthSnapshot,validScore} from '../src/lib/score-history.ts';
function database(initial=[]){
 const rows=structuredClone(initial),calls=[];
 return {rows,calls,from(table){const filters=[];let action='select',row,options,desc=false,limit=Infinity;
 const query={select(){return query;},update(value){action='update';row=value;return query;},upsert(value,opts){action='upsert';row=value;options=opts;return query;},
 eq(key,value){filters.push([key,value,'eq']);return query;},lt(key,value){filters.push([key,value,'lt']);return query;},order(key,opts){desc=!opts.ascending;calls.push({table,key,...opts});return query;},limit(n){limit=n;return query;},
 then(resolve){calls.push({table,action,filters,options});let matched=rows.filter(r=>filters.every(([k,v,op])=>op==='lt'?r[k]!=null&&r[k]<v:r[k]===v));
 if(action==='update'){for(const r of matched)Object.assign(r,row);return Promise.resolve({data:matched,error:null}).then(resolve);}
 if(action==='upsert'){const old=rows.find(r=>r.trading_date===row.trading_date);if(!old)rows.push(structuredClone(row));else if(!options?.ignoreDuplicates)Object.assign(old,row);return Promise.resolve({data:null,error:null}).then(resolve);}
 matched.sort((a,b)=>(desc?-1:1)*a.trading_date.localeCompare(b.trading_date));return Promise.resolve({data:structuredClone(matched.slice(0,limit)),error:null}).then(resolve);}};return query;}};
}
test('NYSE weekends, holidays, early close, Veterans Day and unsupported years',()=>{
 assert.equal(isTradingDate('2026-11-11'),true);assert.equal(isTradingDate('2026-11-26'),false);assert.equal(isTradingDate('2026-11-15'),false);assert.equal(isTradingDate('2029-01-02'),false);
 assert.equal(marketSession(new Date('2026-11-27T17:59:00Z')).isRegularSession,true);
 assert.equal(marketSession(new Date('2026-11-27T18:00:00Z')).isRegularSession,false);
 assert.equal(marketSession(new Date('2026-11-27T18:00:00Z')).completedDate,'2026-11-27');
 assert.equal(previousTradingDate('2026-11-27'),'2026-11-25');
});
test('Eastern market clock handles DST and Sunday completed session',()=>{
 assert.equal(marketSession(new Date('2026-03-06T14:30:00Z')).isRegularSession,true);
 assert.equal(marketSession(new Date('2026-03-09T13:30:00Z')).isRegularSession,true);
 assert.equal(marketSession(new Date('2026-11-15T15:00:00Z')).completedDate,'2026-11-13');
 assert.match(formatEasternQuote(Date.parse('2026-11-13T21:00:00Z')/1000),/EST/);
 assert.equal(formatEasternQuote(null),'Quote time unavailable');
});
test('five-session averages require contiguous valid observations; null is never zero',()=>{
 const values=[['2026-11-13',41],['2026-11-12',31],['2026-11-11',25],['2026-11-10',25],['2026-11-09',36]].map(([tradingDate,score])=>({tradingDate,score}));
 assert.equal(rollingScoreWindow(values).average,31.6);
 assert.equal(rollingScoreWindow(values.filter(r=>r.tradingDate!=='2026-11-11')).average,null);
 assert.equal(rollingScoreWindow([...values.slice(0,1),{tradingDate:'2026-11-12',score:null}]).sampleSize,1);
 for(const v of [null,undefined,NaN,-1,101,'41'])assert.equal(validScore(v),false);
});
test('duplicate, intraday, final and concurrent snapshot writes never replace final data',async()=>{
 const db=database();const row={trading_date:'2026-11-13',market_score:41,snapshot_status:'intraday'};
 await writeScoreSnapshot(db,row);await writeScoreSnapshot(db,{...row,market_score:42});
 assert.equal(db.rows[0].market_score,42);
 await Promise.all([writeScoreSnapshot(db,{...row,market_score:43,snapshot_status:'final'}),writeScoreSnapshot(db,{...row,market_score:44,snapshot_status:'final'})]);
 assert.equal(db.rows[0].market_score,43);await writeScoreSnapshot(db,{...row,market_score:1});assert.equal(db.rows[0].market_score,43);assert.equal(db.rows.length,1);
 await assert.rejects(writeScoreSnapshot(db,{...row,market_score:null}),/Invalid/);
});
test('market score API returns finalized close on weekends without contacting providers or writing',async()=>{
 const db=database([{trading_date:'2026-11-13',market_score:41,market_label:'Bearish',snapshot_status:'final',updated_at:'2026-11-13T21:05:00Z'}]);globalThis.testDatabase=db;
 const OriginalDate=Date;globalThis.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:['2026-11-15T15:00:00Z']));}static now(){return new OriginalDate('2026-11-15T15:00:00Z').valueOf();}};
 const originalFetch=globalThis.fetch;globalThis.fetch=()=>{throw Error('Unexpected provider request');};
 try{const {GET}=await import('../src/app/api/market-score/route.ts');const response=await GET();const data=await response.json();assert.equal(response.status,200);assert.equal(data.score,41);assert.equal(data.snapshotStatus,'final');assert.equal(data.scoreAsOf,'2026-11-13');assert.equal(data.fiveDayAverage,null);assert.equal(db.calls.some(c=>['update','upsert'].includes(c.action)),false);assert.equal(response.headers.get('cache-control'),'no-store, max-age=0');}
 finally{globalThis.Date=OriginalDate;globalThis.fetch=originalFetch;}
});
test('Pro API enforces authentication, selects latest 250 final records and does not call a gap five sessions',async()=>{
 const db=globalThis.testDatabase;db.rows.splice(0);db.calls.splice(0);
 let date='2026-11-13';const dates=[];for(let i=0;i<260;i++){dates.push(date);date=previousTradingDate(date);}
 for(const [index,date] of dates.entries())db.rows.push({trading_date:date,market_score:41,market_label:'Bearish',snapshot_status:index===0?'intraday':'final',breadth_score:66});
 globalThis.testUser=null;
 const {GET}=await import('../src/app/api/pro/research/route.ts');assert.equal((await GET()).status,401);
 globalThis.testUser={id:'test-user'};const oldFetch=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({chart:{result:[{timestamp:[...dates].reverse().map(d=>Date.parse(d+'T21:00:00Z')/1000),indicators:{quote:[{close:dates.map((_,i)=>100+i)}]}}]}}));
 try{let response=await GET();let result=await response.json();assert.equal(response.status,200);assert.equal(result.history.recordCount,250);assert.equal(result.history.lastDate,'2026-11-12');assert.ok(db.calls.filter(c=>c.key==='trading_date').every(c=>c.ascending===false));
 db.rows.splice(0,db.rows.length,...db.rows.filter(r=>r.trading_date!=='2026-11-11'));result=await (await GET()).json();assert.equal(result.transition.changes.score5D,null);assert.equal(result.transition.changes.score1D,null);assert.match(result.outlook.confidence,/Insufficient/);}
 finally{globalThis.fetch=oldFetch;globalThis.testUser=null;}
});

test('breadth updates intraday, finalizes once and preserves a completed snapshot',async()=>{
 const db=database();const row={trading_date:'2026-11-13',breadth_score:60,updated_at:'2026-11-13T20:00:00Z'};const close='2026-11-13T21:00:00Z';
 await writeBreadthSnapshot(db,row,close);
 await writeBreadthSnapshot(db,{...row,breadth_score:66,updated_at:'2026-11-13T21:05:00Z'},close);
 await writeBreadthSnapshot(db,{...row,breadth_score:1,updated_at:'2026-11-16T12:00:00Z'},close);
 assert.equal(db.rows.length,1);assert.equal(db.rows[0].breadth_score,66);
 await assert.rejects(writeBreadthSnapshot(db,{...row,breadth_score:null},close),/Invalid/);
});
test('Trade Idea prefill preserves long and short planned levels, excludes account balances and rejects malformed levels',async()=>{
 const {tradePrefillUrl,parseTradePrefill}=await import('../src/lib/trade-prefill.ts');
 for(const direction of ['LONG','SHORT']){const idea={symbol:'QQQ',direction,entry:100,stopLoss:direction==='LONG'?95:105,target:direction==='LONG'?110:90};const url=new URL(tradePrefillUrl(idea,'WAITING_FOR_ENTRY'),'https://test.invalid');const parsed=parseTradePrefill(url.searchParams);assert.equal(parsed.entry,100);assert.equal(parsed.direction,direction.toLowerCase());assert.equal(parsed.status,'WAITING_FOR_ENTRY');assert.equal(url.searchParams.has('account'),false);}
 assert.equal(parseTradePrefill(new URLSearchParams('symbol=QQQ&direction=long&entry=100&stop=105&target=110')),null);
 assert.equal(parseTradePrefill(new URLSearchParams('symbol=QQQ&direction=long&entry=Infinity&stop=95&target=110')),null);
});
test('backdrop explanation only uses available same-session breadth',async()=>{
 const {explainBackdrop}=await import('../src/lib/market-explanation.ts');
 assert.match(explainBackdrop(41,66.53,true),/participation is healthier/);
 assert.match(explainBackdrop(41,66.53,false),/unavailable/);
 assert.match(explainBackdrop(41,null,true),/unavailable/);
 assert.doesNotMatch(explainBackdrop(41,66.53,true),/Technology/);
});
test('invalid provider responses fail closed without history writes',async()=>{
 const db=globalThis.testDatabase;db.rows.splice(0);db.calls.splice(0);
 const OriginalDate=Date;globalThis.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:['2026-11-16T15:00:00Z']));}static now(){return new OriginalDate('2026-11-16T15:00:00Z').valueOf();}};
 const oldFetch=globalThis.fetch,oldWarn=console.warn,oldError=console.error;
 globalThis.fetch=async()=>new Response('invalid',{status:200});console.warn=()=>{};console.error=()=>{};
 try{const {GET}=await import('../src/app/api/market-score/route.ts');const response=await GET();assert.equal(response.status,500);assert.equal((await response.json()).success,false);assert.equal(db.calls.some(c=>['update','upsert'].includes(c.action)),false);}
 finally{globalThis.Date=OriginalDate;globalThis.fetch=oldFetch;console.warn=oldWarn;console.error=oldError;}
});
test('VIX API uses regular-session reference, never ETF extended-hours zero substitution',async()=>{
 process.env.FINNHUB_API_KEY='fixture';const oldFetch=globalThis.fetch;
 const timestamp=Date.parse('2026-11-13T22:00:00Z')/1000;
 globalThis.fetch=async input=>{
  const url=new URL(String(input));
  if(url.hostname.includes('finnhub'))return new Response(JSON.stringify({c:100,pc:101,h:101,l:99,o:100,t:timestamp-3600}));
  const vix=decodeURIComponent(url.pathname).includes('^VIX');const price=vix?20:100;
  return new Response(JSON.stringify({chart:{result:[{meta:{regularMarketPrice:price,regularMarketTime:timestamp-3600,previousClose:price-1,currentTradingPeriod:{post:{start:timestamp-3600,end:timestamp+3600}}},timestamp:[timestamp-86400,timestamp],indicators:{quote:[{close:[price-1,price],high:[price,price+1],low:[price-2,price-1],volume:[100,100]}]}}]}}));
 };
 try{const {GET}=await import('../src/app/api/market-ticker/route.ts');const response=await GET();const result=await response.json();assert.equal(response.status,200);const vix=result.data.find(item=>item.symbol==='VIX');assert.equal(vix.session,'REGULAR');assert.equal(vix.previousClose,19);assert.equal(vix.changePercent,5.26);assert.equal(vix.extendedHoursPrice,null);}
 finally{globalThis.fetch=oldFetch;delete process.env.FINNHUB_API_KEY;}
});
