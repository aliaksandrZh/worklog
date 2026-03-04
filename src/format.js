export const FIXED = { date: 12, type: 6, number: 8, timeSpent: 8 };
export const MIN_NAME = 10;
export const MIN_COMMENTS = 5;

export function pad(str, len) {
  const s = String(str || '');
  return s.length > len ? s.slice(0, len - 1) + '…' : s.padEnd(len);
}

export const GAP = '  ';

export function formatTable(tasks, { width = 80 } = {}) {
  if (!tasks || tasks.length === 0) return 'No tasks to display.';

  const numGaps = 5; // gaps between 6 columns
  const fixedWidth = FIXED.date + FIXED.type + FIXED.number + FIXED.timeSpent + numGaps * GAP.length;
  const remaining = Math.max(MIN_NAME + MIN_COMMENTS, width - fixedWidth);
  const nameWidth = Math.floor(remaining * 0.65);
  const commentsWidth = remaining - nameWidth;

  const header = [
    pad('Date', FIXED.date),
    pad('Type', FIXED.type),
    pad('Number', FIXED.number),
    pad('Name', nameWidth),
    pad('Time', FIXED.timeSpent),
    pad('Comments', commentsWidth),
  ].join(GAP);

  const rows = tasks.map(t => [
    pad(t.date, FIXED.date),
    pad(t.type, FIXED.type),
    pad(t.number, FIXED.number),
    pad(t.name, nameWidth),
    pad(t.timeSpent, FIXED.timeSpent),
    pad(t.comments, commentsWidth),
  ].join(GAP));

  return [header, ...rows].join('\n');
}
