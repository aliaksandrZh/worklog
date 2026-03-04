import React from 'react';
import { Box, Text } from 'ink';
import { startTimer } from '../timer.js';
import { parseLine } from '../parser.js';
import BorderedInput from './BorderedInput.jsx';

export default function TimerStart({ onDone, onMessage }) {
  const handleSubmit = (val) => {
    if (!val.trim()) return;
    const { type, number, name } = parseLine(val.trim());
    if (!type && !number && !name) {
      onMessage('Could not parse. Use: Bug 123: Fix login');
      onDone();
      return;
    }
    try {
      startTimer({ type, number, name });
      const label = [type, number, name].filter(Boolean).join(' ');
      onMessage(`Timer started: ${label}`);
    } catch (err) {
      onMessage(err.message);
    }
    onDone();
  };

  return (
    <Box flexDirection="column">
      <Text bold>Start Timer</Text>
      <Text dimColor>Type or paste task. Enter=start, Escape=cancel</Text>
      <Text dimColor>Example: Bug 123: Fix login</Text>
      <Box marginTop={1}>
        <BorderedInput onSubmit={handleSubmit} onCancel={onDone} />
      </Box>
    </Box>
  );
}
