import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { loadTasks } from '../store.js';
import TaskTable from './TaskTable.jsx';

function parseTime(timeStr) {
  if (!timeStr) return 0;
  let total = 0;
  const hours = timeStr.match(/(\d+(?:\.\d+)?)h/g);
  const mins = timeStr.match(/(\d+(?:\.\d+)?)m/g);
  if (hours) hours.forEach(h => { total += parseFloat(h); });
  if (mins) mins.forEach(m => { total += parseFloat(m) / 60; });
  return total;
}

function getWeekKey(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return 'Unknown';
  const d = new Date(+parts[2], +parts[0] - 1, +parts[1]);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export default function ViewSummary({ onDone }) {
  const [mode, setMode] = useState('daily'); // daily | weekly
  const tasks = useMemo(() => loadTasks(), []);

  const dates = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      const key = mode === 'daily' ? t.date : getWeekKey(t.date);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return Object.keys(map).sort().reverse().map(key => ({
      key,
      tasks: map[key],
      total: map[key].reduce((sum, t) => sum + parseTime(t.timeSpent), 0),
    }));
  }, [tasks, mode]);

  const [index, setIndex] = useState(0);

  useInput((ch, key) => {
    if (key.escape) {
      onDone();
      return;
    }
    if (key.leftArrow || ch === 'h') {
      setIndex(i => Math.max(0, i - 1));
    }
    if (key.rightArrow || ch === 'l') {
      setIndex(i => Math.min(dates.length - 1, i + 1));
    }
    if (ch === 'd') setMode('daily');
    if (ch === 'w') setMode('weekly');
  });

  if (dates.length === 0) {
    return (
      <Box flexDirection="column">
        <Text>No tasks found. Press Escape to go back.</Text>
      </Box>
    );
  }

  const current = dates[Math.min(index, dates.length - 1)];

  return (
    <Box flexDirection="column">
      <Text bold>
        {mode === 'daily' ? 'Daily' : 'Weekly'} Summary
        <Text dimColor> ({index + 1}/{dates.length})</Text>
      </Text>
      <Text dimColor>
        ← → navigate | d = daily | w = weekly | Escape = back
      </Text>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="yellow">
          {current.key} — {current.total.toFixed(1)}h total ({current.tasks.length} tasks)
        </Text>
        <TaskTable tasks={current.tasks} />
      </Box>
    </Box>
  );
}
