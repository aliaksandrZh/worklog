import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ORIGINAL_CWD = process.cwd();
const TMP_DIR = path.join(ORIGINAL_CWD, '.test-tmp-timer');

async function getTimer() {
  const mod = await import(`../src/timer.js?t=${Date.now()}`);
  return mod;
}

describe('formatElapsed', () => {
  it('formats hours and minutes', async () => {
    const { formatElapsed } = await getTimer();
    assert.equal(formatElapsed(90 * 60000), '1h 30m');
  });

  it('formats hours only', async () => {
    const { formatElapsed } = await getTimer();
    assert.equal(formatElapsed(120 * 60000), '2h');
  });

  it('formats minutes only', async () => {
    const { formatElapsed } = await getTimer();
    assert.equal(formatElapsed(45 * 60000), '45m');
  });

  it('formats zero', async () => {
    const { formatElapsed } = await getTimer();
    assert.equal(formatElapsed(0), '0m');
  });
});

describe('timer', () => {
  beforeEach(() => {
    fs.mkdirSync(TMP_DIR, { recursive: true });
    process.chdir(TMP_DIR);
  });

  afterEach(() => {
    process.chdir(ORIGINAL_CWD);
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it('startTimer creates .timer.json', async () => {
    const { startTimer } = await getTimer();
    startTimer({ type: 'Bug', number: '123', name: 'Fix login' });
    assert.ok(fs.existsSync(path.join(TMP_DIR, '.timer.json')));
    const data = JSON.parse(fs.readFileSync(path.join(TMP_DIR, '.timer.json'), 'utf8'));
    assert.equal(data.type, 'Bug');
    assert.equal(data.number, '123');
    assert.equal(data.name, 'Fix login');
    assert.ok(data.startedAt > 0);
  });

  it('startTimer errors when timer already running', async () => {
    const { startTimer } = await getTimer();
    startTimer({ type: 'Bug', number: '123', name: 'Fix login' });
    assert.throws(() => {
      startTimer({ type: 'Task', number: '456', name: 'Other' });
    }, /already running/);
  });

  it('stopTimer returns elapsed and deletes file', async () => {
    const { stopTimer } = await getTimer();
    const startedAt = Date.now() - 30 * 60000;
    fs.writeFileSync(path.join(TMP_DIR, '.timer.json'), JSON.stringify({
      type: 'Bug', number: '123', name: 'Fix login', startedAt,
    }));
    const result = stopTimer();
    assert.equal(result.type, 'Bug');
    assert.equal(result.number, '123');
    assert.equal(result.timeSpent, '30m');
    assert.ok(!fs.existsSync(path.join(TMP_DIR, '.timer.json')));
  });

  it('stopTimer errors when no timer', async () => {
    const { stopTimer } = await getTimer();
    assert.throws(() => stopTimer(), /No timer running/);
  });

  it('getTimerStatus returns timer info', async () => {
    const { startTimer, getTimerStatus } = await getTimer();
    startTimer({ type: 'Task', number: '1', name: 'Something' });
    const status = getTimerStatus();
    assert.equal(status.type, 'Task');
    assert.equal(status.number, '1');
    assert.ok(status.elapsed >= 0);
    assert.ok(status.timeSpent);
  });

  it('getTimerStatus returns null when no timer', async () => {
    const { getTimerStatus } = await getTimer();
    assert.equal(getTimerStatus(), null);
  });
});
