import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {gzipSync, gunzipSync} from 'node:zlib';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const objectPath = 'mtr-journal/checkpoint.json.gz';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');

export function packJournal(dir) {
  if (fs.existsSync(path.join(dir, 'run.lock')) || fs.existsSync(path.join(dir, 'ledger.json.tmp')))
    throw Error('Journal has an active or interrupted writer. Resolve it before checkpointing.');
  const files = {};
  for (const name of fs.readdirSync(dir).sort()) {
    if (/^(ledger|download-cache|\d{4}-\d{2}-\d{2})\.json$/.test(name))
      files[name] = fs.readFileSync(path.join(dir, name), 'utf8');
  }
  validateBundle({version: 1, files});
  return gzipSync(JSON.stringify({version: 1, files}));
}

function validateBundle(bundle) {
  if (bundle.version !== 1 || !bundle.files?.['ledger.json']) throw Error('Invalid checkpoint.');
  for (const [name, value] of Object.entries(bundle.files)) {
    if (!/^(ledger|download-cache|\d{4}-\d{2}-\d{2})\.json$/.test(name) || typeof value !== 'string') throw Error('Unsafe checkpoint file.');
    JSON.parse(value);
  }
  const ledger = JSON.parse(bundle.files['ledger.json']);
  if (!ledger.lastSession || !Array.isArray(ledger.observations) || !Array.isArray(ledger.signals) || !ledger.rawBars?.SPY || !ledger.splits)
    throw Error('Incomplete journal; refusing to initialize or reset research.');
  if (!ledger.observations.some(o => o.date === ledger.lastSession) || !bundle.files[`${ledger.lastSession}.json`])
    throw Error('Checkpoint is missing the latest frozen session.');
  return ledger;
}

export function unpackJournal(buffer, dir) {
  const bundle = JSON.parse(gunzipSync(buffer, {maxOutputLength: 1024 * 1024 * 1024}));
  validateBundle(bundle);
  fs.mkdirSync(dir, {recursive: true});
  // A cloud runner must start empty; never overwrite an unsaved local journal.
  if (fs.readdirSync(dir).length) throw Error('Restore requires an empty journal directory.');
  for (const [name, value] of Object.entries(bundle.files)) fs.writeFileSync(path.join(dir, name), value, {flag: 'wx'});
}

export function remoteClient(env = process.env) {
  const base = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SECRET_KEY;
  if (!base || !key) throw Error('Supabase credentials missing.');
  if (new URL(base).protocol !== 'https:') throw Error('Supabase must use HTTPS.');
  const headers = {apikey: key, ...(key.startsWith('sb_secret_') ? {} : {Authorization: `Bearer ${key}`})};
  async function request(route, options = {}, allowMissing = false) {
    let response;
    try { response = await fetch(`${base.replace(/\/$/, '')}${route}`, { ...options, headers: {...headers, ...options.headers}, signal: AbortSignal.timeout(60000), redirect: 'error'}); }
    catch { throw Error('Supabase request failed.'); }
    if (allowMissing && response.status === 404) return null;
    if (allowMissing && response.status === 400) {
      const body = await response.clone().json().catch(() => ({}));
      if (String(body.statusCode) === '404' || body.error === 'not_found' || body.code === 'NoSuchKey') return null;
    }
    if (!response.ok) throw Error(`Supabase operation failed (HTTP ${response.status}).`);
    return response;
  }
  return {
    async readCheckpoint() {
      const response = await request(`/storage/v1/object/authenticated/${objectPath}`, {}, true);
      return response ? Buffer.from(await response.arrayBuffer()) : null;
    },
    async saveCheckpoint(buffer, overwrite = true) {
      await request(`/storage/v1/object/${objectPath}`, {method: 'POST', headers: {'Content-Type': 'application/gzip', 'x-upsert': String(overwrite)}, body: buffer});
    },
    async readStatus() {
      const response = await request('/rest/v1/mtr_research_log?id=eq.MTR-1-status&select=payload');
      return response ? (await response.json())[0]?.payload ?? null : null;
    },
    async writeStatus(status) {
      await request('/rest/v1/mtr_research_log?on_conflict=id', {method: 'POST', headers: {'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates'}, body: JSON.stringify({id: 'MTR-1-status', payload: status, updated_at: status.attemptedAt})});
    }
  };
}

export async function seed(remote, dir) {
  if (await remote.readCheckpoint()) throw Error('A cloud journal already exists. Refusing to overwrite it.');
  const buffer = packJournal(dir);
  await remote.saveCheckpoint(buffer, false);
  const saved = await remote.readCheckpoint();
  if (!saved || sha(saved) !== sha(buffer)) throw Error('Seed verification failed.');
  console.log('Existing journal seeded and verified. Automatic scanning is not yet activated.');
}

export async function runAutomation({remote, dir, execute, now = () => new Date().toISOString(), runUrl = null}) {
  let previous = null, phase = 'restore';
  const attemptedAt = now();
  try {
    previous = await remote.readStatus();
    const checkpoint = await remote.readCheckpoint();
    if (!checkpoint) throw Error('Seed the existing local journal first.');
    unpackJournal(checkpoint, dir);
    phase = 'scan';
    await execute('scan');
    const ledger = JSON.parse(fs.readFileSync(path.join(dir, 'ledger.json'), 'utf8'));
    phase = 'checkpoint';
    const nextCheckpoint = packJournal(dir);
    await remote.saveCheckpoint(nextCheckpoint);
    const saved = await remote.readCheckpoint();
    if (!saved || sha(saved) !== sha(nextCheckpoint)) throw Error('Checkpoint verification failed.');
    // Persist raw inputs before publication so a publication retry cannot lose history.
    phase = 'publish';
    await execute('publish');
    phase = 'status';
    const status = {state: 'success', attemptedAt, lastSuccessAt: now(), lastSession: ledger.lastSession, journalSavedAt: ledger.updatedAt, runUrl, error: null};
    await remote.writeStatus(status);
    console.log(`Automatic scan, durable checkpoint, and Pro publication succeeded for ${ledger.lastSession}.`);
    return status;
  } catch (cause) {
    // Preserve validated completed downloads even when the scan fails. Never publish here.
    // packJournal refuses active/interrupted ledger writes, protecting the previous checkpoint.
    if (phase === 'scan') {
      try {
        const partial = packJournal(dir);
        await remote.saveCheckpoint(partial);
        const saved = await remote.readCheckpoint();
        if (!saved || sha(saved) !== sha(partial)) throw Error('Verification failed.');
      } catch { console.error('Could not checkpoint partial downloads; previous cloud journal retained where possible.'); }
    }
    // Only controlled text reaches logs or the Pro page; provider error URLs may contain secrets.
    const safeDetail = cause instanceof Error && (/^[A-Z.]+ (eod|splits): HTTP \d{3}$/.test(cause.message) || /^Supabase (operation failed \(HTTP \d{3}\)|request failed)\.$/.test(cause.message) || cause.message === 'Seed the existing local journal first.');
    const detail = safeDetail ? ` ${cause.message}` : '';
    const error = `Automatic MTR ${phase} failed.${detail} Review the Actions run and setup instructions.`;
    try { await remote.writeStatus({...previous, state: 'failed', attemptedAt, runUrl, error}); }
    catch { console.error('Could not update Pro failure status. The freshness warning will detect a missing heartbeat.'); }
    throw Error(error);
  }
}

async function main() {
  const project = path.resolve(root, '../..');
  const envFile = path.join(project, '.env.local');
  if (fs.existsSync(envFile)) for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^(EODHD_API_TOKEN|NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SECRET_KEY)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  const command = process.argv[2], dir = path.join(root, 'journal');
  if (!['seed', 'run'].includes(command)) throw Error('Usage: node research/mtr/automate.mjs seed | run');
  const remote = remoteClient();
  if (command === 'seed') return seed(remote, dir);
  if (!process.env.EODHD_API_TOKEN) throw Error('EODHD_API_TOKEN missing.');
  const execute = command => {
    const result = spawnSync(process.execPath, [path.join(root, 'run.mjs'), command], {cwd: project, encoding: 'utf8', timeout: 25 * 60000, maxBuffer: 1024 * 1024});
    // Child output is not relayed: successful summaries are reported by this wrapper.
    if (result.status !== 0 || result.error) {
      const safe = result.stderr?.trim();
      throw Error(/^[A-Z.]+ (eod|splits): HTTP \d{3}$/.test(safe) ? safe : `MTR ${command} failed.`);
    }
  };
  const runUrl = process.env.GITHUB_ACTIONS === 'true' ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null;
  await runAutomation({remote, dir, execute, runUrl});
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch(error => {console.error(error.message); process.exitCode = 1;});
