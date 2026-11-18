import fs from 'node:fs';
import path from 'node:path';
import {planCapture, executeCapture, createCaptureTransport} from './core.mjs';
const mode = process.argv[2] ?? 'plan';
if (!['plan','verify','capture'].includes(mode)) throw Error('Use plan, verify or capture.');
const plan = planCapture();
if (mode === 'plan') {
  console.log(JSON.stringify(plan));
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `phase=${plan.phase}\n`);
} else if (plan.phase === 'skip') console.log(JSON.stringify({status:'skipped', ...plan}));
else {
  const enabled = process.env.CLOSING_CAPTURE_ENABLED === 'true';
  const preview = ['true','1'].includes((process.env.MAICATRADES_READ_ONLY_PREVIEW ?? '').trim().toLowerCase());
  if (mode === 'capture' && (!enabled || preview || plan.phase !== 'capture')) throw Error('Capture disabled, preview enabled or outside the capture window.');
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || new URL(base).protocol !== 'https:') throw Error('Configure the existing Supabase HTTPS URL.');
  const evidence = [];
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = createCaptureTransport({underlyingFetch:nativeFetch, origin:new URL(base).origin, mode, evidence});
  const output = path.resolve('closing-capture-output');
  fs.mkdirSync(output,{recursive:true});
  fs.writeFileSync(path.join(output,'.gitignore'), '*\n');
  let result;
  try {
    const {supabaseAdmin:db} = await import('../../src/lib/supabase.ts');
    async function readPair(date) {
      const [s,b] = await Promise.all(['market_score_history','market_breadth_history'].map(table=>db.from(table).select('*').eq('trading_date',date).limit(1)));
      if (s.error || b.error) throw Error('Closing history read failed.');
      const pair = {score:s.data?.[0] ?? null, breadth:b.data?.[0] ?? null};
      evidence.push({kind:'stored-pair',date,receivedAt:new Date().toISOString(),...pair});
      return pair;
    }
    const call = async modulePath => {
      const {GET} = await import(modulePath);
      const response = await GET();
      if (!response.ok) throw Error('Calculation route failed.');
      const body = await response.json();
      evidence.push({kind:'calculation',route:modulePath.includes('market-breadth')?'breadth':'score',receivedAt:new Date().toISOString(),body});
      return body;
    };
    // No deployed HTTP route is called: fresh provider reads avoid the site's ISR caches.
    result = await executeCapture({mode,enabled,preview,readPair,
      breadth:()=>call('../../src/app/api/market-breadth/route.ts'),
      score:()=>call('../../src/app/api/market-score/route.ts'),
      report:entry=>console.log(JSON.stringify(entry))});
    console.log(JSON.stringify(result));
  } catch {
    result = {status:'failed', date:plan.date, mode};
    console.error('::error::Closing capture/verification failed. Expected finalized score and matching closing breadth are missing or invalid. Review restricted evidence; do not backfill automatically.');
    process.exitCode = 1;
  } finally {
    globalThis.fetch = nativeFetch;
    fs.writeFileSync(path.join(output, 'evidence.json'),JSON.stringify({version:1,recordedAt:new Date().toISOString(),mode,plan,result,evidence},null,2));
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Dashboard closing capture\nSession: ${plan.date}\n\nMode: ${mode}; outcome: ${result.status}.\n\nFailure requires review; no historical repair is performed.\n`);
  }
}
