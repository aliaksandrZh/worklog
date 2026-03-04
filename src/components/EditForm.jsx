import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { updateTask } from '../store.js';
import { goBack } from '../formNav.js';

const FIELDS = ['date', 'type', 'number', 'name', 'timeSpent', 'comments'];

export default function EditForm({ task, taskIndex, onDone, onMessage }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({ ...task });
  const [input, setInput] = useState(task[FIELDS[0]] || '');

  useInput((ch, key) => {
    if (key.escape) {
      onDone();
      return;
    }
    if ((key.backspace || key.delete) && input === '') {
      const prev = goBack(step, FIELDS, values);
      if (prev) {
        setStep(prev.step);
        setInput(prev.input);
      }
      return;
    }
  });

  const field = FIELDS[step];

  const handleSubmit = (val) => {
    const value = val || values[field] || '';
    const updated = { ...values, [field]: value };
    setValues(updated);

    if (step + 1 >= FIELDS.length) {
      updateTask(taskIndex, updated);
      onMessage('Task updated!');
      onDone();
    } else {
      const nextStep = step + 1;
      setStep(nextStep);
      setInput(updated[FIELDS[nextStep]] || '');
    }
  };

  return (
    <Box flexDirection="column">
      <Text bold>Edit Task</Text>
      <Text dimColor>Escape=cancel | Enter=keep value | Backspace on empty=go back</Text>

      {FIELDS.slice(0, step).map(k => (
        <Text key={k} color="gray">{k}: {values[k]}</Text>
      ))}

      <Box marginTop={1}>
        <Text color="yellow">{field} [{values[field] || ''}]: </Text>
        <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
      </Box>
    </Box>
  );
}
