import test from "node:test";
import assert from "node:assert/strict";
import { aggregateRthFourHour } from "../src/lib/trade-idea/v2-four-hour-adapter.ts";
import { evaluateV2Candidate, rankV2Candidates } from "../src/lib/trade-idea/v2-scanner.ts";

function session(date="2026-11-20", count=13) {
  const start = Math.floor(Date.parse(date + "T14:30:00Z") / 1000);
  return Array.from({length:count},(_,i)=>({
    timestamp:start+i*1800,endTimestamp:start+(i+1)*1800,
    open:100+i,high:102+i,low:99+i,close:101+i,volume:1000,
  }));
}
test("4h adapter emits 8-bar and 5-bar RTH segments with actual end timestamps",()=>{
  const input=session();
  const r=aggregateRthFourHour(input,input.at(-1).endTimestamp);
  assert.equal(r.bars.length,2);
  assert.equal(r.bars[0].endTimestamp-r.bars[0].timestamp,4*3600);
  assert.equal(r.bars[1].endTimestamp-r.bars[1].timestamp,2.5*3600);
  assert.deepEqual(r.rejectedSessions,[]);
});
test("4h adapter rejects incomplete and duplicate sessions",()=>{
  assert.equal(aggregateRthFourHour(session().slice(0,12),Infinity).bars.length,0);
  assert.equal(aggregateRthFourHour([...session(),session()[0]],Infinity).bars.length,0);
});
test("4h adapter rejects future incomplete close",()=>{
  const bars=session();
  assert.equal(aggregateRthFourHour(bars,bars.at(-1).endTimestamp-1).bars.length,0);
});
function synthetic(){
 const base=1_700_000_000;
 const daily=Array.from({length:45},(_,i)=>({
  timestamp:base+i*86400,endTimestamp:base+(i+1)*86400,
  open:100+i,high:102+i,low:99+i,close:101+i,
 }));
 const fourHour=Array.from({length:45},(_,i)=>({
  timestamp:base+i*14400,endTimestamp:base+(i+1)*14400,
  open:100+i,high:102+i,low:99+i,close:101+i,
 }));
 return {symbol:"TEST",daily,fourHour,averageDailyVolume:2_000_000,
  earningsWithinFiveSessions:false,asOf:base+46*86400};
}
test("scanner fails closed when bar completion time is missing",()=>{
 const input=synthetic(); delete input.fourHour.at(-1).endTimestamp;
 assert.deepEqual(evaluateV2Candidate(input).rejectionReasons,["UNCONFIRMED_CANDLE"]);
});
test("scanner rejects low liquidity and malformed OHLC",()=>{
 const low=synthetic();low.averageDailyVolume=999_999;
 assert.ok(evaluateV2Candidate(low).rejectionReasons.includes("INSUFFICIENT_LIQUIDITY"));
 const malformed=synthetic();malformed.daily[0].low=200;
 assert.deepEqual(evaluateV2Candidate(malformed).rejectionReasons,["INVALID_OR_DUPLICATE_BARS"]);
});
test("candidate ranking is deterministic and capped at three",()=>{
 const base={direction:"LONG",setup:"BREAK_RETEST",entry:100,stop:95,target:110,rewardRisk:2,
  grade:"A",signalBarTime:100,reasons:[],warnings:[],version:"TRADE_IDEA_V2_DRAFT_1"};
 const candidates=["D","B","C","A"].map(symbol=>({...base,symbol,score:90}));
 assert.deepEqual(rankV2Candidates([{candidates,rejectionReasons:[]}]).map(c=>c.symbol),["A","B","C"]);
});
