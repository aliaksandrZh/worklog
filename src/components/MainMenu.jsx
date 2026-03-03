import React from 'react';
import { Box, Text, useApp } from 'ink';
import SelectInput from 'ink-select-input';

const items = [
  { label: 'Add Task', value: 'add' },
  { label: 'Paste Tasks', value: 'paste' },
  { label: 'View Summary', value: 'summary' },
  { label: 'Edit / Delete', value: 'edit' },
  { label: 'Exit', value: 'exit' },
];

export default function MainMenu({ onSelect }) {
  const { exit } = useApp();

  const handleSelect = (item) => {
    if (item.value === 'exit') {
      exit();
      return;
    }
    onSelect(item.value);
  };

  return (
    <Box flexDirection="column">
      <Text dimColor>Use arrow keys to navigate, Enter to select</Text>
      <Box marginTop={1}>
        <SelectInput items={items} onSelect={handleSelect} />
      </Box>
    </Box>
  );
}
