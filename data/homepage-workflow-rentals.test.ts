import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEMO_RENTAL_SHOWCASE_ITEMS,
  HOW_IT_WORKS_STEPS,
} from './homepage-workflow-rentals';

test('HOW_IT_WORKS_STEPS defines the exact four Task 06 onboarding steps in order', () => {
  assert.equal(HOW_IT_WORKS_STEPS.length, 4);
  assert.deepEqual(
    HOW_IT_WORKS_STEPS.map((step) => step.number),
    ['01', '02', '03', '04']
  );
  assert.deepEqual(
    HOW_IT_WORKS_STEPS.map((step) => step.title.en),
    [
      'Create Your Mess',
      'Invite Your Members',
      'Manage Daily Activities',
      'Stay Organized',
    ]
  );
  for (const step of HOW_IT_WORKS_STEPS) {
    assert.ok(step.description.en.length > 20);
    assert.ok(step.description.bn.length > 10);
  }
});

test('DEMO_RENTAL_SHOWCASE_ITEMS defines the exact three Task 07 demo cards with explicit DEMO DATA flags', () => {
  assert.equal(DEMO_RENTAL_SHOWCASE_ITEMS.length, 3);
  assert.deepEqual(
    DEMO_RENTAL_SHOWCASE_ITEMS.map((item) => ({
      title: item.title.en,
      location: item.location.en,
      rentBdt: item.rentBdt,
      roomType: item.roomType.en,
      facilities: item.facilities.en,
      isDemoData: item.isDemoData,
    })),
    [
      {
        title: 'Student Shared Room',
        location: 'Uttara, Dhaka',
        rentBdt: 3500,
        roomType: 'Shared room',
        facilities: ['WiFi', 'Bed', 'Study Table'],
        isDemoData: true,
      },
      {
        title: 'Private Room',
        location: 'Mirpur, Dhaka',
        rentBdt: 6000,
        roomType: 'Private room',
        facilities: ['WiFi', 'Attached Bathroom', 'Bed'],
        isDemoData: true,
      },
      {
        title: 'Bachelor Shared Apartment',
        location: 'Badda, Dhaka',
        rentBdt: 4500,
        roomType: 'Shared apartment',
        facilities: ['WiFi', 'Kitchen', 'Furniture'],
        isDemoData: true,
      },
    ]
  );
});
