import React from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import SelectInput from 'ink-select-input';

export const SHORTCUTS = {
  a: 'add',
  p: 'paste',
  s: 'summary',
  e: 'edit',
  t: 'timer',
  q: 'exit',
};

const baseItems = [
  { label: '(a) Add Task', value: 'add' },
  { label: '(p) Paste Tasks', value: 'paste' },
  { label: '(s) View Summary', value: 'summary' },
  { label: '(e) Edit / Delete', value: 'edit' },
];

export function getMenuItems(timerRunning) {
  const timerItem = timerRunning
    ? { label: '(t) Stop Timer', value: 'timer-stop' }
    : { label: '(t) Start Timer', value: 'timer-start' };
  return [...baseItems, timerItem, { label: '(q) Exit', value: 'exit' }];
}

export default function MainMenu({ onSelect, timerRunning }) {
  const { exit } = useApp();
  const items = getMenuItems(timerRunning);

  const handleAction = (value) => {
    if (value === 'exit') {
      exit();
      return;
    }
    onSelect(value);
  };

  useInput((ch) => {
    if (ch === 't') {
      handleAction(timerRunning ? 'timer-stop' : 'timer-start');
      return;
    }
    const value = SHORTCUTS[ch];
    if (value && value !== 'timer') {
      handleAction(value);
    }
  });

  const handleSelect = (item) => {
    handleAction(item.value);
  };

  return (
    <Box flexDirection="column">
      <Text dimColor>Arrow keys + Enter or press shortcut key</Text>
      <Box marginTop={1}>
        <SelectInput items={items} onSelect={handleSelect} />
      </Box>
    </Box>
  );
}
