import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Store uses process.cwd() to find tasks.csv, so we'll work in a temp dir
const ORIGINAL_CWD = process.cwd();
const TMP_DIR = path.join(ORIGINAL_CWD, '.test-tmp');

beforeEach(() => {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  process.chdir(TMP_DIR);
});

afterEach(() => {
  process.chdir(ORIGINAL_CWD);
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
});

// Dynamic import so store picks up the changed cwd
async function getStore() {
  // Bust module cache by using query param
  const mod = await import(`../src/store.js?t=${Date.now()}`);
  return mod;
}

describe('store', () => {
  it('creates tasks.csv on first load', async () => {
    const { loadTasks } = await getStore();
    const tasks = loadTasks();
    assert.deepEqual(tasks, []);
    assert.ok(fs.existsSync(path.join(TMP_DIR, 'tasks.csv')));
  });

  it('adds and loads a task', async () => {
    const { addTask, loadTasks } = await getStore();
    addTask({ date: '3/3/2026', type: 'Bug', number: '100', name: 'Test', timeSpent: '1h', comments: '' });
    const tasks = loadTasks();
    assert.equal(tasks.length, 1);
    assert.equal(tasks[0].date, '3/3/2026');
    assert.equal(tasks[0].type, 'Bug');
    assert.equal(tasks[0].number, '100');
    assert.equal(tasks[0].name, 'Test');
    assert.equal(tasks[0].timeSpent, '1h');
  });

  it('adds multiple tasks at once', async () => {
    const { addTasks, loadTasks } = await getStore();
    addTasks([
      { date: '3/1/2026', type: 'Bug', number: '1', name: 'A', timeSpent: '1h', comments: '' },
      { date: '3/2/2026', type: 'Task', number: '2', name: 'B', timeSpent: '2h', comments: '' },
    ]);
    const tasks = loadTasks();
    assert.equal(tasks.length, 2);
    assert.equal(tasks[0].number, '1');
    assert.equal(tasks[1].number, '2');
  });

  it('updates a task', async () => {
    const { addTask, updateTask, loadTasks } = await getStore();
    addTask({ date: '3/3/2026', type: 'Bug', number: '1', name: 'Old', timeSpent: '1h', comments: '' });
    updateTask(0, { name: 'New', timeSpent: '2h' });
    const tasks = loadTasks();
    assert.equal(tasks[0].name, 'New');
    assert.equal(tasks[0].timeSpent, '2h');
    assert.equal(tasks[0].type, 'Bug'); // unchanged fields preserved
  });

  it('deletes a task', async () => {
    const { addTasks, deleteTask, loadTasks } = await getStore();
    addTasks([
      { date: '3/1/2026', type: 'Bug', number: '1', name: 'A', timeSpent: '1h', comments: '' },
      { date: '3/2/2026', type: 'Task', number: '2', name: 'B', timeSpent: '2h', comments: '' },
    ]);
    deleteTask(0);
    const tasks = loadTasks();
    assert.equal(tasks.length, 1);
    assert.equal(tasks[0].number, '2');
  });

  it('trims whitespace from loaded values', async () => {
    // Write CSV with trailing spaces manually
    fs.writeFileSync(
      path.join(TMP_DIR, 'tasks.csv'),
      'date,type,number,name,timeSpent,comments\n3/3/2026 ,Bug , 100 ,Test ,1h , note \n'
    );
    const { loadTasks } = await getStore();
    const tasks = loadTasks();
    assert.equal(tasks[0].date, '3/3/2026');
    assert.equal(tasks[0].type, 'Bug');
    assert.equal(tasks[0].number, '100');
    assert.equal(tasks[0].name, 'Test');
    assert.equal(tasks[0].comments, 'note');
  });

  it('handles update with out-of-range index gracefully', async () => {
    const { addTask, updateTask, loadTasks } = await getStore();
    addTask({ date: '3/3/2026', type: 'Bug', number: '1', name: 'A', timeSpent: '1h', comments: '' });
    updateTask(5, { name: 'Nope' }); // should not throw
    const tasks = loadTasks();
    assert.equal(tasks[0].name, 'A'); // unchanged
  });

  it('handles delete with out-of-range index gracefully', async () => {
    const { addTask, deleteTask, loadTasks } = await getStore();
    addTask({ date: '3/3/2026', type: 'Bug', number: '1', name: 'A', timeSpent: '1h', comments: '' });
    deleteTask(5); // should not throw
    const tasks = loadTasks();
    assert.equal(tasks.length, 1);
  });

  it('defaults to today when date is missing', async () => {
    const { addTask, loadTasks } = await getStore();
    addTask({ date: '', type: 'Bug', number: '1', name: 'A', timeSpent: '1h', comments: '' });
    const tasks = loadTasks();
    const d = new Date();
    const today = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    assert.equal(tasks[0].date, today);
  });

  it('defaults to today when date is invalid', async () => {
    const { addTask, loadTasks } = await getStore();
    addTask({ date: 'Task 123: Fix login', type: 'Bug', number: '1', name: 'A', timeSpent: '1h', comments: '' });
    const tasks = loadTasks();
    const d = new Date();
    const today = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    assert.equal(tasks[0].date, today);
  });

  it('keeps valid date as-is', async () => {
    const { addTask, loadTasks } = await getStore();
    addTask({ date: '3/3/2026', type: 'Bug', number: '1', name: 'A', timeSpent: '1h', comments: '' });
    const tasks = loadTasks();
    assert.equal(tasks[0].date, '3/3/2026');
  });
});

describe('isValidDate', () => {
  it('accepts valid M/D/YYYY', async () => {
    const { isValidDate } = await getStore();
    assert.ok(isValidDate('3/5/2026'));
    assert.ok(isValidDate('12/25/2026'));
  });

  it('rejects empty/null', async () => {
    const { isValidDate } = await getStore();
    assert.ok(!isValidDate(''));
    assert.ok(!isValidDate(null));
    assert.ok(!isValidDate(undefined));
  });

  it('rejects non-date strings', async () => {
    const { isValidDate } = await getStore();
    assert.ok(!isValidDate('Task 123: Fix login'));
    assert.ok(!isValidDate('not a date'));
  });

  it('rejects out-of-range values', async () => {
    const { isValidDate } = await getStore();
    assert.ok(!isValidDate('13/1/2026'));
    assert.ok(!isValidDate('0/1/2026'));
    assert.ok(!isValidDate('1/32/2026'));
  });
});
