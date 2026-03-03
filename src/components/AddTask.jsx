import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { addTask } from '../store.js';

const FIELDS = [
  { key: 'date', label: 'Date (M/D/YYYY)', defaultFn: () => {
    const d = new Date();
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  }},
  { key: 'type', label: 'Type (Bug/Task)' },
  { key: 'number', label: 'Number' },
  { key: 'name', label: 'Name' },
  { key: 'timeSpent', label: 'Time Spent (e.g. 1h, 30m)' },
  { key: 'comments', label: 'Comments (optional)' },
];

export default function AddTask({ onDone, onMessage }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({});
  const [input, setInput] = useState('');

  useInput((ch, key) => {
    if (key.escape) {
      onDone();
    }
  });

  const field = FIELDS[step];

  const handleSubmit = (val) => {
    const value = val || (field.defaultFn ? field.defaultFn() : '');
    const updated = { ...values, [field.key]: value };
    setValues(updated);
    setInput('');

    if (step + 1 >= FIELDS.length) {
      addTask(updated);
      onMessage('Task added!');
      onDone();
    } else {
      setStep(step + 1);
    }
  };

  const defaultHint = field.defaultFn ? ` [default: ${field.defaultFn()}]` : '';

  return (
    <Box flexDirection="column">
      <Text bold>Add Task</Text>
      <Text dimColor>Press Escape to cancel</Text>

      {Object.entries(values).map(([k, v]) => (
        <Text key={k} color="gray">{k}: {v}</Text>
      ))}

      <Box marginTop={1}>
        <Text color="yellow">{field.label}{defaultHint}: </Text>
        <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
      </Box>
    </Box>
  );
}
