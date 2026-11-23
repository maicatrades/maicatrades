import test from "node:test";
import assert from "node:assert/strict";
import { prepareAndEvaluateV2 } from "../src/lib/trade-idea/v2-prepare.ts";

function session(day, price=100) {
 const start=Date.parse(day+"T14:30:00Z")/1000;
 return Array.from({length:13},(_,i)=>({
  timestamp:start+i*1800,endTimestamp:start+(i+1)*1800,
  open:price,high:price+1,low:price-1,close:price,volume:100_000,
 }));
}
test("V2 preparation never treats an unfinished daily session as confirmed",()=>{
 const thirtyMinute=session("2026-11-20");
 const daily=[{timestamp:Date.parse("2026-11-20T00:00:00Z")/1000,
  open:100,high:101,low:99,close:100,volume:2_000_000}];
 const beforeClose=prepareAndEvaluateV2({symbol:"AAPL",daily,thirtyMinute,
  asOf:Date.parse("2026-11-20T19:00:00Z")/1000,earningsWithinFiveSessions:null});
 assert.equal(beforeClose.completedDaily,0);
 assert.equal(beforeClose.completedFourHour,0);
 const afterClose=prepareAndEvaluateV2({symbol:"AAPL",daily,thirtyMinute,
  asOf:Date.parse("2026-11-20T21:01:00Z")/1000,earningsWithinFiveSessions:null});
 assert.equal(afterClose.completedDaily,1);
 assert.equal(afterClose.completedFourHour,2);
});
test("V2 preparation excludes daily candles without matching complete intraday session",()=>{
 const daily=[{timestamp:Date.parse("2026-11-19T00:00:00Z")/1000,
  open:100,high:101,low:99,close:100,volume:2_000_000}];
 const r=prepareAndEvaluateV2({symbol:"AAPL",daily,thirtyMinute:session("2026-11-20"),
  asOf:Date.parse("2026-11-20T22:00:00Z")/1000,earningsWithinFiveSessions:false});
 assert.equal(r.completedDaily,0);
 assert.ok(r.evaluation.rejectionReasons.includes("INSUFFICIENT_HISTORY"));
});
