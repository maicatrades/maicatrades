import test from 'node:test';
import assert from 'node:assert/strict';
import {signal,startTrade,advance,simulateAccount,entryWindowOpen} from './engine.mjs';
test('entry-window gate excludes stale signals even on weekends',()=>{
 assert.equal(entryWindowOpen('2026-10-09',{date:'2026-10-12',hour:9,minute:29}),true);
 assert.equal(entryWindowOpen('2026-10-09',{date:'2026-10-12',hour:9,minute:30}),false);
 assert.equal(entryWindowOpen('2026-10-08',{date:'2026-10-11',hour:8,minute:0}),false);
});
const bars=()=>Array.from({length:50},(_,i)=>({date:`2026-01-${String(i+1).padStart(2,'0')}`,open:100,high:101,low:99,close:100}));
test('frozen support excludes breakdown/recovery bars; strict closes and exact breadth offset',()=>{
 const b=bars().slice(0,22);b[20]={...b[20],low:96,close:97};b[21]={...b[21],close:100};const cal=b.map(x=>x.date),breadth=Object.fromEntries(cal.slice(-6).map((d,i)=>[d,50+i]));
 const s=signal('TEST',b,cal,breadth);assert.equal(s.support,99);assert.equal(s.stop,96*.999);assert.equal(s.breadthChange,5);
 b[20].close=99;assert.equal(signal('TEST',b,cal,breadth),null);b[20].close=97;b[21].close=99;assert.equal(signal('TEST',b,cal,breadth),null);
 b[21].close=100;delete breadth[cal.at(-3)];assert.throws(()=>signal('TEST',b,cal,breadth));
});
test('stop takes priority for ambiguous intraday bars; opening gaps use open',()=>{
 const t=startTrade({stop:98},{date:'a',open:100});assert.equal(advance(t,{date:'a',open:100,high:110,low:90,close:105}).legs[0].price,98);
 assert.equal(advance(t,{date:'a',open:95,high:110,low:90,close:105}).legs[0].price,95);
 const gap=advance(t,{date:'a',open:108,high:110,low:90,close:100});assert.equal(gap.legs[0].price,108);assert.ok(gap.netR>2);
 assert.equal(startTrade({stop:100},{date:'a',open:100}).status,'skipped_stop');
});
test('partial protection starts next session, with original stop retained on target day',()=>{
 let t=startTrade({stop:98},{date:'a',open:100},true);t=advance(t,{date:'a',open:100,high:105,low:99,close:101});assert.equal(t.remaining,.5);assert.equal(t.stop,98);
 const next=advance(t,{date:'b',open:99,high:102,low:98,close:101});assert.equal(next.legs[1].price,99);assert.equal(next.legs[1].reason,'gap_stop');assert.equal(next.status,'closed');assert.equal(next.netR,.7);
 assert.deepEqual(advance(t,{date:'a',open:100,high:105,low:99,close:101}),t);
});
test('partial opening gap target followed by original stop is modeled in known order',()=>{
 const t=advance(startTrade({stop:98},{date:'a',open:100},true),{date:'b',open:106,high:107,low:97,close:99});assert.equal(t.legs.length,2);assert.equal(t.legs[0].fraction,.5);assert.equal(t.legs[1].price,98);
});
test('20-session deadline includes entry, costs deducted once',()=>{
 let t=startTrade({stop:98},{date:'00',open:100});for(let i=0;i<20;i++)t=advance(t,{date:String(i).padStart(2,'0'),open:100,high:101,low:99,close:100});assert.equal(t.status,'closed');assert.equal(t.sessions,20);assert.equal(t.netR,-.05);
});
test('account obeys fixed risk and buying power and keeps independent experiment',()=>{
 const b=bars().slice(0,3),cal=b.map(x=>x.date),s={id:'a',symbol:'TEST',signalDate:cal[0],stop:98};const a=simulateAccount([s],cal,{TEST:b});assert.equal(a.openPositions,1);assert.ok(Math.abs(a.cash-499.5)<1e-8);assert.ok(Math.abs(a.equity-999.5)<1e-8);
});
