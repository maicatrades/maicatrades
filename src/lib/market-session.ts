// NYSE equity calendar: https://www.nyse.com/trade/hours-calendars
// Explicit coverage fails closed for persistence when the calendar needs renewal.
const holidays: Record<number, string[]> = {
  2025: ['01-01','01-09','01-20','02-17','04-18','05-26','06-19','07-04','09-01','11-27','12-25'],
  2026: ['01-01','01-19','02-16','04-03','05-25','06-19','07-03','09-07','11-26','12-25'],
  2027: ['01-01','01-18','02-15','03-26','05-31','06-18','07-05','09-06','11-25','12-24'],
  2028: ['01-17','02-21','04-14','05-29','06-19','07-04','09-04','11-23','12-25'],
};
const earlyCloses = new Set(['2025-07-03','2025-11-28','2025-12-24','2026-11-27','2026-12-24','2027-11-26','2028-07-03','2028-11-24']);
export function isTradingDate(date: string) {
  const year = Number(date.slice(0, 4));
  if (!holidays[year] || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0,10) === date &&
    ![0,6].includes(parsed.getUTCDay()) && !holidays[year].includes(date.slice(5));
}
export function previousTradingDate(date: string): string | null {
  const value = new Date(`${date}T12:00:00Z`);
  for (let i=0; i<14; i++) {
    value.setUTCDate(value.getUTCDate()-1);
    const candidate = value.toISOString().slice(0,10);
    if (isTradingDate(candidate)) return candidate;
  }
  return null;
}
export function marketSession(now = new Date()) {
  const values = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23',
  }).formatToParts(now).map(p=>[p.type,p.value]));
  const tradingDate = `${values.year}-${values.month}-${values.day}`;
  const minutes = Number(values.hour)*60+Number(values.minute);
  const isTradingDay = isTradingDate(tradingDate);
  const closeMinutes = earlyCloses.has(tradingDate) ? 780 : 960;
  const isRegularSession = isTradingDay && minutes>=570 && minutes<closeMinutes;
  return {tradingDate,minutes,isTradingDay,isWeekday:isTradingDay,closeMinutes,isRegularSession,
    phase: !isTradingDay ? 'Closed' : minutes<240 ? 'Closed' : minutes<570 ? 'Pre-market' :
      minutes<closeMinutes ? 'Regular session' : minutes<(closeMinutes===780?1020:1200) ? 'After-hours' : 'Closed',
    completedDate: isTradingDay && minutes>=closeMinutes ? tradingDate : previousTradingDate(tradingDate)};
}
export function formatEasternQuote(timestamp: number | null | undefined) {
  return typeof timestamp === 'number' && Number.isFinite(timestamp) && timestamp>0
    ? new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(timestamp*1000))
    : 'Quote time unavailable';
}
