const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/;
export function instant(value) {
  if (typeof value !== 'string' || !timestamp.test(value)) throw new Error('OFFSET_TIMESTAMP_REQUIRED');
  const [year, month, day, hour, minute, second] = value.slice(0,19).match(/\d+/g).map(Number);
  const civil = new Date(Date.UTC(year,month-1,day,hour,minute,second));
  if (civil.getUTCFullYear() !== year || civil.getUTCMonth() !== month-1 || civil.getUTCDate() !== day
    || hour > 23 || minute > 59 || second > 59) throw new Error('INVALID_TIMESTAMP');
  const result = Date.parse(value);
  if (!Number.isFinite(result)) throw new Error('INVALID_TIMESTAMP');
  return result;
}
export function schedule({ starts_at, ends_at, time_zone }) {
  if (typeof time_zone !== 'string' || !time_zone) throw new Error('TIME_ZONE_REQUIRED');
  let formatter;
  try { formatter = new Intl.DateTimeFormat('en-CA', { timeZone: time_zone, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23' }); }
  catch { throw new Error('INVALID_TIME_ZONE'); }
  const start = instant(starts_at), end = instant(ends_at);
  if (end <= start) throw new Error('END_MUST_FOLLOW_START');
  for (const value of [starts_at, ends_at]) {
    if (!value.endsWith('Z')) {
      const parts = Object.fromEntries(formatter.formatToParts(new Date(value)).map(p => [p.type,p.value]));
      const local = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
      if (local !== value.slice(0,19)) throw new Error('OFFSET_TIME_ZONE_MISMATCH');
    }
  }
  return Object.freeze({ starts_at:new Date(start).toISOString(), ends_at:new Date(end).toISOString(),time_zone,scheduled_seconds:(end-start)/1000 });
}
export function overlaps(a, b) {
  const pair = x => [instant(x.starts_at.replace('.000Z','Z')),instant(x.ends_at.replace('.000Z','Z'))];
  const [aStart,aEnd] = pair(a), [bStart,bEnd] = pair(b);
  if (aEnd <= aStart || bEnd <= bStart) throw new Error('INVALID_INTERVAL');
  return aStart < bEnd && bStart < aEnd;
}
export function canReserve(workerId, candidate, assignments) {
  if (typeof workerId !== 'string' || !workerId) throw new Error('WORKER_REQUIRED');
  if (instant(candidate.ends_at) <= instant(candidate.starts_at)) throw new Error('INVALID_INTERVAL');
  return !assignments.some(a => a.worker_id === workerId && ['selected','confirmed','attended','disputed','no_show_review'].includes(a.state) && overlaps(candidate,a));
}
export function availableDuring(candidate, windows) {
  const start=instant(candidate.starts_at),end=instant(candidate.ends_at);
  if(end<=start || !Array.isArray(windows)) throw new Error('INVALID_AVAILABILITY');
  const sorted=windows.map(w=>{
    const a=instant(w.starts_at),b=instant(w.ends_at);
    if(b<=a) throw new Error('INVALID_AVAILABILITY');return [a,b];
  }).sort((a,b)=>a[0]-b[0]);
  let covered=start;
  for(const [a,b] of sorted){if(a>covered) break;if(b>covered) covered=b;if(covered>=end) return true;}
  return false;
}
