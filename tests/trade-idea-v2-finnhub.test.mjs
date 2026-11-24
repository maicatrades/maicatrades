import test from "node:test";
import assert from "node:assert/strict";
import { fetchFinnhubV2Candles } from "../src/lib/trade-idea/v2-finnhub.ts";
const base={symbol:"AAPL",resolution:"30",from:1700000000,to:1700003600,apiKey:"TEST"};
const mock=(status,payload)=>async()=>({status,ok:status>=200&&status<300,json:async()=>payload});
test("Finnhub adapter parses and sorts 30m candles",async()=>{
 const r=await fetchFinnhubV2Candles({...base,fetcher:mock(200,{
  s:"ok",t:[1700001800,1700000000],o:[11,10],h:[12,11],l:[10,9],c:[11,10],v:[100,200]})});
 assert.equal(r.ok,true);if(r.ok){assert.equal(r.bars[0].timestamp,1700000000);
 assert.equal(r.bars[0].endTimestamp,1700001800);}
});
test("Finnhub adapter explicitly handles no_data and denied access",async()=>{
 const empty=await fetchFinnhubV2Candles({...base,fetcher:mock(200,{s:"no_data"})});
 assert.equal(empty.ok,false);if(!empty.ok)assert.equal(empty.code,"NO_DATA");
 const denied=await fetchFinnhubV2Candles({...base,fetcher:mock(403,{})});
 assert.equal(denied.ok,false);if(!denied.ok)assert.equal(denied.code,"ACCESS_DENIED");
});
test("Finnhub adapter rejects malformed candle payload",async()=>{
 const r=await fetchFinnhubV2Candles({...base,fetcher:mock(200,{
 s:"ok",t:[1700000000],o:[10],h:[],l:[9],c:[10],v:[100]})});
 assert.equal(r.ok,false);if(!r.ok)assert.equal(r.code,"INVALID_RESPONSE");
});
test("Finnhub adapter limits intraday request span",async()=>{
 const r=await fetchFinnhubV2Candles({...base,to:base.from+31*86400,fetcher:mock(200,{})});
 assert.equal(r.ok,false);if(!r.ok)assert.equal(r.code,"INVALID_RESPONSE");
});
