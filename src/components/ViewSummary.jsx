import React, { useState, useMemo, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { loadTasks, updateTask, deleteTask } from '../store.js';
import { groupByDate, filterWeekByOffset, parseDate, getWeekBounds, sortTasks } from '../utils.js';
import { loadPrefs, savePrefs } from '../prefs.js';
import TaskTable, { COLUMNS } from './TaskTable.jsx';

function getMinWeekOffset(tasks) {
  let earliest = null;
  for (const t of tasks) {
    const d = parseDate(t.date);
    if (d && (earliest === null || d < earliest)) earliest = d;
  }
  if (!earliest) return 0;
  const now = new Date();
  const currentMonday = getWeekBounds(now).monday;
  const earliestMonday = getWeekBounds(earliest).monday;
  const diffMs = earliestMonday - currentMonday;
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}

function indexTasks(tasks) {
  return tasks.map((t, i) => ({ ...t, _idx: i }));
}

// Phases: 'view' | 'select' | 'editing' | 'confirmDelete'
export default function ViewSummary({ onDone, onMessage }) {
  const SORT_COLUMNS = [null, 'date', 'type', 'number', 'name', 'timeSpent'];
  const prefs = useMemo(() => loadPrefs(), []);
  const [mode, setMode] = useState('daily');
  const [dailyIdx, setDailyIdx] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [sortBy, setSortBy] = useState(prefs.sortBy || null);
  const [sortDir, setSortDir] = useState(prefs.sortDir || 'asc');
  const [revision, setRevision] = useState(0);

  const [phase, setPhase] = useState('view');
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);
  const [editValue, setEditValue] = useState('');

  const tasks = useMemo(() => loadTasks(), [revision]);
  const indexedTasks = useMemo(() => indexTasks(tasks), [tasks]);
  const dailyGroups = useMemo(() => groupByDate(indexedTasks), [indexedTasks]);
  const minWeekOffset = useMemo(() => getMinWeekOffset(indexedTasks), [indexedTasks]);

  const displayedTasks = useMemo(() => {
    let raw;
    if (mode === 'weekly') {
      raw = filterWeekByOffset(indexedTasks, weekOffset).tasks;
    } else {
      const group = dailyGroups[dailyIdx];
      raw = group ? group.tasks : [];
    }
    return sortTasks(raw, sortBy, sortDir);
  }, [mode, indexedTasks, weekOffset, dailyGroups, dailyIdx, sortBy, sortDir]);

  const effectiveRow = Math.min(selectedRow, displayedTasks.length - 1);

  const reload = useCallback(() => setRevision(r => r + 1), []);

  const clearScreen = () => process.stdout.write('\x1B[2J\x1B[H');

  const exitEditMode = () => {
    setPhase('view');
    setSelectedRow(0);
    setSelectedCol(0);
  };

  useInput((ch, key) => {
    // === EDITING PHASE (TextInput active) ===
    if (phase === 'editing') {
      if (key.escape) {
        setPhase('select');
      }
      return;
    }

    // === CONFIRM DELETE PHASE ===
    if (phase === 'confirmDelete') {
      if (ch === 'y' || ch === 'Y') {
        const task = displayedTasks[effectiveRow];
        if (task) {
          deleteTask(task._idx);
          reload();
          if (onMessage) onMessage('Task deleted.');
          const newLen = displayedTasks.length - 1;
          if (effectiveRow >= newLen) {
            setSelectedRow(Math.max(0, newLen - 1));
          }
        }
        clearScreen();
        setPhase(displayedTasks.length <= 1 ? 'view' : 'select');
      } else if (ch === 'n' || ch === 'N' || key.escape) {
        clearScreen();
        setPhase('select');
      }
      return;
    }

    // === SELECT PHASE (row/col navigation) ===
    if (phase === 'select') {
      if (key.escape) {
        exitEditMode();
        return;
      }
      if (key.upArrow) {
        if (displayedTasks.length > 0) {
          setSelectedRow(r => r <= 0 ? displayedTasks.length - 1 : r - 1);
        }
        return;
      }
      if (key.downArrow) {
        if (displayedTasks.length > 0) {
          setSelectedRow(r => r >= displayedTasks.length - 1 ? 0 : r + 1);
        }
        return;
      }
      if (key.leftArrow) {
        setSelectedCol(c => c <= 0 ? COLUMNS.length - 1 : c - 1);
        return;
      }
      if (key.rightArrow) {
        setSelectedCol(c => c >= COLUMNS.length - 1 ? 0 : c + 1);
        return;
      }
      if (key.return && effectiveRow >= 0) {
        const task = displayedTasks[effectiveRow];
        if (task) {
          const col = COLUMNS[selectedCol];
          setEditValue(task[col] || '');
          setPhase('editing');
        }
        return;
      }
      if (ch === 'x' && effectiveRow >= 0) {
        clearScreen();
        setPhase('confirmDelete');
        return;
      }
      return;
    }

    // === VIEW PHASE ===
    if (key.escape) {
      onDone();
      return;
    }

    if (ch === 'e') {
      if (displayedTasks.length > 0) {
        setSelectedRow(0);
        setSelectedCol(0);
        setPhase('select');
      }
      return;
    }

    // Period navigation with ← →
    if (key.leftArrow) {
      if (mode === 'daily' && dailyIdx < dailyGroups.length - 1) {
        clearScreen();
        setDailyIdx(i => i + 1);
      } else if (mode === 'weekly' && weekOffset > minWeekOffset) {
        clearScreen();
        setWeekOffset(o => o - 1);
      }
      return;
    }
    if (key.rightArrow) {
      if (mode === 'daily' && dailyIdx > 0) {
        clearScreen();
        setDailyIdx(i => i - 1);
      } else if (mode === 'weekly' && weekOffset < 0) {
        clearScreen();
        setWeekOffset(o => o + 1);
      }
      return;
    }

    // Mode switches
    if (ch === 'd' && mode !== 'daily') {
      clearScreen();
      setMode('daily');
    }
    if (ch === 'w' && mode !== 'weekly') {
      clearScreen();
      setMode('weekly');
    }
    if (ch === 's') {
      setSortBy(prev => {
        const idx = SORT_COLUMNS.indexOf(prev);
        const next = SORT_COLUMNS[(idx + 1) % SORT_COLUMNS.length];
        savePrefs({ sortBy: next });
        return next;
      });
    }
    if (ch === 'S') {
      setSortDir(prev => {
        const next = prev === 'asc' ? 'desc' : 'asc';
        savePrefs({ sortDir: next });
        return next;
      });
    }
  });

  const handleEditChange = useCallback((val) => setEditValue(val), []);

  const handleEditSubmit = useCallback(() => {
    const task = displayedTasks[effectiveRow];
    if (task) {
      const col = COLUMNS[selectedCol];
      updateTask(task._idx, { [col]: editValue });
      reload();
      if (onMessage) onMessage(`Updated ${col}.`);
    }
    setPhase('select');
  }, [displayedTasks, effectiveRow, selectedCol, editValue, reload, onMessage]);

  if (tasks.length === 0) {
    return (
      <Box flexDirection="column">
        <Text>No tasks found. Press Escape to go back.</Text>
      </Box>
    );
  }

  const isEditMode = phase !== 'view';
  const sortHint = sortBy ? `sort:${sortBy} ${sortDir}` : 'off';
  const viewHint = `← prev | → next | e=edit | d=daily | w=weekly | s=sort(${sortHint}) | S=flip | Esc=back`;
  const editHint = `↑↓=row | ←→=col | Enter=edit cell | x=delete | Esc=back`;
  const hint = isEditMode ? editHint : viewHint;

  const tableProps = {
    tasks: displayedTasks,
    sortBy,
    sortDir,
    selectedRow: isEditMode ? effectiveRow : -1,
    selectedCol,
    editingCell: phase === 'editing',
    editValue,
    onEditChange: handleEditChange,
    onEditSubmit: handleEditSubmit,
  };

  if (mode === 'weekly') {
    const weeklyTasks = filterWeekByOffset(indexedTasks, weekOffset);
    return (
      <Box flexDirection="column">
        <Text bold>Weekly Summary{isEditMode ? ' (EDIT)' : ''}</Text>
        <Text dimColor>{hint}</Text>

        <Box marginTop={1} flexDirection="column">
          <Text bold color="yellow">
            {weeklyTasks.label} — {weeklyTasks.total.toFixed(1)}h total ({weeklyTasks.tasks.length} tasks)
          </Text>
          {displayedTasks.length > 0
            ? <TaskTable {...tableProps} />
            : <Text color="gray">No tasks this week.</Text>
          }
        </Box>
        {phase === 'confirmDelete' && effectiveRow >= 0 && (
          <Text color="red" bold>Delete this task? (y/n)</Text>
        )}
      </Box>
    );
  }

  const group = dailyGroups[dailyIdx];

  return (
    <Box flexDirection="column">
      <Text bold>Daily Summary{isEditMode ? ' (EDIT)' : ''} — {group ? group.key : ''}</Text>
      <Text dimColor>{hint}</Text>

      {group && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color="yellow">
            {group.key} — {group.total.toFixed(1)}h total ({group.tasks.length} tasks)
          </Text>
          <TaskTable {...tableProps} />
        </Box>
      )}
      {phase === 'confirmDelete' && effectiveRow >= 0 && (
        <Text color="red" bold>Delete this task? (y/n)</Text>
      )}
    </Box>
  );
}
