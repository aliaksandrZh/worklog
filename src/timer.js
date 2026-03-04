import fs from 'node:fs';
import path from 'node:path';

function timerPath() {
  return path.join(process.cwd(), '.timer.json');
}

export function formatElapsed(ms) {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 1) return '0m';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function startTimer({ type, number, name }) {
  if (fs.existsSync(timerPath())) {
    throw new Error('Timer already running. Stop it first with: tt stop');
  }
  const data = { type, number, name, startedAt: Date.now() };
  fs.writeFileSync(timerPath(), JSON.stringify(data, null, 2), 'utf8');
  return data;
}

export function stopTimer() {
  if (!fs.existsSync(timerPath())) {
    throw new Error('No timer running. Start one with: tt start <type> <number>: <name>');
  }
  const data = JSON.parse(fs.readFileSync(timerPath(), 'utf8'));
  const elapsed = Date.now() - data.startedAt;
  fs.unlinkSync(timerPath());
  return {
    type: data.type,
    number: data.number,
    name: data.name,
    timeSpent: formatElapsed(elapsed),
    elapsed,
  };
}

export function getTimerStatus() {
  if (!fs.existsSync(timerPath())) return null;
  const data = JSON.parse(fs.readFileSync(timerPath(), 'utf8'));
  const elapsed = Date.now() - data.startedAt;
  return { ...data, elapsed, timeSpent: formatElapsed(elapsed) };
}
