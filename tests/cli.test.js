import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const TMP_DIR = path.join(ROOT, '.test-tmp-cli');
const CLI = path.join(ROOT, 'src/cli.js');

function run(args) {
  return execSync(`tsx ${CLI} ${args}`, {
    cwd: TMP_DIR,
    encoding: 'utf8',
    timeout: 10000,
  });
}

describe('cli: add', () => {
  beforeEach(() => { fs.mkdirSync(TMP_DIR, { recursive: true }); });
  afterEach(() => { fs.rmSync(TMP_DIR, { recursive: true, force: true }); });

  it('saves a task to CSV', () => {
    run('add Bug 12345: Fix login 1h');
    const csv = fs.readFileSync(path.join(TMP_DIR, 'tasks.csv'), 'utf8');
    assert.ok(csv.includes('Bug'));
    assert.ok(csv.includes('12345'));
    assert.ok(csv.includes('Fix login'));
    assert.ok(csv.includes('1h'));
  });

  it('prints confirmation', () => {
    const output = run('add Task 99: Add tests 2h');
    assert.ok(output.includes('Added'));
    assert.ok(output.includes('Task'));
    assert.ok(output.includes('99'));
  });

  it('errors with no args', () => {
    assert.throws(() => run('add'), /Usage/);
  });
});

describe('cli: today', () => {
  beforeEach(() => { fs.mkdirSync(TMP_DIR, { recursive: true }); });
  afterEach(() => { fs.rmSync(TMP_DIR, { recursive: true, force: true }); });

  it('shows only today tasks', () => {
    run('add Bug 1: Today task 1h');
    const output = run('today');
    assert.ok(output.includes('Today task'));
    assert.ok(output.includes('1.0h'));
  });

  it('shows message when no tasks', () => {
    const output = run('today');
    assert.ok(output.includes('No tasks for today'));
  });
});

describe('cli: week', () => {
  beforeEach(() => { fs.mkdirSync(TMP_DIR, { recursive: true }); });
  afterEach(() => { fs.rmSync(TMP_DIR, { recursive: true, force: true }); });

  it('shows current week tasks', () => {
    run('add Task 2: Week task 30m');
    const output = run('week');
    assert.ok(output.includes('Week task'));
  });
});

describe('cli: timer', () => {
  beforeEach(() => { fs.mkdirSync(TMP_DIR, { recursive: true }); });
  afterEach(() => { fs.rmSync(TMP_DIR, { recursive: true, force: true }); });

  it('start → status → stop cycle', () => {
    const startOut = run('start Bug 123: Fix login');
    assert.ok(startOut.includes('Timer started'));

    const statusOut = run('status');
    assert.ok(statusOut.includes('Running'));
    assert.ok(statusOut.includes('Bug'));

    const stopOut = run('stop');
    assert.ok(stopOut.includes('Stopped'));

    // Verify task was saved
    const csv = fs.readFileSync(path.join(TMP_DIR, 'tasks.csv'), 'utf8');
    assert.ok(csv.includes('Bug'));
    assert.ok(csv.includes('123'));
  });

  it('status with no timer', () => {
    const output = run('status');
    assert.ok(output.includes('No timer running'));
  });

  it('stop with no timer errors', () => {
    assert.throws(() => run('stop'), /No timer running/);
  });

  it('double start errors', () => {
    run('start Task 1: Something');
    assert.throws(() => run('start Task 2: Other'), /already running/);
  });
});

describe('cli: unknown command', () => {
  beforeEach(() => { fs.mkdirSync(TMP_DIR, { recursive: true }); });
  afterEach(() => { fs.rmSync(TMP_DIR, { recursive: true, force: true }); });

  it('errors on unknown subcommand', () => {
    assert.throws(() => run('foobar'), /Unknown command/);
  });
});
