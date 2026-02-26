const ET = 'America/New_York';
const OPEN_H = 9, OPEN_M = 30;
const CLOSE_H = 16, CLOSE_M = 0;

function etParts(d: Date) {
  const s = d.toLocaleString('en-US', { timeZone: ET });
  const [datePart, timePart] = s.split(', ');
  const [month, day, year] = datePart.split('/').map(Number);
  const [time, ampm] = timePart.split(' ');
  const [hRaw, m, sec] = time.split(':').map(Number);
  let h = hRaw;
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return { year, month, day, h, m, sec, dow: d.getDay() };
}

export function isMarketOpen(now = new Date()): boolean {
  const { h, m, dow } = etParts(now);
  if (dow === 0 || dow === 6) return false;
  const mins = h * 60 + m;
  return mins >= OPEN_H * 60 + OPEN_M && mins < CLOSE_H * 60 + CLOSE_M;
}

export function getNextOpen(now = new Date()): Date {
  const d = new Date(now.getTime());
  // Step forward in 1-minute increments until we land on an open minute.
  // Fast-forward: jump to next day's open if past close or weekend.
  for (let i = 0; i < 7 * 24 * 60; i++) {
    const { h, m, dow } = etParts(d);
    const mins = h * 60 + m;
    if (dow >= 1 && dow <= 5 && mins >= OPEN_H * 60 + OPEN_M && mins < CLOSE_H * 60 + CLOSE_M) {
      return d;
    }
    if (dow >= 1 && dow <= 5 && mins < OPEN_H * 60 + OPEN_M) {
      // Same day, jump to 9:30
      d.setMinutes(d.getMinutes() + (OPEN_H * 60 + OPEN_M - mins));
      continue;
    }
    // Jump to midnight then next day
    d.setHours(d.getHours() + (24 - h));
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
  }
  return d;
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '0s';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}
