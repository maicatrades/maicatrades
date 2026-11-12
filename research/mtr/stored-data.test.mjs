import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {loadStoredData,storedReader,auditStoredData,requiredSymbols} from './stored-data.mjs';
const bar=(date,close=10)=>({date,open:10,high:12,low:8,close});
function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mtr-stored-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
function write(dir,endpoint,rows){fs.writeFileSync(path.join(dir,`${endpoint}-SPY.json`),JSON.stringify({symbol:'SPY',eodhdSymbol:'SPY.US',endpoint,from:'2026-10-01',to:'2026-10-12',rows}));}
test('stored adapter uses frozen ledger OHLC, rejects conflicting splits and never fetches',async t=>{
 const dir=fixture(t);write(dir,'eod',[bar('2026-10-12')]);write(dir,'splits',[]);
 const ledger={lastSession:'2026-10-12',rawBars:{SPY:{'2026-10-12':bar('2026-10-12',11)}},splits:{SPY:[]}};
 const original=globalThis.fetch;globalThis.fetch=()=>{throw Error('Unexpected network access');};t.after(()=>{globalThis.fetch=original;});
 const store=loadStoredData({cacheDir:dir,ledger}),read=storedReader(store,'2026-10-01','2026-10-12');
 assert.equal((await read('eod','SPY'))[0].close,11);
 assert.deepEqual(await read('splits','SPY'),[]);
 await assert.rejects(read('eod','AAPL'),/missing stored/);
 await assert.rejects(storedReader(store,'2026-10-01','2026-10-13')('eod','SPY'),/split coverage/);
 await assert.rejects(read('eod','SPY','2026-10-13'),/incomplete/);
 write(dir,'splits',[{date:'2026-10-08',split:'2/1'}]);ledger.splits.SPY=[{date:'2026-10-08',split:'3/1'}];
 assert.throws(()=>loadStoredData({cacheDir:dir,ledger}),/split revision/);
});
test('audit requires all 124 symbols for all 55 sessions, including split coverage',()=>{
 const calendar=[];let date=new Date('2026-01-01T12:00:00Z');while(calendar.length<56){if(![0,6].includes(date.getUTCDay()))calendar.push(date.toISOString().slice(0,10));date.setUTCDate(date.getUTCDate()+1);}
 const data=Object.fromEntries(requiredSymbols.map(s=>[s,{rows:calendar.map(d=>bar(d)),splits:[],splitThrough:calendar.at(-1)}]));
 assert.equal(auditStoredData({data}).usableSignalSessions,2);
 data.AAPL.rows.splice(20,1);assert.equal(auditStoredData({data}).usableSignalSessions,0);
});
test('malformed OHLC, duplicate dates and missing split metadata fail closed',t=>{
 const dir=fixture(t);write(dir,'eod',[bar('2026-10-12'),bar('2026-10-12')]);
 assert.throws(()=>loadStoredData({cacheDir:dir}),/duplicate/);
 write(dir,'eod',[{...bar('2026-10-12'),low:11}]);assert.throws(()=>loadStoredData({cacheDir:dir}),/Invalid/);
 write(dir,'eod',[bar('2026-10-12')]);assert.ok(auditStoredData(loadStoredData({cacheDir:dir})).missingSymbols.includes('SPY'));
});
test('real stored scan runs without credentials or network, and stale retry preserves ledger',async t=>{
 const {spawnSync}=await import('node:child_process');const {fileURLToPath,pathToFileURL}=await import('node:url');
 const base=fixture(t),here=path.dirname(fileURLToPath(import.meta.url)),mtr=path.join(base,'research/mtr'),history=path.join(base,'research/historical-reconstruction'),cache=path.join(history,'cache');
 fs.mkdirSync(mtr,{recursive:true});fs.mkdirSync(cache,{recursive:true});
 for(const name of ['run.mjs','schedule.mjs','engine.mjs','stored-data.mjs'])fs.copyFileSync(path.join(here,name),path.join(mtr,name));
 fs.copyFileSync(path.join(here,'../historical-reconstruction/frozen.mjs'),path.join(history,'frozen.mjs'));
 const calendar=[];for(let d=new Date('2026-06-01T12:00:00Z');d<=new Date('2026-10-12T12:00:00Z');d.setUTCDate(d.getUTCDate()+1))if(![0,6].includes(d.getUTCDay()))calendar.push(d.toISOString().slice(0,10));
 for(const symbol of requiredSymbols)for(const endpoint of ['eod','splits'])fs.writeFileSync(path.join(cache,`${endpoint}-${symbol}.json`),JSON.stringify({symbol,eodhdSymbol:`${symbol}.US`,endpoint,from:calendar[0],to:calendar.at(-1),rows:endpoint==='eod'?calendar.map(d=>bar(d)):[]}));
 const mock=path.join(base,'clock.mjs');fs.writeFileSync(mock,`const D=Date;globalThis.Date=class extends D{constructor(...a){super(...(a.length?a:[process.env.TEST_NOW]));}static now(){return D.parse(process.env.TEST_NOW);}};globalThis.fetch=()=>{throw Error('NETWORK_FORBIDDEN');};`);
 const scan=clock=>spawnSync(process.execPath,['--import',pathToFileURL(mock).href,path.join(mtr,'run.mjs'),'scan'],{encoding:'utf8',env:{...process.env,MTR_DATA_SOURCE:'stored',EODHD_API_TOKEN:'',TEST_NOW:clock}});
 let result=scan('2026-10-13T03:00:00Z');assert.equal(result.status,0,result.stderr);
 const ledgerPath=path.join(mtr,'journal/ledger.json'),before=fs.readFileSync(ledgerPath,'utf8');assert.equal(JSON.parse(before).lastSession,'2026-10-12');
 result=scan('2026-10-13T03:00:00Z');assert.equal(result.status,0,result.stderr);assert.equal(fs.readFileSync(ledgerPath,'utf8'),before);
 result=scan('2026-10-14T03:00:00Z');assert.equal(result.status,1);assert.match(result.stderr,/stored split coverage/);assert.equal(fs.readFileSync(ledgerPath,'utf8'),before);
});
