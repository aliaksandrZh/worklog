import React from 'react';
import { Box, Text, useStdout } from 'ink';
import TextInput from 'ink-text-input';
import { pad, FIXED, MIN_NAME, MIN_COMMENTS, GAP } from '../format.js';

const TYPE_COLORS = {
  bug: 'red',
  task: 'yellow',
};

function getTypeColor(type) {
  return TYPE_COLORS[(type || '').toLowerCase()] || 'white';
}

export const COLUMNS = ['date', 'type', 'number', 'name', 'timeSpent', 'comments'];

export default function TaskTable({
  tasks,
  showIndex = false,
  sortBy = null,
  sortDir = 'asc',
  selectedRow = -1,
  selectedCol = 0,
  editingCell = false,
  editValue = '',
  onEditChange,
  onEditSubmit,
}) {
  const { stdout } = useStdout();
  const width = stdout?.columns || 80;

  if (!tasks || tasks.length === 0) {
    return <Text color="gray">No tasks to display.</Text>;
  }

  const numCols = showIndex ? 7 : 6;
  const numGaps = numCols - 1;
  const fixedWidth = FIXED.date + FIXED.type + FIXED.number + FIXED.timeSpent + (showIndex ? 4 : 0) + numGaps * GAP.length;
  const remaining = Math.max(MIN_NAME + MIN_COMMENTS, width - fixedWidth - 1);
  const nameWidth = Math.floor(remaining * 0.65);
  const commentsWidth = remaining - nameWidth;

  const colWidths = {
    date: FIXED.date,
    type: FIXED.type,
    number: FIXED.number,
    name: nameWidth,
    timeSpent: FIXED.timeSpent,
    comments: commentsWidth,
  };

  const join = (...parts) => parts.join(GAP);

  const indicator = sortDir === 'asc' ? '▲' : '▼';
  const h = (label, col, w) => pad(sortBy === col ? `${label}${indicator}` : label, w);

  const headerText = join(
    ...(showIndex ? [pad('#', 4)] : []),
    h('Date', 'date', FIXED.date),
    h('Type', 'type', FIXED.type),
    h('Number', 'number', FIXED.number),
    h('Name', 'name', nameWidth),
    h('Time', 'timeSpent', FIXED.timeSpent),
    pad('Comments', commentsWidth),
  );

  return (
    <Box flexDirection="column" width={width}>
      <Text bold color="cyan">{headerText}</Text>
      {tasks.map((t, i) => {
        const isSelected = i === selectedRow;
        const isEditing = isSelected && editingCell;
        const editCol = isEditing ? selectedCol : -1;

        // For editing row, use Box layout so TextInput works
        if (isEditing) {
          return (
            <Box key={i} flexDirection="row" width={width}>
              {showIndex && <Text>{pad(String(i + 1), 4)}{GAP}</Text>}
              {COLUMNS.map((col, ci) => {
                const w = colWidths[col];
                const isActiveCol = ci === selectedCol;
                const isEditingCol = ci === editCol;
                const separator = ci < COLUMNS.length - 1 ? GAP : '';

                if (isEditingCol) {
                  return (
                    <Box key={col} width={w + separator.length}>
                      <Box width={w}>
                        <TextInput value={editValue} onChange={onEditChange} onSubmit={onEditSubmit} />
                      </Box>
                      <Text>{separator}</Text>
                    </Box>
                  );
                }

                const cellText = pad(t[col], w);
                const color = col === 'type' ? getTypeColor(t.type) : undefined;

                return (
                  <Text key={col}>
                    <Text inverse={isActiveCol} bold={isActiveCol} color={color}>{cellText}</Text>
                    <Text>{separator}</Text>
                  </Text>
                );
              })}
            </Box>
          );
        }

        // Non-editing rows (both selected and non-selected): single <Text> line
        // Build cell spans with highlighting for selected row+col
        const cells = [];
        if (showIndex) {
          cells.push(<Text key="idx">{pad(String(i + 1), 4)}{GAP}</Text>);
        }
        COLUMNS.forEach((col, ci) => {
          const w = colWidths[col];
          const cellText = pad(t[col], w);
          const isActiveCol = isSelected && ci === selectedCol;
          const color = col === 'type' ? getTypeColor(t.type) : undefined;
          const separator = ci < COLUMNS.length - 1 ? GAP : '';

          cells.push(
            <Text key={col}>
              <Text inverse={isActiveCol} bold={isActiveCol} color={color}>{cellText}</Text>
              <Text>{separator}</Text>
            </Text>
          );
        });

        return <Text key={i}>{cells}</Text>;
      })}
    </Box>
  );
}
