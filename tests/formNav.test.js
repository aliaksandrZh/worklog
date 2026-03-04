import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { goBack } from '../src/formNav.js';

describe('goBack', () => {
  it('returns null at step 0', () => {
    assert.equal(goBack(0, ['a', 'b'], {}), null);
  });

  it('goes back one step with string fields', () => {
    const result = goBack(2, ['date', 'type', 'number'], { date: '3/4/2026', type: 'Bug' });
    assert.deepEqual(result, { step: 1, input: 'Bug' });
  });

  it('goes back one step with object fields (key property)', () => {
    const fields = [
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' },
    ];
    const result = goBack(1, fields, { date: '3/4/2026' });
    assert.deepEqual(result, { step: 0, input: '3/4/2026' });
  });

  it('returns empty string for missing value', () => {
    const result = goBack(1, ['date', 'type'], {});
    assert.deepEqual(result, { step: 0, input: '' });
  });

  it('goes back from last step', () => {
    const fields = ['a', 'b', 'c'];
    const result = goBack(2, fields, { a: '1', b: '2' });
    assert.deepEqual(result, { step: 1, input: '2' });
  });
});
