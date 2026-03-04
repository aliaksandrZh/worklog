import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import MainMenu from './components/MainMenu.jsx';
import AddTask from './components/AddTask.jsx';
import PasteTasks from './components/PasteTasks.jsx';
import ViewSummary from './components/ViewSummary.jsx';
import EditDelete from './components/EditDelete.jsx';
import TimerStart from './components/TimerStart.jsx';
import { getTimerStatus, stopTimer, formatElapsed } from './timer.js';
import { addTask } from './store.js';
import { checkForUpdates } from './updateCheck.js';

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [message, setMessage] = useState('');
  const [timerInfo, setTimerInfo] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(0);

  const refreshTimer = () => {
    try {
      setTimerInfo(getTimerStatus());
    } catch {
      setTimerInfo(null);
    }
  };

  useEffect(() => {
    refreshTimer();
    const interval = setInterval(refreshTimer, 30000);
    checkForUpdates().then(setUpdateAvailable).catch(() => {});
    return () => clearInterval(interval);
  }, []);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const clearScreen = () => process.stdout.write('\x1B[2J\x1B[H');

  const goHome = () => { clearScreen(); refreshTimer(); setScreen('menu'); };

  const navigate = (s) => {
    if (s === 'timer-stop') {
      handleTimerStop();
      return;
    }
    clearScreen();
    setScreen(s);
  };

  const handleTimerStop = () => {
    try {
      const result = stopTimer();
      const d = new Date();
      const date = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
      addTask({ date, type: result.type, number: result.number, name: result.name, timeSpent: result.timeSpent, comments: '' });
      showMessage(`Timer stopped: ${result.type} ${result.number}: ${result.name} (${result.timeSpent})`);
      refreshTimer();
    } catch (err) {
      showMessage(err.message);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">{'━'.repeat(40)}</Text>
      <Text bold color="cyan">  Worklog</Text>
      <Text bold color="cyan">{'━'.repeat(40)}</Text>

      {updateAvailable > 0 && (
        <Text color="yellow">Update available ({updateAvailable} commit{updateAvailable > 1 ? 's' : ''} behind). Run: git pull</Text>
      )}

      {timerInfo && (
        <Text color="magenta">
          {'⏱ '}{timerInfo.type} {timerInfo.number}: {timerInfo.name} — {formatElapsed(Date.now() - timerInfo.startedAt)}
        </Text>
      )}

      {message ? <Text color="green">{message}</Text> : null}

      <Box marginTop={1}>
        {screen === 'menu' && <MainMenu onSelect={navigate} timerRunning={!!timerInfo} />}
        {screen === 'add' && <AddTask onDone={goHome} onMessage={showMessage} />}
        {screen === 'paste' && <PasteTasks onDone={goHome} onMessage={showMessage} />}
        {screen === 'summary' && <ViewSummary onDone={goHome} />}
        {screen === 'edit' && <EditDelete onDone={goHome} onMessage={showMessage} />}
        {screen === 'timer-start' && <TimerStart onDone={goHome} onMessage={showMessage} />}
      </Box>
    </Box>
  );
}
