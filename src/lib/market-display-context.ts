// Display-only context. No scoring, breadth, regime or trading thresholds change.
export function formatSessionDate(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Session date unavailable';
  const date = new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(date.valueOf()) || date.toISOString().slice(0,10) !== value) return 'Session date unavailable';
  return new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',year:'numeric'}).format(date);
}
export function formatContextTime(value: string | null | undefined) {
  if (!value || !/T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) return 'Timestamp unavailable';
  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) return 'Timestamp unavailable';
  return new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit',timeZoneName:'short'}).format(date);
}
export function equalWeightContext(value: {leader:string;relativePerformance:number} | null | undefined) {
  if (!value || !Number.isFinite(value.relativePerformance)) return 'Comparison unavailable';
  const gap = `${Math.abs(value.relativePerformance).toFixed(2)} percentage points`;
  if (value.leader === 'RSP') return `RSP ahead of SPY by ${gap}`;
  if (value.leader === 'SPY') return `SPY ahead of RSP by ${gap}`;
  return value.leader === 'Equal' ? `Similar performance (${gap} apart)` : 'Comparison unavailable';
}
export function benchmarkSessionContext(symbol: string, changePercent: number, marketScore?: number | null) {
  if (!Number.isFinite(changePercent)) return `${symbol}: regular-session change unavailable.`;
  const movement = changePercent > 0 ? `up ${changePercent.toFixed(2)}%` : changePercent < 0 ? `down ${Math.abs(changePercent).toFixed(2)}%` : 'unchanged';
  const backdrop = typeof marketScore === 'number' && Number.isFinite(marketScore) && marketScore >= 0 && marketScore <= 100
    ? `The separate market backdrop is ${marketScore}/100.` : 'The market backdrop is unavailable.';
  return `${symbol} is ${movement} in its quoted regular session. ${backdrop}`;
}
export function recordedBreadthBaseline(count: number) {
  if (!Number.isInteger(count) || count < 1) return 'recorded history unavailable';
  return count === 1 ? 'last recorded session' : `average of ${count} recorded sessions`;
}
