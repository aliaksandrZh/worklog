import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { loadTasks, deleteTask } from '../store.js';
import EditForm from './EditForm.jsx';

export default function EditDelete({ onDone, onMessage }) {
  const [phase, setPhase] = useState('list'); // list | action | edit | confirmDelete
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [tasks, setTasks] = useState(() => loadTasks());

  const items = useMemo(() => {
    const taskItems = tasks.map((t, i) => ({
      label: `${t.date} | ${t.type} ${t.number}: ${t.name} (${t.timeSpent})`,
      value: i,
    }));
    taskItems.push({ label: '← Back to menu', value: -1 });
    return taskItems;
  }, [tasks]);

  const actionItems = [
    { label: 'Edit', value: 'edit' },
    { label: 'Delete', value: 'delete' },
    { label: '← Back to list', value: 'back' },
  ];

  useInput((ch, key) => {
    if (key.escape) {
      if (phase === 'action' || phase === 'confirmDelete') {
        setPhase('list');
      } else {
        onDone();
      }
    }
    if (phase === 'confirmDelete') {
      if (ch === 'y' || ch === 'Y') {
        deleteTask(selectedIndex);
        onMessage('Task deleted!');
        setTasks(loadTasks());
        setPhase('list');
      }
      if (ch === 'n' || ch === 'N') {
        setPhase('list');
      }
    }
  });

  if (tasks.length === 0) {
    return (
      <Box flexDirection="column">
        <Text>No tasks found. Press Escape to go back.</Text>
      </Box>
    );
  }

  if (phase === 'list') {
    return (
      <Box flexDirection="column">
        <Text bold>Select a task to edit or delete:</Text>
        <Text dimColor>Press Escape to go back</Text>
        <Box marginTop={1}>
          <SelectInput
            items={items}
            onSelect={(item) => {
              if (item.value === -1) {
                onDone();
                return;
              }
              setSelectedIndex(item.value);
              setPhase('action');
            }}
          />
        </Box>
      </Box>
    );
  }

  if (phase === 'action') {
    const t = tasks[selectedIndex];
    return (
      <Box flexDirection="column">
        <Text bold>
          {t.date} | {t.type} {t.number}: {t.name} ({t.timeSpent})
        </Text>
        <Box marginTop={1}>
          <SelectInput
            items={actionItems}
            onSelect={(item) => {
              if (item.value === 'edit') setPhase('edit');
              else if (item.value === 'delete') setPhase('confirmDelete');
              else setPhase('list');
            }}
          />
        </Box>
      </Box>
    );
  }

  if (phase === 'edit') {
    return (
      <EditForm
        task={tasks[selectedIndex]}
        taskIndex={selectedIndex}
        onDone={() => {
          setTasks(loadTasks());
          setPhase('list');
        }}
        onMessage={onMessage}
      />
    );
  }

  if (phase === 'confirmDelete') {
    const t = tasks[selectedIndex];
    return (
      <Box flexDirection="column">
        <Text bold color="red">Delete this task?</Text>
        <Text>{t.date} | {t.type} {t.number}: {t.name}</Text>
        <Text color="yellow">Press Y to confirm, N to cancel</Text>
      </Box>
    );
  }

  return null;
}
