// Offline parity check; inputs are extracted locally, never added to forward log.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {signal,startTrade,advance} from './engine.mjs';
const [cachePath,statesPath,originalPath]=process.argv.slice(2);
if(!originalPath)throw Error('Usage: node regression.mjs cache-items.json states.csv original-trades.json');
const items=JSON.parse(fs.readFileSync(cachePath,'utf8')),data={};
for(const x of items){data[x.symbol]??={};data[x.symbol][x.endpoint]=x.rows;}
const lines=fs.readFileSync(statesPath,'utf8').trim().split(/\r?\n/),keys=lines.shift().split(','),breadth={};
for(const line of lines){const values=line.split(',').map(s=>s.replace(/^"|"$/g,''));breadth[values[keys.indexOf('trading_date')]]=Number(values[keys.indexOf('breadth_score')]);}
const original=JSON.parse(fs.readFileSync(originalPath,'utf8')).filter(t=>t.filter==='Breadth improving +5');
const excluded=new Set(['SPY','QQQ','IWM','RSP','^VIX','XLK','XLC','XLY','XLF','XLI','XLE','XLV','XLP','XLU','XLRE','XLB']),cal=data.SPY.eod.map(b=>b.date),actual=[];
for(const symbol of Object.keys(data).filter(s=>!excluded.has(s)).sort()){
 const by=new Map(data[symbol].eod.map(b=>[b.date,b]));const b=cal.map(d=>{const row={...by.get(d)};let f=1;for(const action of data[symbol].splits)if(action.date>d){const [n,den]=action.split.split('/').map(Number);f*=n/den;}for(const k of ['open','high','low','close'])row[k]/=f;return row;});let last=-1;
 for(let i=21;i+20<cal.length;i++){
  if(i+1<=last||cal.slice(i-5,i+1).some(d=>!Number.isFinite(breadth[d])))continue;
  const s=signal(symbol,b.slice(0,i+1),cal.slice(0,i+1),breadth);if(!s)continue;
  let t=startTrade(s,b[i+1]);if(t.status!=='open')continue;for(let j=i+1;j<=i+20;j++){t=advance(t,b[j]);if(t.status==='closed'){last=j;break;}}
  actual.push({symbol,signal_date:cal[i],net_R:t.netR,entry:t.entry,stop:s.stop,target:t.target,exit_date:t.exitDate});
 }
}
assert.equal(actual.length,original.length);
const expected=new Map(original.map(t=>[`${t.symbol}:${t.signal_date}`,t]));
for(const row of actual){const e=expected.get(`${row.symbol}:${row.signal_date}`);assert.ok(e,`Unexpected ${row.symbol} ${row.signal_date}`);assert.equal(row.exit_date,e.exit_date);for(const k of ['entry','stop','target','net_R'])assert.ok(Math.abs(row[k]-Number(e[k]))<1e-8,`${row.symbol} ${row.signal_date}: ${k}`);}
console.log(`Matched all ${actual.length} breadth-filtered historical trades: entry, stop, target, exit date and net R.`);
