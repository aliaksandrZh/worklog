import React, { useState } from 'react';
import { Box, useInput } from 'ink';
import TextInput from 'ink-text-input';

/**
 * Bordered single-line text input box with cursor navigation.
 * Enter submits, Escape cancels.
 */
export default function BorderedInput({ onSubmit, onCancel, placeholder = 'Start typing...' }) {
  const [input, setInput] = useState('');

  useInput((ch, key) => {
    if (key.escape && onCancel) {
      onCancel();
    }
  });

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
      <TextInput value={input} onChange={setInput} onSubmit={onSubmit} placeholder={placeholder} />
    </Box>
  );
}
