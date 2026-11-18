import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {planCapture, closeInstant, finalPairProblem, executeCapture, createCaptureTransport} from '../scripts/closing-capture/core.mjs';
const date='2026-11-18', instant='2026-11-18T21:17:00Z';
const clock=()=>new Date(instant);
function pair() {
 return {score:{trading_date:date,snapshot_status:'final',market_score:20,raw_score:26,breadth_score:40,breadth_trading_date:date,breadth_updated_at:'2026-11-18T21:15:00Z',captured_at:'2026-11-18T21:16:00Z'},breadth:{trading_date:date,breadth_score:40,updated_at:'2026-11-18T21:15:00Z'}};
}
test('closing schedule handles EST, EDT, early close, Veterans Day and rejects unsupported calendars',()=>{
 assert.equal(closeInstant('2026-11-18').toISOString(),'2026-11-18T21:00:00.000Z');
 assert.equal(closeInstant('2026-07-02').toISOString(),'2026-07-02T20:00:00.000Z');
 assert.equal(closeInstant('2026-11-27').toISOString(),'2026-11-27T18:00:00.000Z');
 assert.equal(planCapture(new Date('2026-11-18T21:09:00Z')).phase,'skip');
 assert.equal(planCapture(new Date('2026-11-18T21:10:00Z')).phase,'capture');
 assert.equal(planCapture(new Date('2026-11-18T22:40:00Z')).phase,'verify');
 assert.equal(planCapture(new Date('2026-11-27T18:17:00Z')).phase,'capture');
 assert.equal(planCapture(new Date('2026-11-11T21:17:00Z')).phase,'capture');
 assert.equal(planCapture(new Date('2026-11-26T21:17:00Z')).phase,'skip');
 assert.equal(planCapture(new Date('2026-11-21T21:17:00Z')).phase,'skip');
 assert.deepEqual(planCapture(new Date('2026-11-23T12:17:00Z')),{phase:'verify',date:'2026-11-20'});
 assert.throws(()=>planCapture(new Date('2029-01-02T21:17:00Z')),/calendar/);
});
test('closing proof rejects missing, intraday, stale, future and mismatched snapshots',()=>{
 const good=pair();assert.equal(finalPairProblem(good.score,good.breadth,date,clock()),null);
 for(const change of [p=>p.score=null,p=>p.score.snapshot_status='intraday',p=>p.score.market_score=null,p=>p.breadth.breadth_score=41,p=>p.score.breadth_trading_date='2026-11-17',p=>p.breadth.updated_at='2026-11-18T20:00:00Z',p=>p.score.captured_at='2026-11-18T22:00:00Z',p=>p.score.breadth_updated_at=null]) {
  const p=structuredClone(good);change(p);assert.ok(finalPairProblem(p.score,p.breadth,date,clock()));
 }
});
test('capture persists breadth before score and checks stored evidence instead of HTTP success',async()=>{
 let stored={score:null,breadth:null};const calls=[];
 const result=await executeCapture({mode:'capture',enabled:true,now:clock,readPair:async()=>structuredClone(stored),
 breadth:async()=>{calls.push('breadth');stored.breadth=pair().breadth;return {success:true,tradingDate:date,breadthScore:40,coverage:{returned:122,failed:0}};},
 score:async()=>{calls.push('score');stored.score=pair().score;return {success:true,scoreAsOf:date,snapshotStatus:'final',score:20};}});
 assert.equal(result.status,'captured');assert.deepEqual(calls,['breadth','score']);
 let count=0;
 await assert.rejects(executeCapture({mode:'capture',enabled:true,now:clock,sleep:async()=>{},readPair:async()=>({}),breadth:async()=>{count++;return {success:true,tradingDate:date,breadthScore:40,coverage:{returned:122,failed:0}};},score:async()=>assert.fail('No persisted breadth')}),/No historical repair/);
 assert.equal(count,3);
});
test('retries recover from partial provider failure without weakening coverage',async()=>{
 let stored={},attempt=0;const delays=[];
 const result=await executeCapture({mode:'capture',enabled:true,now:clock,sleep:async ms=>delays.push(ms),readPair:async()=>stored,
 breadth:async()=>{if(++attempt===1)return {success:true,tradingDate:date,breadthScore:40,coverage:{returned:121,failed:1}};stored.breadth=pair().breadth;return {success:true,tradingDate:date,breadthScore:40,coverage:{returned:122,failed:0}};},
 score:async()=>{stored.score=pair().score;return {success:true,scoreAsOf:date,snapshotStatus:'final',score:20};}});
 assert.equal(result.attempts,2);assert.deepEqual(delays,[10000]);
});
test('existing finals are preserved, missing sessions fail verification, and preview cannot capture',async()=>{
 let writes=0;const actions={breadth:async()=>{writes++;},score:async()=>{writes++;}};
 assert.equal((await executeCapture({mode:'capture',enabled:true,now:clock,readPair:async()=>pair(),...actions})).status,'already-final');
 const broken=pair();broken.score.breadth_score=42;
 await assert.rejects(executeCapture({mode:'capture',enabled:true,now:clock,sleep:async()=>{},readPair:async()=>broken,...actions}));
 await assert.rejects(executeCapture({mode:'verify',now:clock,readPair:async()=>({}),...actions}),/Missing finalized/);
 await assert.rejects(executeCapture({mode:'capture',enabled:true,preview:true,now:clock,readPair:async()=>assert.fail(),...actions}),/preview/);
 await assert.rejects(executeCapture({mode:'capture',now:clock,readPair:async()=>assert.fail(),...actions}),/enablement/);
 assert.equal(writes,0);
});
test('a retry stops if the closing write window expires',async()=>{
 let time=clock(),reads=0;
 await assert.rejects(executeCapture({mode:'capture',enabled:true,now:()=>time,sleep:async()=>{time=new Date('2026-11-18T22:41:00Z');},readPair:async()=>{reads++;throw Error('temporary');}}),/expired/);
 assert.equal(reads,1);
});
test('transport limits writes to conditional same-day market tables and verification to reads',async()=>{
 let calls=0;const native=async()=>{calls++;return Response.json([]);};
 const origin='https://fixture.invalid';
 const write=createCaptureTransport({underlyingFetch:native,origin,mode:'capture',evidence:[],now:clock});
 const row={trading_date:date,market_score:20};
 const good=origin+'/rest/v1/market_score_history?on_conflict=trading_date';
 await write(good,{method:'POST',headers:{Prefer:'resolution=ignore-duplicates'},body:JSON.stringify(row)});
 const patch=origin+`/rest/v1/market_score_history?trading_date=eq.${date}&snapshot_status=eq.intraday`;
 await write(patch,{method:'PATCH',body:JSON.stringify(row)});
 for(const [url,init] of [
  [good,{method:'POST',body:JSON.stringify(row)}],
  [patch,{method:'PATCH',body:JSON.stringify({...row,trading_date:'2026-11-17'})}],
  [origin+'/rest/v1/market_score_history',{method:'PATCH',body:JSON.stringify(row)}],
  [origin+'/rest/v1/mtr_research_log',{method:'GET'}],
  [origin+'/rest/v1/rpc/write',{method:'GET'}],
  ['https://foreign.invalid/rest/v1/market_score_history',{method:'GET'}]]) await assert.rejects(write(url,init));
 const read=createCaptureTransport({underlyingFetch:native,origin,mode:'verify',evidence:[],now:clock});
 await read(origin+'/rest/v1/market_score_history');
 await assert.rejects(read(good,{method:'POST',body:JSON.stringify(row)}));
 await assert.rejects(read('https://query1.finance.yahoo.com/v8/finance/chart/SPY'));
 assert.equal(calls,3);
});
test('production resolver uses real SDK without test database hooks; verification transports cannot mutate',()=>{
 const child=spawnSync(process.execPath,['--import','./scripts/closing-capture/register.mjs','--input-type=module','-e',`
 globalThis.fetch=async()=>new Response('[]',{headers:{'Content-Type':'application/json'}});
 const {supabaseAdmin}=await import('./src/lib/supabase.ts');
 if (!supabaseAdmin?.auth || globalThis.testDatabase) throw Error('Invalid production resolver');
 const {error}=await supabaseAdmin.from('market_score_history').select('trading_date');
 if(error) throw Error('SDK resolver failed');
 `],{encoding:'utf8',cwd:process.cwd(),env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'https://fixture.invalid',SUPABASE_SECRET_KEY:'fixture',MAICATRADES_READ_ONLY_PREVIEW:'true'}});
 assert.equal(child.status,0,child.stderr);
});
test('real Supabase builders pass conditional market writes through the closing transport',async()=>{
 const {createClient}=await import('@supabase/supabase-js');
 const {writeScoreSnapshot,writeBreadthSnapshot}=await import('../src/lib/score-history.ts');
 const requests=[];
 const transport=createCaptureTransport({origin:'https://fixture.invalid',mode:'capture',now:clock,evidence:[],underlyingFetch:async(url,init)=>{requests.push({url:String(url),method:init.method});return Response.json([]);}});
 const db=createClient('https://fixture.invalid','fixture',{global:{fetch:transport},auth:{persistSession:false,autoRefreshToken:false}});
 await writeScoreSnapshot(db,pair().score);
 await writeBreadthSnapshot(db,pair().breadth,closeInstant(date).toISOString());
 assert.deepEqual(requests.map(r=>r.method),['PATCH','POST','PATCH','POST']);
 assert.ok(requests.every(r=>r.url.includes('market_score_history')||r.url.includes('market_breadth_history')));
});
