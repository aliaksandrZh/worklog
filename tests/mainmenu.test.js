import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SHORTCUTS, getMenuItems } from '../src/components/MainMenu.jsx';

describe('MainMenu shortcuts', () => {
  it('maps all expected shortcut keys', () => {
    assert.equal(SHORTCUTS.a, 'add');
    assert.equal(SHORTCUTS.p, 'paste');
    assert.equal(SHORTCUTS.s, 'summary');
    assert.equal(SHORTCUTS.e, 'edit');
    assert.equal(SHORTCUTS.t, 'timer');
    assert.equal(SHORTCUTS.q, 'exit');
  });

  it('has exactly 6 shortcuts', () => {
    assert.equal(Object.keys(SHORTCUTS).length, 6);
  });

  it('all shortcut values are unique', () => {
    const values = Object.values(SHORTCUTS);
    assert.equal(new Set(values).size, values.length);
  });

  it('all shortcut keys are single lowercase letters', () => {
    for (const key of Object.keys(SHORTCUTS)) {
      assert.match(key, /^[a-z]$/);
    }
  });
});

describe('getMenuItems', () => {
  it('shows Start Timer when no timer running', () => {
    const items = getMenuItems(false);
    const timerItem = items.find(i => i.value === 'timer-start');
    assert.ok(timerItem);
    assert.ok(timerItem.label.includes('Start Timer'));
    assert.ok(!items.find(i => i.value === 'timer-stop'));
  });

  it('shows Stop Timer when timer is running', () => {
    const items = getMenuItems(true);
    const timerItem = items.find(i => i.value === 'timer-stop');
    assert.ok(timerItem);
    assert.ok(timerItem.label.includes('Stop Timer'));
    assert.ok(!items.find(i => i.value === 'timer-start'));
  });

  it('always has Exit as last item', () => {
    const items = getMenuItems(false);
    assert.equal(items[items.length - 1].value, 'exit');
  });

  it('has 6 items total', () => {
    assert.equal(getMenuItems(false).length, 6);
    assert.equal(getMenuItems(true).length, 6);
  });
});
