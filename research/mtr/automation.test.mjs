import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {packJournal, unpackJournal, seed, runAutomation, remoteClient} from './automate.mjs';
import {pendingSessions, health} from './schedule.mjs';

const temp = t => {const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mtr-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};
test('storage missing-object responses are distinguished from authorization failures',async t=>{
  const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});
  const remote=remoteClient({NEXT_PUBLIC_SUPABASE_URL:'https://example.invalid',SUPABASE_SECRET_KEY:'test'});
  globalThis.fetch=async()=>new Response(JSON.stringify({statusCode:'404',error:'not_found'}),{status:400});
  assert.equal(await remote.readCheckpoint(),null);
  globalThis.fetch=async()=>new Response('{}',{status:403});
  await assert.rejects(remote.readCheckpoint(),/HTTP 403/);
});
function fixture(dir) {
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'ledger.json'),JSON.stringify({lastSession:'2026-10-12',updatedAt:'2026-10-13T03:35:00Z',observations:[{date:'2026-10-12'}],signals:[],rawBars:{SPY:{}},splits:{}}));
  fs.writeFileSync(path.join(dir,'2026-10-12.json'),'{}');
}
function memory(checkpoint) {
  return {checkpoint,status:{state:'success',lastSuccessAt:'2026-10-13T03:36:00Z'},calls:[],
    async readCheckpoint(){return this.checkpoint;},
    async saveCheckpoint(value){this.calls.push('checkpoint');this.checkpoint=value;},
    async readStatus(){return this.status;},
    async writeStatus(value){this.calls.push('status');this.status=value;}};
}

test('checkpoint preserves ledger and archives, rejects interrupted writes and unsafe restore', t=>{
  const base=temp(t),source=path.join(base,'source');fixture(source);
  fs.writeFileSync(path.join(source,'ignored.txt'),'not part of journal');
  const bytes=packJournal(source),dest=path.join(base,'restored');unpackJournal(bytes,dest);
  assert.equal(fs.readFileSync(path.join(dest,'ledger.json'),'utf8'),fs.readFileSync(path.join(source,'ledger.json'),'utf8'));
  assert.deepEqual(fs.readdirSync(dest).sort(),['2026-10-12.json','ledger.json']);
  assert.throws(()=>unpackJournal(bytes,dest),/empty/);
  assert.throws(()=>unpackJournal(gzipSync(JSON.stringify({version:1,files:{'ledger.json':'{}','../escape':'{}'}})),path.join(base,'bad')),/Unsafe/);
  fs.writeFileSync(path.join(source,'ledger.json.tmp'),'{}');assert.throws(()=>packJournal(source),/writer/);
});

test('seed refuses a second initialization and verifies persistence',async t=>{
  const dir=temp(t);fixture(dir);const remote=memory(null);
  await seed(remote,dir);assert.ok(remote.checkpoint);
  await assert.rejects(seed(remote,dir),/already exists/);
});

test('run checkpoints before publish and reports success only after publication',async t=>{
  const base=temp(t),source=path.join(base,'source');fixture(source);const remote=memory(packJournal(source));
  await runAutomation({remote,dir:path.join(base,'runner'),now:()=> '2026-10-15T10:35:00Z',execute:async command=>remote.calls.push(command)});
  assert.deepEqual(remote.calls,['scan','checkpoint','publish','status']);
  assert.equal(remote.status.lastSuccessAt,'2026-10-15T10:35:00Z');
});

for(const failedPhase of ['scan','checkpoint','publish'])test(`${failedPhase} failure preserves last success and does not claim success`,async t=>{
  const base=temp(t),source=path.join(base,'source');fixture(source);const remote=memory(packJournal(source));
  if(failedPhase==='checkpoint')remote.saveCheckpoint=async()=>{throw Error('secret-provider-token');};
  await assert.rejects(runAutomation({remote,dir:path.join(base,'runner'),execute:async command=>{if(command===failedPhase)throw Error('secret-provider-token');}}),new RegExp(failedPhase));
  assert.equal(remote.status.state,'failed');assert.equal(remote.status.lastSuccessAt,'2026-10-13T03:36:00Z');
  assert.ok(!JSON.stringify(remote.status).includes('secret-provider-token'));
});

test('missing cloud journal fails closed instead of starting a new experiment',async t=>{
  const remote=memory(null);let called=false;
  await assert.rejects(runAutomation({remote,dir:path.join(temp(t),'runner'),execute:async()=>{called=true;}}),/restore/);
  assert.equal(called,false);
});

test('publication failure can retry the saved cloud checkpoint on a clean runner',async t=>{
  const base=temp(t),source=path.join(base,'source');fixture(source);const remote=memory(packJournal(source));
  await assert.rejects(runAutomation({remote,dir:path.join(base,'first'),execute:async command=>{if(command==='publish')throw Error('failure');}}));
  await runAutomation({remote,dir:path.join(base,'second'),execute:async()=>{}});
  assert.equal(remote.status.state,'success');
});

test('provider HTTP failure is visible without leaking other provider errors',async t=>{
  const base=temp(t),source=path.join(base,'source');fixture(source);const remote=memory(packJournal(source));
  await assert.rejects(runAutomation({remote,dir:path.join(base,'runner'),execute:async()=>{throw Error('GOOGL splits: HTTP 402');}}),/HTTP 402/);
  assert.match(remote.status.error,/GOOGL splits: HTTP 402/);
});

test('freshness distinguishes unconfigured, failed, stale and successful empty-signal runs',()=>{
  const now=Date.parse('2026-10-15T13:00:00Z');
  assert.equal(health(null,now).state,'unconfigured');
  assert.equal(health({state:'failed'},now).state,'failed');
  assert.equal(health({state:'success',lastSuccessAt:'2026-10-12T00:00:00Z'},now).state,'stale');
  assert.equal(health({state:'success',lastSuccessAt:'2026-10-15T10:36:00Z',lastSession:'2026-10-14'},now).state,'healthy');
});

test('missed sessions are selected once; stale provider results cannot rewind journal',()=>{
  const ledger={lastSession:'2026-10-12',observations:[{date:'2026-10-12'}]};
  assert.deepEqual(pendingSessions(['2026-10-12','2026-10-13','2026-10-14'],ledger),['2026-10-13','2026-10-14']);
  assert.deepEqual(pendingSessions(['2026-10-12'],ledger),[]);
  assert.throws(()=>pendingSessions(['2026-10-09'],ledger),/older/);
});

test('real scanner catches up October 13â€“14, excludes retrospective candidates and safely repeats',t=>{
  const base=temp(t),here=path.dirname(fileURLToPath(import.meta.url)),mtr=path.join(base,'research/mtr');
  fs.mkdirSync(mtr,{recursive:true});fs.mkdirSync(path.join(base,'research/historical-reconstruction'),{recursive:true});
  for(const name of ['run.mjs','schedule.mjs','engine.mjs'])fs.copyFileSync(path.join(here,name),path.join(mtr,name));
  fs.copyFileSync(path.join(here,'../historical-reconstruction/frozen.mjs'),path.join(base,'research/historical-reconstruction/frozen.mjs'));
  const mock=path.join(base,'provider.mjs');
  fs.writeFileSync(mock, `
    const OriginalDate=Date;const clock=process.env.TEST_NOW;
    globalThis.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:[clock]));}static now(){return OriginalDate.parse(clock);}};
    const days=[];for(let d=new OriginalDate('2026-06-01T12:00:00Z');d<=new OriginalDate('2026-10-15T12:00:00Z');d.setUTCDate(d.getUTCDate()+1))if(![0,6].includes(d.getUTCDay()))days.push(d.toISOString().slice(0,10));
    globalThis.fetch=async url=>({ok:true,json:async()=>String(url).includes('/splits/')?[]:days.filter(date=>date>=new URL(url).searchParams.get('from')&&date<=new URL(url).searchParams.get('to')).map(date=>{const close=date==='2026-10-12'?80:date>='2026-10-13'?110:100;return {date,open:close,high:close+1,low:close-1,close,volume:100000};})});
    const originalTimeout=globalThis.setTimeout;globalThis.setTimeout=(fn,ms,...args)=>originalTimeout(fn,ms===250?0:ms,...args);
  `);
  const scan=clock=>{const result=spawnSync(process.execPath,['--import',pathToFileURL(mock).href,path.join(mtr,'run.mjs'),'scan'],{env:{...process.env,EODHD_API_TOKEN:'test',TEST_NOW:clock},encoding:'utf8'});assert.equal(result.status,0,result.stderr);};
  scan('2026-10-13T03:00:00Z'); // October 12, 11 PM ET: original forward observation.
  scan('2026-10-15T14:00:00Z'); // Both missed entry windows have closed.
  const file=path.join(mtr,'journal/ledger.json'),ledger=JSON.parse(fs.readFileSync(file));
  assert.deepEqual(ledger.observations.map(o=>o.date),['2026-10-12','2026-10-13','2026-10-14']);
  const recovered=ledger.observations.find(o=>o.date==='2026-10-13');
  assert.equal(recovered.status,'missed_entry_window');assert.ok(recovered.candidateCount>0);
  assert.equal(recovered.recoveredCandidates.length,recovered.candidateCount);assert.equal(recovered.loggedCount,0);assert.equal(ledger.signals.length,0);
  const before=fs.readFileSync(file,'utf8');scan('2026-10-15T14:00:00Z');assert.equal(fs.readFileSync(file,'utf8'),before);
});



test('failed automated scan checkpoints downloads, restores them on a clean runner, and never publishes failure',async t=>{
 const base=temp(t),source=path.join(base,'source');fixture(source);
 const remote=memory(packJournal(source)),first=path.join(base,'first');
 const staged=JSON.stringify({version:1,from:'2026-01-01',to:'2026-10-13',entries:{'splits:SPY':[]}});
 await assert.rejects(runAutomation({remote,dir:first,execute:async command=>{
   assert.equal(command,'scan');fs.writeFileSync(path.join(first,'download-cache.json'),staged);throw Error('CSCO eod: HTTP 402');
 }}),/HTTP 402/);
 assert.deepEqual(remote.calls,['checkpoint','status']);
 const second=path.join(base,'second');
 await runAutomation({remote,dir:second,execute:async command=>{
  if(command==='scan')assert.equal(fs.readFileSync(path.join(second,'download-cache.json'),'utf8'),staged);
 }});
 assert.equal(remote.status.state,'success');
});

test('real scanner resumes after 402, refreshes unfinished SPY data, and skips requests after success',t=>{
 const base=temp(t),here=path.dirname(fileURLToPath(import.meta.url)),mtr=path.join(base,'research/mtr');
 fs.mkdirSync(mtr,{recursive:true});fs.mkdirSync(path.join(base,'research/historical-reconstruction'),{recursive:true});
 for(const name of ['run.mjs','schedule.mjs','engine.mjs'])fs.copyFileSync(path.join(here,name),path.join(mtr,name));
 fs.copyFileSync(path.join(here,'../historical-reconstruction/frozen.mjs'),path.join(base,'research/historical-reconstruction/frozen.mjs'));
 const mock=path.join(base,'provider.mjs'),calls=path.join(base,'calls.jsonl');
 fs.writeFileSync(mock,`
 import fs from 'node:fs';
 const D=Date,clock=process.env.TEST_NOW;
 globalThis.Date=class extends D{constructor(...a){super(...(a.length?a:[clock]));}static now(){return D.parse(clock);}};
 const days=[];for(let d=new D('2026-04-01T12:00:00Z');d<=new D('2026-10-19T12:00:00Z');d.setUTCDate(d.getUTCDate()+1))if(![0,6].includes(d.getUTCDay()))days.push(d.toISOString().slice(0,10));
 globalThis.fetch=async url=>{
 const u=new URL(url),parts=u.pathname.split('/'),endpoint=parts[2],symbol=parts[3];
 fs.appendFileSync(process.env.CALLS,JSON.stringify({endpoint,symbol})+'\\n'.replace('\\\\n','\\n'));
 if(process.env.FAIL==='yes'&&endpoint==='eod'&&symbol==='RSP.US')return {ok:false,status:402};
 const rows=endpoint==='splits'?[]:days.filter(date=>date>=u.searchParams.get('from')&&date<=u.searchParams.get('to')&&(!process.env.STALE||date<'2026-10-16')).map(date=>({date,open:100,high:101,low:99,close:100,volume:100000}));
 return {ok:true,json:async()=>rows};};
 const timeout=setTimeout;globalThis.setTimeout=(f,ms,...a)=>timeout(f,ms===250?0:ms,...a);
 `);
 const readCalls=()=>fs.existsSync(calls)?fs.readFileSync(calls,'utf8').trim().split('\n').filter(Boolean).map(x=>JSON.parse(x)):[];
 const scan=(clock,fail='',stale='')=>spawnSync(process.execPath,['--import',pathToFileURL(mock).href,path.join(mtr,'run.mjs'),'scan'],{env:{...process.env,EODHD_API_TOKEN:'fake-secret',TEST_NOW:clock,CALLS:calls,FAIL:fail,STALE:stale},encoding:'utf8'});
 let result=scan('2026-10-19T12:00:00Z','yes','yes');assert.equal(result.status,1);assert.match(result.stderr,/HTTP 402/);
 const cacheFile=path.join(mtr,'journal/download-cache.json');
 assert.ok(fs.existsSync(cacheFile));assert.ok(!fs.readFileSync(cacheFile,'utf8').includes('fake-secret'));
 assert.ok(!fs.existsSync(path.join(mtr,'journal/ledger.json')));
 const before=readCalls().length;
 result=scan('2026-10-19T12:00:00Z');assert.equal(result.status,0,result.stderr);
 const retry=readCalls().slice(before);
 assert.equal(retry.filter(c=>c.symbol==='SPY.US'&&c.endpoint==='eod').length,1,'stale SPY must refresh');
 assert.equal(retry.filter(c=>c.symbol==='SPY.US'&&c.endpoint==='splits').length,0,'completed split request reused');
 const ledger=fs.readFileSync(path.join(mtr,'journal/ledger.json'),'utf8');
 assert.equal(JSON.parse(ledger).lastSession,'2026-10-16');
 const count=readCalls().length;
 result=scan('2026-10-19T13:00:00Z');assert.equal(result.status,0,result.stderr);
 assert.equal(readCalls().length,count,'completed morning scan makes no requests');
 assert.equal(fs.readFileSync(path.join(mtr,'journal/ledger.json'),'utf8'),ledger);
 result=scan('2026-10-20T03:00:00Z');assert.equal(result.status,0,result.stderr);
 assert.ok(readCalls().length>count,'new completed date must fetch fresh data');
 assert.equal(JSON.parse(fs.readFileSync(path.join(mtr,'journal/ledger.json'))).lastSession,'2026-10-19');
});
