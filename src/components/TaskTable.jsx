import React from 'react';
import { Box, Text } from 'ink';

const COL = { date: 12, type: 6, number: 8, name: 30, timeSpent: 8, comments: 20 };

function pad(str, len) {
  const s = String(str || '');
  return s.length > len ? s.slice(0, len - 1) + '…' : s.padEnd(len);
}

export default function TaskTable({ tasks, showIndex = false }) {
  if (!tasks || tasks.length === 0) {
    return <Text color="gray">No tasks to display.</Text>;
  }

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        {showIndex ? pad('#', 4) : ''}
        {pad('Date', COL.date)}
        {pad('Type', COL.type)}
        {pad('Number', COL.number)}
        {pad('Name', COL.name)}
        {pad('Time', COL.timeSpent)}
        {pad('Comments', COL.comments)}
      </Text>
      {tasks.map((t, i) => (
        <Text key={i}>
          {showIndex ? pad(String(i + 1), 4) : ''}
          {pad(t.date, COL.date)}
          {pad(t.type, COL.type)}
          {pad(t.number, COL.number)}
          {pad(t.name, COL.name)}
          {pad(t.timeSpent, COL.timeSpent)}
          {pad(t.comments, COL.comments)}
        </Text>
      ))}
    </Box>
  );
}
