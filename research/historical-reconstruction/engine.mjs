import * as F from './frozen.mjs';
export const members=Object.values(F.sectorSymbols).flat();
export const symbols=[...new Set(['SPY','QQQ','IWM','RSP','^VIX',...F.SYMBOLS.sectors,...members])];
const pct=(n,d)=>n/d*100;
export function validateBars(rows){
 if(!Array.isArray(rows)||!rows.length)throw Error('Empty or invalid EOD response');
 const seen=new Set();
 for(const r of rows){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||seen.has(r.date))throw Error('Invalid or duplicate date');
  seen.add(r.date);
  for(const k of ['open','high','low','close','adjusted_close'])if(!Number.isFinite(r[k])||r[k]<=0)throw Error(`Invalid ${k} on ${r.date}`);
  if(r.high<r.low||r.high<Math.max(r.open,r.close)||r.low>Math.min(r.open,r.close))throw Error('Invalid OHLC');
  if(!Number.isFinite(r.volume)||r.volume<0)throw Error('Invalid volume');
 }
 return [...rows].sort((a,b)=>a.date.localeCompare(b.date));
}
export function validateSplits(rows){
 if(!Array.isArray(rows))throw Error('Invalid splits response');
 const seen=new Set();
 return rows.map(r=>{
  const parts=String(r.split).split('/').map(Number);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||seen.has(r.date)||parts.length!==2||parts.some(v=>!Number.isFinite(v)||v<=0))throw Error('Invalid split');
  seen.add(r.date);return {date:r.date,ratio:parts[0]/parts[1]};
 });
}
// Normalize only actions that had occurred by the scoring date. No dividends in signals.
export function seriesAt(data,symbol,date,calendar){
 const item=data[symbol];if(!item)return null;
 const sessionDates=new Set(calendar);
 const rows=item.bars.filter(r=>r.date<=date&&sessionDates.has(r.date));
 if(rows.at(-1)?.date!==date||rows.length<50)return null;
 const expected=calendar.filter(d=>d<=date).slice(-50);
 const dates=new Set(rows.slice(-50).map(r=>r.date));
 if(expected.length!==50||expected.some(d=>!dates.has(d)))return null;
 const series=rows.map(r=>{
  const factor=item.splits.filter(s=>s.date>r.date&&s.date<=date).reduce((a,s)=>a*s.ratio,1);
  return r.close/factor;
 });
 return {symbol,series,price:series.at(-1)};
}
export function reconstruct(data,start,end){
 const calendar=data.SPY?.bars.map(r=>r.date);if(!calendar)throw Error('SPY cache required');
 const states=[],quality=[];
 for(const date of calendar.filter(d=>d<=end)){
  const all=Object.fromEntries(symbols.map(s=>[s,seriesAt(data,s,date,calendar)]));
  const missing=symbols.filter(s=>!all[s]);
  if(missing.length){if(date>=start)quality.push({date,status:'excluded',missing});continue;}
  const stocks=members.map(s=>({symbol:s,sector:Object.keys(F.sectorSymbols).find(k=>F.sectorSymbols[k].includes(s)),...all[s]}));
  const advancingPercent=pct(stocks.filter(s=>F.getReturn(s.series,1)>0).length,122);
  const above20Percent=pct(stocks.filter(s=>s.price>F.simpleMovingAverage(s.series,20)).length,122);
  const above50Percent=pct(stocks.filter(s=>s.price>F.simpleMovingAverage(s.series,50)).length,122);
  const positiveSectorPercent=pct(Object.keys(F.sectorSymbols).filter(k=>{
   const group=stocks.filter(s=>s.sector===k);
   return F.round(pct(group.filter(s=>F.getReturn(s.series,1)>0).length,group.length))>50;
  }).length,Object.keys(F.sectorSymbols).length);
  const rspRelativePerformance=F.round(F.getReturn(all.RSP.series,1)-F.getReturn(all.SPY.series,1));
  const breadth=F.calculateBreadthScore({advancingPercent,above20Percent,above50Percent,positiveSectorPercent,rspRelativePerformance});
  const trend=F.calculateTrendScore(all.SPY,all.QQQ),momentum=F.calculateMomentumScore(all.SPY,all.QQQ);
  const sectors=F.calculateSectorScore(F.SYMBOLS.sectors.map(s=>all[s])),volatility=F.calculateVolatilityScore(all['^VIX']);
  const raw=trend.score+momentum.score+sectors.score+volatility.score;
  const adjustment=F.getBreadthAdjustment(F.round(breadth));
  const score=Math.round(Math.min(adjustment.scoreCap,Math.max(0,raw+adjustment.adjustment)));
  const recent=states.slice(-4);
  const priorFive=states.slice(-5);
  const contiguous=recent.length===4&&recent.every((s,i)=>s.trading_date===calendar[calendar.indexOf(date)-4+i]);
  const fiveContiguous=priorFive.length===5&&priorFive.every((s,i)=>s.trading_date===calendar[calendar.indexOf(date)-5+i]);
  states.push({trading_date:date,market_score:score,market_label:F.getMarketLabel(score),breadth_score:F.round(breadth),breadth_label:F.getBreadthLabel(breadth),breadth_band:breadth<50?'Weak':breadth<65?'Mixed':'Healthy',regime:score>=65&&breadth>=55?'RISK ON':score<40||breadth<35?'RISK OFF':'SELECTIVE',score_5d_average:contiguous?F.round(F.average([...recent.map(s=>s.market_score),score])):null,breadth_vs_prior_5d:fiveContiguous?F.round(breadth-F.average(priorFive.map(s=>s.breadth_score))):null,advancing_percent:F.round(advancingPercent),above20_percent:F.round(above20Percent),above50_percent:F.round(above50Percent),positive_sector_percent:F.round(positiveSectorPercent),rsp_relative_performance:F.round(rspRelativePerformance),trend:trend.score,momentum:momentum.score,sector_strength:sectors.score,volatility:volatility.score,raw_score:raw,breadth_adjustment:adjustment.adjustment,score_cap:adjustment.scoreCap,coverage:122,source:'reconstructed_eodhd',universe:'fixed_M122_v2'});
 }
 const selected=states.filter(s=>s.trading_date>=start);
 const outcomes=[];
 for(const s of selected)for(const symbol of ['SPY','QQQ','IWM']){
  const bars=data[symbol].bars;const byDate=new Map(bars.map(b=>[b.date,b]));const index=calendar.indexOf(s.trading_date);
  const row={trading_date:s.trading_date,symbol,market_score:s.market_score,breadth_band:s.breadth_band,regime:s.regime};
  for(const horizon of [5,10,20]){
   const dates=calendar.slice(index,index+horizon+1);const complete=dates.length===horizon+1&&dates.every(d=>d<=end&&byDate.has(d));
   row[`return_${horizon}d`]=complete?F.round((byDate.get(dates.at(-1)).adjusted_close/byDate.get(s.trading_date).adjusted_close-1)*100,4):null;
  }
  outcomes.push(row);
 }
 return {states:selected,outcomes,quality};
}
