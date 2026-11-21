import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMessSettlement } from './meal-math';

test('computes meal rate and net member settlement accurately', () => {
  const result = calculateMessSettlement(12000, [
    {
      id: 'm1',
      name: 'Tanvir Ahmed',
      roomLabel: 'Room 201',
      meals: 40,
      depositBdt: 9000,
      rentShareBdt: 4500,
      utilityShareBdt: 800,
    },
    {
      id: 'm2',
      name: 'Rafiul Islam',
      roomLabel: 'Room 202',
      meals: 60,
      depositBdt: 10000,
      rentShareBdt: 4500,
      utilityShareBdt: 800,
    },
  ]);

  assert.equal(result.totalMeals, 100);
  assert.equal(result.mealRateBdt, 120);
  // m1: mealCost = 4800, totalCharge = 4800 + 4500 + 800 = 10100, net = 9000 - 10100 = -1100
  assert.equal(result.rows[0].mealCostBdt, 4800);
  assert.equal(result.rows[0].netBalanceBdt, -1100);
  // m2: mealCost = 7200, totalCharge = 7200 + 4500 + 800 = 12500, net = 10000 - 12500 = -2500
  assert.equal(result.rows[1].mealCostBdt, 7200);
  assert.equal(result.rows[1].netBalanceBdt, -2500);
});

test('handles zero meals without NaN', () => {
  const result = calculateMessSettlement(5000, [
    {
      id: 'm1',
      name: 'Nadia Karim',
      roomLabel: 'Room 101',
      meals: 0,
      depositBdt: 5000,
      rentShareBdt: 4000,
      utilityShareBdt: 500,
    },
  ]);

  assert.equal(result.mealRateBdt, 0);
  assert.equal(result.rows[0].netBalanceBdt, 500);
});
