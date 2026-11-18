type Idea = {symbol:string;direction:'LONG'|'SHORT';entry:number;stopLoss:number;target:number};
export function tradePrefillUrl(idea: Idea, status?: string | null) {
  const params = new URLSearchParams({symbol:idea.symbol,direction:idea.direction.toLowerCase(),entry:String(idea.entry),stop:String(idea.stopLoss),target:String(idea.target),status:status??'UNKNOWN'});
  return `/tools/position-size?${params}`;
}
export function parseTradePrefill(params: URLSearchParams) {
  const direction=params.get('direction');
  const symbol=params.get('symbol')??'';
  const entry=Number(params.get('entry')),stop=Number(params.get('stop')),target=Number(params.get('target'));
  if(!/^[A-Z0-9.^-]{1,15}$/.test(symbol)||!['long','short'].includes(direction??'')||
    ![entry,stop,target].every(n=>Number.isFinite(n)&&n>0)||
    (direction==='long'?stop>=entry||target<=entry:stop<=entry||target>=entry))return null;
  return {symbol,direction:direction as 'long'|'short',entry,stop,target,
    status:['WAITING_FOR_ENTRY','ACTIVE','TARGET_HIT','STOPPED_OUT','EXPIRED','NEEDS_REVIEW'].includes(params.get('status')??'')?params.get('status')!:'UNKNOWN'};
}
