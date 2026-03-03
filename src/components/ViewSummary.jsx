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

function parseDate(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  return new Date(+parts[2], +parts[0] - 1, +parts[1]);
}

function getWeekBounds(date) {
  const d = new Date(date);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function formatDateShort(d) {
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

export default function ViewSummary({ onDone }) {
  const [mode, setMode] = useState('daily');
  const tasks = useMemo(() => loadTasks(), []);

  const dailyGroups = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    }
    return Object.keys(map).sort().reverse().map(key => ({
      key,
      tasks: map[key],
      total: map[key].reduce((sum, t) => sum + parseTime(t.timeSpent), 0),
    }));
  }, [tasks]);

  const weeklyTasks = useMemo(() => {
    const { monday, sunday } = getWeekBounds(new Date());
    const filtered = tasks.filter(t => {
      const d = parseDate(t.date);
      return d && d >= monday && d <= sunday;
    });
    const total = filtered.reduce((sum, t) => sum + parseTime(t.timeSpent), 0);
    return {
      label: `${formatDateShort(monday)} – ${formatDateShort(sunday)}`,
      tasks: filtered,
      total,
    };
  }, [tasks]);

  useInput((ch, key) => {
    if (key.escape) {
      onDone();
      return;
    }
    if (ch === 'd') setMode('daily');
    if (ch === 'w') setMode('weekly');
  });

  if (tasks.length === 0) {
    return (
      <Box flexDirection="column">
        <Text>No tasks found. Press Escape to go back.</Text>
      </Box>
    );
  }

  if (mode === 'weekly') {
    return (
      <Box flexDirection="column">
        <Text bold>Weekly Summary</Text>
        <Text dimColor>d = daily | w = weekly | Escape = back</Text>

        <Box marginTop={1} flexDirection="column">
          <Text bold color="yellow">
            {weeklyTasks.label} — {weeklyTasks.total.toFixed(1)}h total ({weeklyTasks.tasks.length} tasks)
          </Text>
          {weeklyTasks.tasks.length > 0
            ? <TaskTable tasks={weeklyTasks.tasks} />
            : <Text color="gray">No tasks this week.</Text>
          }
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold>Daily Summary</Text>
      <Text dimColor>d = daily | w = weekly | Escape = back</Text>

      {dailyGroups.map(group => (
        <Box key={group.key} marginTop={1} flexDirection="column">
          <Text bold color="yellow">
            {group.key} — {group.total.toFixed(1)}h total ({group.tasks.length} tasks)
          </Text>
          <TaskTable tasks={group.tasks} />
        </Box>
      ))}
    </Box>
  );
}
