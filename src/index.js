import React from 'react';
import { render } from 'ink';
import App from './app.jsx';

// Enter alternate screen buffer (like vim/htop) — clean slate, restores on exit
process.stdout.write('\x1B[?1049h\x1B[H');
const { waitUntilExit } = render(React.createElement(App), { exitOnCtrlC: true });
waitUntilExit().then(() => {
  process.stdout.write('\x1B[?1049l');
});
