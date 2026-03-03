import React from 'react';
import { Box, Text, useStdout } from 'ink';

const FIXED = { date: 12, type: 6, number: 8, timeSpent: 8 };
const MIN_NAME = 10;
const MIN_COMMENTS = 5;

function pad(str, len) {
  const s = String(str || '');
  return s.length > len ? s.slice(0, len - 1) + '…' : s.padEnd(len);
}

export default function TaskTable({ tasks, showIndex = false }) {
  const { stdout } = useStdout();
  const width = stdout?.columns || 80;

  if (!tasks || tasks.length === 0) {
    return <Text color="gray">No tasks to display.</Text>;
  }

  const fixedWidth = FIXED.date + FIXED.type + FIXED.number + FIXED.timeSpent + (showIndex ? 4 : 0);
  const remaining = Math.max(MIN_NAME + MIN_COMMENTS, width - fixedWidth);
  const nameWidth = Math.floor(remaining * 0.65);
  const commentsWidth = remaining - nameWidth;

  return (
    <Box flexDirection="column" width={width}>
      <Text bold color="cyan">
        {showIndex ? pad('#', 4) : ''}
        {pad('Date', FIXED.date)}
        {pad('Type', FIXED.type)}
        {pad('Number', FIXED.number)}
        {pad('Name', nameWidth)}
        {pad('Time', FIXED.timeSpent)}
        {pad('Comments', commentsWidth)}
      </Text>
      {tasks.map((t, i) => (
        <Text key={i}>
          {showIndex ? pad(String(i + 1), 4) : ''}
          {pad(t.date, FIXED.date)}
          {pad(t.type, FIXED.type)}
          {pad(t.number, FIXED.number)}
          {pad(t.name, nameWidth)}
          {pad(t.timeSpent, FIXED.timeSpent)}
          {pad(t.comments, commentsWidth)}
        </Text>
      ))}
    </Box>
  );
}
