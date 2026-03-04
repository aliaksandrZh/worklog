import React, { useState } from 'react';
import { Box, Text } from 'ink';
import MainMenu from './components/MainMenu.jsx';
import AddTask from './components/AddTask.jsx';
import PasteTasks from './components/PasteTasks.jsx';
import ViewSummary from './components/ViewSummary.jsx';
import EditDelete from './components/EditDelete.jsx';

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [message, setMessage] = useState('');

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const clearScreen = () => process.stdout.write('\x1B[2J\x1B[H');

  const goHome = () => { clearScreen(); setScreen('menu'); };
  const navigate = (s) => { clearScreen(); setScreen(s); };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">{'━'.repeat(40)}</Text>
      <Text bold color="cyan">  Task Tracker</Text>
      <Text bold color="cyan">{'━'.repeat(40)}</Text>

      {message ? <Text color="green">{message}</Text> : null}

      <Box marginTop={1}>
        {screen === 'menu' && <MainMenu onSelect={navigate} />}
        {screen === 'add' && <AddTask onDone={goHome} onMessage={showMessage} />}
        {screen === 'paste' && <PasteTasks onDone={goHome} onMessage={showMessage} />}
        {screen === 'summary' && <ViewSummary onDone={goHome} />}
        {screen === 'edit' && <EditDelete onDone={goHome} onMessage={showMessage} />}
      </Box>
    </Box>
  );
}
