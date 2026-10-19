// Frozen hypothesis 9. Change the version when changing any rule.
export const RULES = Object.freeze({ version: 'MTR-1', partialVersion: 'MTR-1-P', supportSessions: 20, stopSessions: 5, stopBuffer: .001, breadthMinimum: 5, targetR: 2, holdingSessions: 20, roundTripCost: .001 });
export const ACCOUNT = Object.freeze({initialCash:1000,riskFraction:.01,maxPositions:3,wholeShares:true,order:'alphabetical'});
// Conservative weekday gate: an exchange holiday may cause a missed signal,
// but missing provider sessions can never make an old signal look prospective.
export function entryWindowOpen(signalDate, now) {
 const next=new Date(`${signalDate}T12:00:00Z`);do{next.setUTCDate(next.getUTCDate()+1);}while([0,6].includes(next.getUTCDay()));
 const entryDate=next.toISOString().slice(0,10);
 return now.date<entryDate||(now.date===entryDate&&(now.hour<9||(now.hour===9&&now.minute<30)));
}
export function signal(symbol, bars, calendar, breadth) {
 const dates=calendar.slice(-22), rows=dates.map(d=>bars.find(b=>b.date===d));
 if(rows.length!==22||rows.some(b=>!b))throw Error(`${symbol}: missing signal sessions`);
 const six=calendar.slice(-6); if(six.some(d=>!Number.isFinite(breadth[d])))throw Error('Missing breadth session');
 const change=Number((breadth[six.at(-1)]-breadth[six[0]]).toFixed(2));
 const support=Math.min(...rows.slice(0,20).map(b=>b.low));
 if(rows[20].close>=support||rows[21].close<=support||change<5)return null;
 return {id:`${symbol}:${dates.at(-1)}:MTR-1`,symbol,signalDate:dates.at(-1),support,stop:Math.min(...rows.slice(-5).map(b=>b.low))*.999,breadthChange:change,ruleVersion:RULES.version};
}
export function startTrade(s, bar, partial=false) {
 if(bar.open<=s.stop)return {status:'skipped_stop',entryDate:bar.date};
 return {status:'open',entryDate:bar.date,entry:bar.open,stop:s.stop,initialStop:s.stop,target:bar.open+2*(bar.open-s.stop),risk:bar.open-s.stop,sessions:0,remaining:1,gross:0,partial,legs:[],lastDate:null,netR:null};
}
export function advance(t, b) {
 if(t.status!=='open'||t.lastDate===b.date)return t;
 t=structuredClone(t);t.sessions++;t.lastDate=b.date;
 // Partial-target protection begins on the FOLLOWING session.
 if(t.breakevenAfter&&b.date>t.breakevenAfter)t.stop=t.entry;
 const fill=(price,fraction,reason)=>{t.gross+=(price-t.entry)*fraction;t.remaining-=fraction;t.legs.push({date:b.date,price,fraction,reason});if(t.remaining<=0){t.status='closed';t.exitDate=b.date;t.netR=(t.gross-t.entry*.001)/t.risk;}};
 if(b.open<=t.stop)fill(b.open,t.remaining,'gap_stop');
 else if(t.remaining===1&&b.open>=t.target){fill(b.open,t.partial?.5:1,'gap_target');if(t.partial)t.breakevenAfter=b.date;}
 // A known opening target fill comes before an intraday stop; otherwise stop wins ambiguity.
 if(t.status==='open'&&b.low<=t.stop)fill(t.stop,t.remaining,'stop');
 else if(t.status==='open'&&t.remaining===1&&b.high>=t.target){fill(t.target,t.partial?.5:1,'target');if(t.partial)t.breakevenAfter=b.date;}
 if(t.status==='open'&&t.sessions>=20)fill(b.close,t.remaining,'time');
 return t;
}
export function metrics(trades) {
 const done=trades.filter(t=>t.status==='closed'),v=done.map(t=>t.netR),wins=v.filter(x=>x>0).reduce((a,b)=>a+b,0),loss=-v.filter(x=>x<0).reduce((a,b)=>a+b,0);
 let equity=0,peak=0,drawdown=0,streak=0,maxLosingStreak=0;
 for(const t of [...done].sort((a,b)=>a.exitDate.localeCompare(b.exitDate))){equity+=t.netR;peak=Math.max(peak,equity);drawdown=Math.max(drawdown,peak-equity);streak=t.netR<0?streak+1:0;maxLosingStreak=Math.max(streak,maxLosingStreak);}
 return {completed:done.length,averageNetR:v.length?v.reduce((a,b)=>a+b,0)/v.length:null,profitFactor:loss?wins/loss:null,drawdownR:drawdown,maxLosingStreak};
}
// The account is a separate experiment. Every signal still has paired research trades.
export function simulateAccount(signals, calendar, data, partial=false) {
 let cash=1000,peak=1000,maxDrawdown=0;const positions=[],history=[];
 for(const date of calendar){
  // Buying power at the open excludes proceeds from exits later in today's bar.
  const pending=signals.filter(s=>calendar[calendar.indexOf(s.signalDate)+1]===date).sort((a,b)=>a.symbol.localeCompare(b.symbol));
  const openEquity=cash+positions.reduce((n,p)=>n+p.trade.remaining*p.shares*data[p.symbol].find(b=>b.date===date).open,0);
  for(const s of pending){const b=data[s.symbol].find(b=>b.date===date);if(!b)throw Error('Account price coverage missing');
   const t=startTrade(s,b,partial);let reason=t.status==='skipped_stop'?'open_at_or_below_stop':positions.some(p=>p.symbol===s.symbol)?'symbol_already_open':positions.length>=3?'position_limit':null;
   const shares=t.status==='open'?Math.floor(Math.min(openEquity*.01/t.risk,cash/(t.entry*1.001))):0;
   if(!reason&&shares<1)reason='buying_power_or_risk';
   if(reason){history.push({signalId:s.id,status:'skipped',reason});continue;}
   cash-=shares*t.entry*1.001;positions.push({symbol:s.symbol,signalId:s.id,shares,trade:t});
  }
  for(let i=positions.length-1;i>=0;i--){const p=positions[i],b=data[p.symbol].find(b=>b.date===date);if(!b)throw Error('Account price coverage missing');const old=p.trade.legs.length;p.trade=advance(p.trade,b);for(const leg of p.trade.legs.slice(old))cash+=leg.price*leg.fraction*p.shares;if(p.trade.status==='closed'){history.push({...p,status:'closed'});positions.splice(i,1);}}
  const equity=cash+positions.reduce((n,p)=>n+p.trade.remaining*p.shares*data[p.symbol].find(b=>b.date===date).close,0);peak=Math.max(peak,equity);maxDrawdown=Math.max(maxDrawdown,peak-equity);
 }
 const equity=cash+positions.reduce((n,p)=>n+p.trade.remaining*p.shares*data[p.symbol].at(-1).close,0);
 return {assumptions:ACCOUNT,cash,equity,maxDrawdown,openPositions:positions.length,history};
}
