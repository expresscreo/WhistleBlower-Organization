import assert from 'node:assert/strict';
import test from 'node:test';
import { formatNumberWithCommas, parseFormattedNumber } from './utils.js';

test('adds thousand and million separators while typing', () => {
  assert.equal(formatNumberWithCommas('50000'), '50,000');
  assert.equal(formatNumberWithCommas('5000000'), '5,000,000');
  assert.equal(formatNumberWithCommas('5,000,000'), '5,000,000');
});

test('keeps a trailing decimal while typing kobo', () => {
  assert.equal(formatNumberWithCommas('5081.'), '5,081.');
  assert.equal(formatNumberWithCommas('5081.95'), '5,081.95');
});

test('parses formatted figures back to numbers', () => {
  assert.equal(parseFormattedNumber('50,000'), 50000);
  assert.equal(parseFormattedNumber('5,081.95'), 5081.95);
  assert.equal(parseFormattedNumber('-1'), -1);
  assert.equal(Number.isNaN(parseFormattedNumber('')), true);
});

test('preserves a leading minus when allowed', () => {
  assert.equal(formatNumberWithCommas('-1', { allowNegative: true }), '-1');
  assert.equal(formatNumberWithCommas('-1500', { allowNegative: true }), '-1,500');
  assert.equal(formatNumberWithCommas('-1500'), '1,500');
});
