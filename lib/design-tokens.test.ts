import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BREAKPOINT_TOKENS,
  CONTAINER_TOKENS,
  RADIUS_TOKENS,
  SPACING_TOKENS,
  TYPOGRAPHY_SCALE,
  getAllColorTokens,
  isValidHexColor,
} from './design-tokens';

test('all color tokens declare valid 6-digit hex values and unique CSS variables', () => {
  const all = getAllColorTokens();
  assert.ok(all.length >= 12);
  const seen = new Set<string>();
  for (const item of all) {
    assert.equal(isValidHexColor(item.hex), true, `Invalid hex on ${item.name}: ${item.hex}`);
    assert.equal(seen.has(item.token), false, `Duplicate token ${item.token}`);
    seen.add(item.token);
  }
});

test('typography, spacing, radius, container, and breakpoint scales are complete and ordered', () => {
  assert.ok(TYPOGRAPHY_SCALE.length >= 6);
  for (let i = 1; i < SPACING_TOKENS.length; i++) {
    assert.ok(SPACING_TOKENS[i].px > SPACING_TOKENS[i - 1].px);
  }
  assert.equal(CONTAINER_TOKENS.length, 3);
  assert.equal(RADIUS_TOKENS.length, 4);
  assert.ok(BREAKPOINT_TOKENS.length >= 5);
});
