import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_RENTAL_SHOWCASE_ITEMS } from '../data/homepage-workflow-rentals';
import {
  filterDemoShowcaseRooms,
  validateRoomInfoRequest,
} from './showcase-rental-filter';

test('filterDemoShowcaseRooms returns all 3 items with default criteria and filters by type, location, and budget', () => {
  const all = filterDemoShowcaseRooms(DEMO_RENTAL_SHOWCASE_ITEMS, {
    locationQuery: '',
    roomType: 'all',
    maxBudget: 'any',
  });
  assert.equal(all.length, 3);

  const privateOnly = filterDemoShowcaseRooms(DEMO_RENTAL_SHOWCASE_ITEMS, {
    locationQuery: '',
    roomType: 'private-room',
    maxBudget: 'any',
  });
  assert.equal(privateOnly.length, 1);
  assert.equal(privateOnly[0].title.en, 'Private Room');

  const budgetFiltered = filterDemoShowcaseRooms(DEMO_RENTAL_SHOWCASE_ITEMS, {
    locationQuery: '',
    roomType: 'all',
    maxBudget: '4500',
  });
  assert.equal(budgetFiltered.length, 2);

  const locationFiltered = filterDemoShowcaseRooms(DEMO_RENTAL_SHOWCASE_ITEMS, {
    locationQuery: 'uttara',
    roomType: 'all',
    maxBudget: 'any',
  });
  assert.equal(locationFiltered.length, 1);
  assert.equal(locationFiltered[0].location.en, 'Uttara, Dhaka');
});

test('validateRoomInfoRequest validates required name and email/phone contact cleanly', () => {
  const empty = validateRoomInfoRequest(
    { name: '', contact: '', note: '' },
    'en'
  );
  assert.equal(empty.valid, false);
  assert.ok(empty.errors.name);
  assert.ok(empty.errors.contact);

  const validEmail = validateRoomInfoRequest(
    { name: 'Nabil Hasan', contact: 'nabil@example.com', note: 'Prefer morning call' },
    'en'
  );
  assert.equal(validEmail.valid, true);

  const validPhone = validateRoomInfoRequest(
    { name: 'Nabil Hasan', contact: '+880 1711-000000', note: '' },
    'bn'
  );
  assert.equal(validPhone.valid, true);
});
