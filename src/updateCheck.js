import { exec } from 'node:child_process';

/**
 * Checks if local branch is behind remote.
 * Returns a promise that resolves to the number of commits behind, or 0.
 * Resolves to 0 on any error (no git, no remote, offline, etc.)
 */
export function checkForUpdates() {
  return new Promise((resolve) => {
    exec('git fetch --quiet', { timeout: 5000 }, (err) => {
      if (err) return resolve(0);
      exec('git rev-list --count HEAD..@{u}', { timeout: 5000 }, (err, stdout) => {
        if (err) return resolve(0);
        resolve(parseInt(stdout.trim(), 10) || 0);
      });
    });
  });
}
