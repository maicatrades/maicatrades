import {marketSession, isTradingDate} from '../../src/lib/market-session.ts';

const valid = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
export function closeInstant(date) {
  if (!isTradingDate(date)) throw Error('Unsupported or non-trading session.');
  const noon = new Date(`${date}T17:00:00Z`);
  const session = marketSession(noon);
  return new Date(noon.getTime() + (session.closeMinutes - session.minutes) * 60000);
}
export function planCapture(now = new Date()) {
  const session = marketSession(now);
  if (!Number.isFinite(now.valueOf()) || Number(session.tradingDate.slice(0,4)) < 2025 || Number(session.tradingDate.slice(0,4)) > 2028)
    throw Error('Exchange calendar requires renewal.');
  if (session.minutes < 570) return {phase:'verify', date:session.completedDate};
  if (!session.isTradingDay) return {phase:'skip', date:null};
  const elapsed = session.minutes - session.closeMinutes;
  if (elapsed < 10) return {phase:'skip', date:session.tradingDate};
  return {phase:elapsed < 100 ? 'capture' : 'verify', date:session.tradingDate};
}
export function finalPairProblem(score, breadth, date, now = new Date()) {
  const close = closeInstant(date).valueOf();
  if (!score || score.trading_date !== date || score.snapshot_status !== 'final') return 'Missing finalized score';
  if (!valid(score.market_score) || !valid(score.raw_score)) return 'Invalid finalized score';
  if (!breadth || breadth.trading_date !== date || !valid(breadth.breadth_score)) return 'Missing valid breadth';
  const stamp = value => typeof value === 'string' && /T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? Date.parse(value) : NaN;
  for (const value of [score.captured_at, score.breadth_updated_at, breadth.updated_at]) {
    const time = stamp(value);
    if (!Number.isFinite(time) || time < close || time > now.valueOf() + 60000) return 'Missing or invalid closing provenance';
  }
  if (stamp(score.captured_at) < stamp(score.breadth_updated_at)) return 'Score predates its breadth input';
  if (score.breadth_trading_date !== date || !valid(score.breadth_score) || score.breadth_score !== breadth.breadth_score || stamp(score.breadth_updated_at) !== stamp(breadth.updated_at))
    return 'Score and saved breadth snapshots differ';
  return null;
}
export async function executeCapture({mode, now = () => new Date(), enabled = false, preview = false, readPair, breadth, score, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), report = () => {}}) {
  if (!['capture','verify'].includes(mode)) throw Error('Invalid execution mode.');
  if (mode === 'capture' && (!enabled || preview)) throw Error('Capture requires explicit enablement and preview must be off.');
  const plan = planCapture(now());
  if (plan.phase === 'skip') return {status:'skipped', ...plan};
  if (mode === 'capture' && plan.phase !== 'capture') throw Error('Outside the closing capture window; use verify.');
  const date = plan.date;
  if (!date) throw Error('No completed session.');
  let problem = 'Missing finalized score';
  const attempts = mode === 'capture' ? 3 : 1;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (attempt > 1) await sleep(10000 * (attempt - 1));
    if (mode === 'capture') {
      const current = planCapture(now());
      if (current.phase !== 'capture' || current.date !== date) throw Error('Capture window expired.');
    }
    let stage = 'history-read';
    try {
      const pair = await readPair(date);
      problem = finalPairProblem(pair.score, pair.breadth, date, now());
      if (!problem) return {status:attempt === 1 ? 'already-final' : 'verified', date, attempts:attempt};
      if (mode === 'verify') break;
      // An existing final is never recomputed or replaced to make this check pass.
      if (pair.score?.snapshot_status === 'final') {stage = 'existing-final-provenance'; throw Error('Existing final needs provenance review.');}
      stage = 'breadth-calculation';
      const b = await breadth();
      if (!b?.success || b.tradingDate !== date || b.coverage?.returned !== 122 || b.coverage?.failed !== 0 || b.coverage?.partialData || !valid(b.breadthScore))
        throw Error('Breadth incomplete or stale.');
      // Check persistence: an HTTP success alone is not a successful capture.
      stage = 'breadth-persistence';
      const savedBreadth = (await readPair(date)).breadth;
      if (!savedBreadth || savedBreadth.trading_date !== date || !valid(savedBreadth.breadth_score) || !Number.isFinite(Date.parse(savedBreadth.updated_at)) || Date.parse(savedBreadth.updated_at) < closeInstant(date).valueOf())
        throw Error('Closing breadth was not persisted.');
      stage = 'score-calculation';
      const s = await score();
      if (!s?.success || s.scoreAsOf !== date || s.snapshotStatus !== 'final' || s.isFallback || !valid(s.score))
        throw Error('Score not finalized for the expected session.');
      stage = 'final-verification';
      const saved = await readPair(date);
      problem = finalPairProblem(saved.score, saved.breadth, date, now());
      if (!problem) return {status:'captured', date, attempts:attempt};
    } catch {
      // Deliberately suppress provider/DB exception bodies and credentials.
      problem = `Failed at ${stage}; inspect calculation evidence`;
    }
    report({attempt, date, problem});
  }
  throw Error(`Closing session ${date}: ${problem}. No historical repair was attempted.`);
}

export function createCaptureTransport({underlyingFetch, origin, mode, evidence, now = () => new Date()}) {
  return async (input, init = {}) => {
    const request = input instanceof Request ? input : null;
    const url = new URL(request?.url ?? String(input));
    const method = (init.method ?? request?.method ?? 'GET').toUpperCase();
    const table = url.pathname.match(/^\/rest\/v1\/(market_score_history|market_breadth_history)$/);
    const database = url.origin === origin && table;
    const read = database && ['GET','HEAD'].includes(method);
    const write = database && mode === 'capture' && ['POST','PATCH'].includes(method);
    const provider = mode === 'capture' && method === 'GET' && url.protocol === 'https:' && ['query1.finance.yahoo.com','query2.finance.yahoo.com'].includes(url.hostname) && url.pathname.startsWith('/v8/finance/chart/');
    if (!(read || write || provider)) throw Error('Closing-capture transport refused an operation.');
    if (write) {
      if (planCapture(now()).phase !== 'capture') throw Error('Write window expired.');
      const text = init.body;
      if (typeof text !== 'string') throw Error('Unsupported write body.');
      const row = JSON.parse(text);
      if (Array.isArray(row) || row.trading_date !== planCapture(now()).date) throw Error('Historical write refused.');
      if (method === 'POST' && (url.searchParams.get('on_conflict') !== 'trading_date' || !String(new Headers(init.headers).get('prefer')).includes('resolution=ignore-duplicates')))
        throw Error('Unconditional insert refused.');
      if (method === 'PATCH' && (url.searchParams.get('trading_date') !== `eq.${row.trading_date}` ||
        (table[1] === 'market_score_history' ? url.searchParams.get('snapshot_status') !== 'eq.intraday' : url.searchParams.get('updated_at') !== `lt.${closeInstant(row.trading_date).toISOString()}`)))
        throw Error('Unconditional update refused.');
    }
    const response = await underlyingFetch(input, {...init, redirect:'error', signal:init.signal ? AbortSignal.any([init.signal,AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000)});
    if (provider) {
      const body = await response.clone().json().catch(() => null);
      evidence.push({kind:'provider', symbol:decodeURIComponent(url.pathname.split('/').at(-1)), range:url.searchParams.get('range'), receivedAt:now().toISOString(), status:response.status, body});
    }
    return response;
  };
}
