import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {createPreviewProtectedFetch,isReadOnlyPreview} from '../src/lib/read-only-preview.ts';
const origin='https://fixture.invalid';

test('guard allows table GET/HEAD reads and disables redirects',async()=>{
 const calls=[];const guarded=createPreviewProtectedFetch(async(input,init)=>{calls.push([String(input),init]);return new Response('[]');},origin,()=>true);
 assert.equal((await guarded(origin+'/rest/v1/market_score_history?select=*')).status,200);
 assert.equal((await guarded(new Request(origin+'/rest/v1/market_breadth_history',{method:'HEAD'}))).status,200);
 assert.equal(calls.length,2);assert.ok(calls.every(([,init])=>init.redirect==='error'));
});
test('guard blocks writes, RPC including GET RPC, foreign origins and unexpected services before fetch',async()=>{
 let calls=0;const guarded=createPreviewProtectedFetch(async()=>{calls++;return new Response('[]');},origin,()=>true);
 const cases=[...['POST','PATCH','PUT','DELETE','OPTIONS'].map(method=>[origin+'/rest/v1/market_score_history',{method}]),
 [origin+'/rest/v1/rpc/dangerous',{method:'GET'}],[origin+'/rest/v1/rpc/dangerous',{method:'HEAD'}],
 [origin+'/rest/v1/rpc',{method:'GET'}],[origin+'/rest/v1/%72pc/dangerous',{method:'GET'}],
 [origin+'/auth/v1/admin/users',{method:'GET'}],[origin+'/storage/v1/object/bucket/file',{method:'GET'}],
 ['https://other.invalid/rest/v1/market_score_history',{method:'GET'}],['not-a-url',{method:'GET'}],
 [new Request(origin+'/rest/v1/market_score_history'),{method:'PATCH',body:'private-sentinel'}]];
 for(const [url,init] of cases){const response=await guarded(url,init);assert.equal(response.status,403);const body=await response.text();assert.match(body,/READ_ONLY_PREVIEW/);assert.doesNotMatch(body,/private-sentinel|fixture.invalid/);}
 assert.equal(calls,0);
});
test('real Supabase query builders cannot send mutations in preview',async()=>{
 const requests=[];
 const guarded=createPreviewProtectedFetch(async(input,init)=>{requests.push([String(input),init?.method??'GET']);return new Response('[]',{headers:{'content-type':'application/json'}});},origin,()=>true);
 const db=createClient(origin,'fixture-key',{global:{fetch:guarded},auth:{persistSession:false,autoRefreshToken:false}});
 await db.from('market_score_history').select('*');assert.equal(requests.length,1);requests.splice(0);
 const operations=[
 ()=>db.from('market_score_history').insert({trading_date:'2026-11-17',market_score:41}),
 ()=>db.from('market_score_history').upsert({trading_date:'2026-11-17',market_score:41}),
 ()=>db.from('market_score_history').update({market_score:1}).eq('trading_date','2026-11-17').select('*'),
 ()=>db.from('market_breadth_history').delete().eq('trading_date','2026-11-17'),
 ()=>db.rpc('rewrite_history'),()=>db.rpc('rewrite_history',{}, {get:true}),
 ()=>db.storage.from('test').upload('file.txt','private-sentinel'),
 ];
 for(const operation of operations){const result=await operation();assert.ok(result.error,'Mutation must fail');}
 assert.equal(requests.length,0,'No mutation/RPC/storage request may reach the network');
});
test('disabled guard preserves the original client behavior',async()=>{
 const init={method:'POST',body:'fixture'};let captured;
 const guarded=createPreviewProtectedFetch(async(input,options)=>{captured=options;return new Response('{}');},origin,()=>false);
 assert.equal((await guarded(origin+'/rest/v1/market_score_history',init)).status,200);assert.equal(captured,init);
});
test('preview status follows server flag and is never publicly cached',async()=>{
 const previous=process.env.MAICATRADES_READ_ONLY_PREVIEW;
 try{
  delete process.env.MAICATRADES_READ_ONLY_PREVIEW;assert.equal(isReadOnlyPreview(),false);
  process.env.MAICATRADES_READ_ONLY_PREVIEW='true';assert.equal(isReadOnlyPreview(),true);
  const {GET}=await import('../src/app/api/preview-status/route.ts');
  const response=await GET();assert.equal((await response.json()).readOnlyPreview,true);assert.match(response.headers.get('cache-control'),/no-store/);
  process.env.MAICATRADES_READ_ONLY_PREVIEW='false';assert.equal((await (await GET()).json()).readOnlyPreview,false);
 }finally{if(previous===undefined)delete process.env.MAICATRADES_READ_ONLY_PREVIEW;else process.env.MAICATRADES_READ_ONLY_PREVIEW=previous;}
});
test('Trade Idea preview reads a saved record without quotes, scans, lifecycle repairs or writes',async()=>{
 const previous=process.env.MAICATRADES_READ_ONLY_PREVIEW,originalFetch=globalThis.fetch;
 process.env.MAICATRADES_READ_ONLY_PREVIEW='true';let queries=0;let writes=0;
 let row={id:'fixture',week_key:'2026-11-15',symbol:'TEST',status:'ACTIVE',direction:'LONG',entry_price:100,stop_price:95,target_price:110,
  locked_at:'2026-11-16T00:00:00Z',entry_triggered_at:'2026-11-16T15:00:00Z',target_hit_at:null,stopped_out_at:null,
  idea_snapshot:{symbol:'TEST',direction:'LONG',entry:100,stopLoss:95,target:110,price:101,chart:[]},market_context:{direction:'Neutral'}};
 globalThis.testDatabase={from(){queries++;const chain={select(){return chain;},eq(){return chain;},lt(){return chain;},order(){return chain;},limit(){return chain;},async maybeSingle(){return {data:row,error:null};},update(){writes++;throw Error('Write attempted');},insert(){writes++;throw Error('Write attempted');},upsert(){writes++;throw Error('Write attempted');}};return chain;}};
 globalThis.fetch=()=>{throw Error('Provider must not be contacted');};
 try{
  const {GET}=await import('../src/app/api/trade-idea/route.ts');let response=await GET();let result=await response.json();
  assert.equal(response.status,200);assert.equal(result.success,true);assert.equal(result.idea.price,101);assert.equal(result.weekly.status,'ACTIVE');assert.equal(result.preview.readOnly,true);assert.equal(result.preview.storedRecord,true);assert.equal(queries,1);assert.equal(writes,0);
  row=null;queries=0;result=await (await GET()).json();assert.equal(result.success,false);assert.match(result.error,/no saved Trade Idea/);assert.equal(queries,2);assert.equal(writes,0);
 }finally{globalThis.fetch=originalFetch;if(previous===undefined)delete process.env.MAICATRADES_READ_ONLY_PREVIEW;else process.env.MAICATRADES_READ_ONLY_PREVIEW=previous;}
});
test('the configured admin client is wired to the transport guard',async()=>{
 const names=['NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SECRET_KEY','MAICATRADES_READ_ONLY_PREVIEW'];
 const original=Object.fromEntries(names.map(name=>[name,process.env[name]]));
 const oldFetch=globalThis.fetch;let network=0;
 Object.assign(process.env,{NEXT_PUBLIC_SUPABASE_URL:origin,SUPABASE_SECRET_KEY:'fixture-key',MAICATRADES_READ_ONLY_PREVIEW:'true'});
 globalThis.fetch=async()=>{network++;return new Response('[]',{headers:{'content-type':'application/json'}});};
 try{
  const {supabaseAdmin}=await import('../src/lib/supabase.ts');
  const read=await supabaseAdmin.from('market_score_history').select('*');assert.equal(read.error,null);assert.equal(network,1);network=0;
  const write=await supabaseAdmin.from('market_score_history').update({market_score:1}).eq('trading_date','2026-11-17');assert.ok(write.error);assert.equal(network,0);
 }finally{globalThis.fetch=oldFetch;for(const name of names){if(original[name]===undefined)delete process.env[name];else process.env[name]=original[name];}}
});
