#!/usr/bin/env tsx

import { parseLine, parsePastedText } from './parser.js';
import { loadTasks, addTask, addTasks } from './store.js';
import { parseDate, getWeekBounds, formatDateShort, groupByDate, parseTime } from './utils.js';
import { formatTable } from './format.js';
import { startTimer, stopTimer, getTimerStatus, formatElapsed } from './timer.js';

function todayStr() {
  const d = new Date();
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

const subcommand = process.argv[2];

if (!subcommand) {
  await import('./index.js');
} else if (subcommand === 'add') {
  const rest = process.argv.slice(3).join(' ').trim();
  if (!rest) {
    console.error('Usage: tt add <type> <number>: <name> [time]');
    process.exit(1);
  }
  const parsed = parseLine(rest);
  const task = {
    date: todayStr(),
    type: parsed.type,
    number: parsed.number,
    name: parsed.name,
    timeSpent: parsed.timeSpent,
    comments: '',
  };
  addTask(task);
  console.log(`Added: ${task.type} ${task.number} — ${task.name}${task.timeSpent ? ' (' + task.timeSpent + ')' : ''}`);
} else if (subcommand === 'paste') {
  const { execSync } = await import('node:child_process');
  let clipboard;
  try {
    clipboard = execSync('pbpaste', { encoding: 'utf8' });
  } catch {
    console.error('Failed to read clipboard. On macOS, pbpaste is required.');
    process.exit(1);
  }
  if (!clipboard.trim()) {
    console.error('Clipboard is empty.');
    process.exit(1);
  }
  const tasks = parsePastedText(clipboard);
  if (tasks.length === 0) {
    console.error('No tasks parsed from clipboard.');
    process.exit(1);
  }
  const clean = tasks.map(({ missing, ...t }) => t);
  addTasks(clean);
  console.log(`Pasted ${clean.length} task(s):`);
  console.log(formatTable(clean));
} else if (subcommand === 'today') {
  const tasks = loadTasks();
  const today = todayStr();
  const filtered = tasks.filter(t => t.date === today);
  if (filtered.length === 0) {
    console.log('No tasks for today.');
  } else {
    const total = filtered.reduce((sum, t) => sum + parseTime(t.timeSpent), 0);
    console.log(`Today (${today}) — ${total.toFixed(1)}h:`);
    console.log(formatTable(filtered));
  }
} else if (subcommand === 'week') {
  const tasks = loadTasks();
  const { monday, sunday } = getWeekBounds(new Date());
  const filtered = tasks.filter(t => {
    const d = parseDate(t.date);
    return d && d >= monday && d <= sunday;
  });
  if (filtered.length === 0) {
    console.log('No tasks this week.');
  } else {
    const total = filtered.reduce((sum, t) => sum + parseTime(t.timeSpent), 0);
    const label = `${formatDateShort(monday)} – ${formatDateShort(sunday)}`;
    console.log(`Week (${label}) — ${total.toFixed(1)}h:`);
    console.log(formatTable(filtered));
  }
} else if (subcommand === 'start') {
  const rest = process.argv.slice(3).join(' ').trim();
  if (!rest) {
    console.error('Usage: tt start <type> <number>: <name>');
    process.exit(1);
  }
  const parsed = parseLine(rest);
  try {
    startTimer({ type: parsed.type, number: parsed.number, name: parsed.name });
    console.log(`Timer started: ${parsed.type} ${parsed.number} — ${parsed.name}`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
} else if (subcommand === 'stop') {
  try {
    const result = stopTimer();
    const task = {
      date: todayStr(),
      type: result.type,
      number: result.number,
      name: result.name,
      timeSpent: result.timeSpent,
      comments: '',
    };
    addTask(task);
    console.log(`Stopped: ${task.type} ${task.number} — ${task.name} (${task.timeSpent})`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
} else if (subcommand === 'status') {
  const status = getTimerStatus();
  if (!status) {
    console.log('No timer running.');
  } else {
    console.log(`Running: ${status.type} ${status.number} — ${status.name} (${status.timeSpent})`);
  }
} else {
  console.error(`Unknown command: ${subcommand}`);
  console.error('Commands: add, paste, today, week, start, stop, status');
  process.exit(1);
}
