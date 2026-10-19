// Operational helpers only. Frozen trading formulas remain in engine.mjs.
export function pendingSessions(completed, ledger) {
  if (!ledger.lastSession) return completed.slice(-1);
  if (completed.at(-1) < ledger.lastSession) throw Error('Provider data is older than the saved journal.');
  const observed = new Set(ledger.observations.map(o => o.date));
  return completed.filter(date => date > ledger.lastSession && !observed.has(date));
}

export function health(status, now = Date.now()) {
  if (!status) return {state: 'unconfigured', message: 'Automatic scanning has not reported a run yet.'};
  if (status.state === 'failed') return {state: 'failed', message: status.error || 'Automatic scan failed.'};
  if (!Number.isFinite(Date.parse(status.lastSuccessAt)) || now - Date.parse(status.lastSuccessAt) > 30 * 3600000)
    return {state: 'stale', message: 'No successful automatic scan and publication in the last 30 hours.'};
  if (!Number.isFinite(Date.parse(`${status.lastSession}T00:00:00Z`)) || now - Date.parse(`${status.lastSession}T00:00:00Z`) > 5 * 86400000)
    return {state: 'stale', message: 'The research journal has no recent completed market session.'};
  return {state: 'healthy', message: 'Automatic scan and Pro publication completed.'};
}
