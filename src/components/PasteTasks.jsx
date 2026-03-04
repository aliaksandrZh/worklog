import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { parsePastedText } from '../parser.js';
import { addTasks } from '../store.js';
import TaskTable from './TaskTable.jsx';
import BorderedInput from './BorderedInput.jsx';

const FIELD_LABELS = {
  date: 'Date (M/D/YYYY)',
  type: 'Type (Bug/Task)',
  number: 'Number',
  name: 'Name',
  timeSpent: 'Time Spent (e.g. 1h, 30m)',
};

export default function PasteTasks({ onDone, onMessage }) {
  const [phase, setPhase] = useState('input'); // input | fill | preview
  const [parsed, setParsed] = useState([]);
  // fill phase: which task and which missing field we're on
  const [fillTaskIdx, setFillTaskIdx] = useState(0);
  const [fillFieldIdx, setFillFieldIdx] = useState(0);
  const [input, setInput] = useState('');

  useInput((ch, key) => {
    if (phase === 'fill') {
      if (key.escape) {
        onDone();
      }
    }

    if (phase === 'preview') {
      if (key.return) {
        const cleaned = parsed.map(({ missing, ...rest }) => rest);
        addTasks(cleaned);
        onMessage(`${cleaned.length} task(s) saved!`);
        onDone();
      }
      if (key.escape) {
        onDone();
      }
    }
  });

  const handlePasteSubmit = (text) => {
    const tasks = parsePastedText(text);
    if (tasks.length === 0) {
      onMessage('No tasks parsed. Check format.');
      onDone();
      return;
    }
    setParsed(tasks);
    startFillOrPreview(tasks);
  };

  function startFillOrPreview(tasks) {
    // Find first task with non-timeSpent missing fields
    const idx = findNextFill(tasks, 0, 0);
    if (idx) {
      setFillTaskIdx(idx.task);
      setFillFieldIdx(idx.field);
      setInput('');
      setPhase('fill');
    } else {
      setPhase('preview');
    }
  }

  // Find next missing field that needs filling (skip timeSpent — it's optional)
  function findNextFill(tasks, fromTask, fromField) {
    for (let t = fromTask; t < tasks.length; t++) {
      const missing = tasks[t].missing || [];
      const required = missing.filter(f => f !== 'timeSpent' && f !== 'date');
      const startF = t === fromTask ? fromField : 0;
      for (let f = startF; f < required.length; f++) {
        return { task: t, field: f };
      }
    }
    return null;
  }

  function handleFillSubmit(val) {
    const task = parsed[fillTaskIdx];
    const required = (task.missing || []).filter(f => f !== 'timeSpent');
    const fieldName = required[fillFieldIdx];

    const updated = [...parsed];
    updated[fillTaskIdx] = { ...task, [fieldName]: val };

    // Remove from missing
    updated[fillTaskIdx].missing = task.missing.filter(f => f !== fieldName);
    setParsed(updated);
    setInput('');

    // Find next
    const next = findNextFill(updated, fillTaskIdx, fillFieldIdx);
    if (next) {
      setFillTaskIdx(next.task);
      setFillFieldIdx(next.field);
    } else {
      setPhase('preview');
    }
  }

  if (phase === 'input') {
    return (
      <Box flexDirection="column">
        <Text bold>Paste Tasks</Text>
        <Text dimColor>Type or paste your task. Enter=submit, Escape=cancel</Text>
        <Text dimColor>Accepts various formats — missing fields will be prompted.</Text>
        <Box marginTop={1}>
          <BorderedInput onSubmit={handlePasteSubmit} onCancel={onDone} />
        </Box>
      </Box>
    );
  }

  if (phase === 'fill') {
    const task = parsed[fillTaskIdx];
    const required = (task.missing || []).filter(f => f !== 'timeSpent');
    const fieldName = required[fillFieldIdx];
    const known = Object.entries(task)
      .filter(([k, v]) => v && k !== 'missing' && k !== 'comments' && !(task.missing || []).includes(k));

    return (
      <Box flexDirection="column">
        <Text bold>Fill Missing Fields</Text>
        <Text dimColor>Press Escape to cancel</Text>

        <Box marginTop={1} flexDirection="column">
          <Text color="cyan">
            Task {fillTaskIdx + 1}/{parsed.length}:
            {task.name ? ` ${task.name}` : task.number ? ` #${task.number}` : ' (unknown)'}
          </Text>
          {known.map(([k, v]) => (
            <Text key={k} color="gray">  {k}: {v}</Text>
          ))}
        </Box>

        <Box marginTop={1}>
          <Text color="yellow">{FIELD_LABELS[fieldName] || fieldName}: </Text>
          <TextInput value={input} onChange={setInput} onSubmit={handleFillSubmit} />
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold>Preview ({parsed.length} tasks parsed)</Text>
      <TaskTable tasks={parsed} />
      <Box marginTop={1}>
        <Text color="green">Press Enter to save, Escape to cancel</Text>
      </Box>
    </Box>
  );
}
