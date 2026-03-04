import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { pad, FIXED, MIN_NAME, MIN_COMMENTS, GAP } from '../format.js';

export default function TaskTable({ tasks, showIndex = false }) {
  const { stdout } = useStdout();
  const width = stdout?.columns || 80;

  if (!tasks || tasks.length === 0) {
    return <Text color="gray">No tasks to display.</Text>;
  }

  const numCols = showIndex ? 7 : 6;
  const numGaps = numCols - 1;
  const fixedWidth = FIXED.date + FIXED.type + FIXED.number + FIXED.timeSpent + (showIndex ? 4 : 0) + numGaps * GAP.length;
  const remaining = Math.max(MIN_NAME + MIN_COMMENTS, width - fixedWidth);
  const nameWidth = Math.floor(remaining * 0.65);
  const commentsWidth = remaining - nameWidth;

  const join = (...parts) => parts.join(GAP);

  return (
    <Box flexDirection="column" width={width}>
      <Text bold color="cyan">
        {join(
          ...(showIndex ? [pad('#', 4)] : []),
          pad('Date', FIXED.date),
          pad('Type', FIXED.type),
          pad('Number', FIXED.number),
          pad('Name', nameWidth),
          pad('Time', FIXED.timeSpent),
          pad('Comments', commentsWidth),
        )}
      </Text>
      {tasks.map((t, i) => (
        <Text key={i}>
          {join(
            ...(showIndex ? [pad(String(i + 1), 4)] : []),
            pad(t.date, FIXED.date),
            pad(t.type, FIXED.type),
            pad(t.number, FIXED.number),
            pad(t.name, nameWidth),
            pad(t.timeSpent, FIXED.timeSpent),
            pad(t.comments, commentsWidth),
          )}
        </Text>
      ))}
    </Box>
  );
}
