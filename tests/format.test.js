import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pad, formatTable, FIXED, MIN_NAME, MIN_COMMENTS } from '../src/format.js';

describe('pad', () => {
  it('pads short strings', () => {
    assert.equal(pad('hi', 5), 'hi   ');
  });

  it('truncates long strings with ellipsis', () => {
    assert.equal(pad('hello world', 6), 'hello…');
  });

  it('handles null/undefined', () => {
    assert.equal(pad(null, 5), '     ');
    assert.equal(pad(undefined, 5), '     ');
  });
});

describe('formatTable', () => {
  const tasks = [
    { date: '3/3/2026', type: 'Bug', number: '100', name: 'Fix login', timeSpent: '1h', comments: 'urgent' },
    { date: '3/3/2026', type: 'Task', number: '200', name: 'Add tests', timeSpent: '2h', comments: '' },
  ];

  it('formats tasks with header', () => {
    const output = formatTable(tasks);
    const lines = output.split('\n');
    assert.equal(lines.length, 3); // header + 2 rows
    assert.ok(lines[0].includes('Date'));
    assert.ok(lines[0].includes('Type'));
    assert.ok(lines[0].includes('Name'));
    assert.ok(lines[1].includes('Bug'));
    assert.ok(lines[2].includes('Task'));
  });

  it('handles empty array', () => {
    assert.equal(formatTable([]), 'No tasks to display.');
  });

  it('handles null/undefined', () => {
    assert.equal(formatTable(null), 'No tasks to display.');
  });

  it('truncates long names at narrow width', () => {
    const narrowTasks = [
      { date: '3/3/2026', type: 'Bug', number: '100', name: 'A very long task name that should be truncated', timeSpent: '1h', comments: '' },
    ];
    const output = formatTable(narrowTasks, { width: 60 });
    assert.ok(output.includes('…'));
  });

  it('respects width param', () => {
    const output100 = formatTable(tasks, { width: 100 });
    const output60 = formatTable(tasks, { width: 60 });
    const lines100 = output100.split('\n');
    const lines60 = output60.split('\n');
    // Wider width should produce longer lines
    assert.ok(lines100[0].length >= lines60[0].length);
  });
});
