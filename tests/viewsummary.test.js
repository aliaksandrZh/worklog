import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { groupByDate, sortTasks } from '../src/utils.js';

function makeTasks() {
  return [
    { date: '3/5/2026', type: 'Bug', number: '100', name: 'Fix login', timeSpent: '1h', comments: '' },
    { date: '3/5/2026', type: 'Task', number: '200', name: 'Add feature', timeSpent: '2h', comments: '' },
    { date: '3/4/2026', type: 'Bug', number: '300', name: 'Fix crash', timeSpent: '30m', comments: '' },
  ];
}

function indexTasks(tasks) {
  return tasks.map((t, i) => ({ ...t, _idx: i }));
}

describe('_idx preservation', () => {
  it('_idx survives through sortTasks', () => {
    const indexed = indexTasks(makeTasks());
    const sorted = sortTasks(indexed, 'number', 'desc');
    // After sorting by number desc: 300, 200, 100
    assert.equal(sorted[0]._idx, 2);
    assert.equal(sorted[1]._idx, 1);
    assert.equal(sorted[2]._idx, 0);
  });

  it('_idx survives through groupByDate', () => {
    const indexed = indexTasks(makeTasks());
    const groups = groupByDate(indexed);
    // Groups sorted by date desc: 3/5/2026 first, then 3/4/2026
    const group35 = groups.find(g => g.key === '3/5/2026');
    const group34 = groups.find(g => g.key === '3/4/2026');
    assert.ok(group35);
    assert.ok(group34);
    // Check _idx preserved
    assert.deepEqual(group35.tasks.map(t => t._idx), [0, 1]);
    assert.deepEqual(group34.tasks.map(t => t._idx), [2]);
  });

  it('_idx survives through groupByDate then sortTasks', () => {
    const indexed = indexTasks(makeTasks());
    const groups = groupByDate(indexed);
    const group35 = groups.find(g => g.key === '3/5/2026');
    const sorted = sortTasks(group35.tasks, 'number', 'desc');
    assert.equal(sorted[0]._idx, 1); // number 200
    assert.equal(sorted[1]._idx, 0); // number 100
  });
});

describe('selectedRow clamping', () => {
  it('clamps to last row when selectedRow exceeds length', () => {
    const tasks = makeTasks();
    const selectedRow = 5;
    const effectiveRow = Math.min(selectedRow, tasks.length - 1);
    assert.equal(effectiveRow, 2);
  });

  it('clamps to -1 when tasks is empty', () => {
    const tasks = [];
    const selectedRow = 0;
    const effectiveRow = Math.min(selectedRow, tasks.length - 1);
    assert.equal(effectiveRow, -1);
  });

  it('handles last row deleted', () => {
    // 3 tasks, selected row 2 (last), after delete there are 2 tasks
    const newLen = 2;
    const selectedRow = 2;
    const effectiveRow = Math.min(selectedRow, newLen - 1);
    assert.equal(effectiveRow, 1);
  });

  it('handles middle row deleted', () => {
    // 3 tasks, selected row 1 (middle), after delete there are 2 tasks
    const newLen = 2;
    const selectedRow = 1;
    const effectiveRow = Math.min(selectedRow, newLen - 1);
    assert.equal(effectiveRow, 1);
  });

  it('handles only row deleted', () => {
    const newLen = 0;
    const selectedRow = 0;
    const effectiveRow = Math.min(selectedRow, newLen - 1);
    assert.equal(effectiveRow, -1);
  });
});
