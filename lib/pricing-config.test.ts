import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CUSTOM_BUSINESS_CAPABILITIES,
  CUSTOM_BUSINESS_CATEGORIES,
  CUSTOM_PACKAGE_DISCOVERY_CARDS,
  CUSTOM_PLAN_CONFIG,
  STARTER_PLAN_CONFIG,
  formatBdtPrice,
} from './pricing-config';

test('STARTER_PLAN_CONFIG defines 7-day trial, ৳99/month, no auto-renewal, and 9 features', () => {
  assert.equal(STARTER_PLAN_CONFIG.trialDays, 7);
  assert.equal(STARTER_PLAN_CONFIG.monthlyPriceBdt, 99);
  assert.equal(STARTER_PLAN_CONFIG.autoRenewal, false);
  assert.equal(formatBdtPrice(STARTER_PLAN_CONFIG.monthlyPriceBdt), '৳99');
  assert.equal(STARTER_PLAN_CONFIG.features.length, 9);
  assert.deepEqual(
    STARTER_PLAN_CONFIG.features.map((item) => item.en),
    [
      'One Mess Management',
      'Member Management',
      'Meal Management',
      'Bazar Management',
      'Rent and Utility Management',
      'Monthly Financial Reports',
      'Basic Mess Website',
      'Basic Website Customization',
      'Standard Features',
    ]
  );
});

test('CUSTOM_PLAN_CONFIG defines non-fixed custom pricing, 9 target categories, and 11 capabilities', () => {
  assert.equal(CUSTOM_PLAN_CONFIG.pricingModel, 'custom');
  assert.equal(CUSTOM_PLAN_CONFIG.fixedPrice, false);
  assert.equal(CUSTOM_BUSINESS_CATEGORIES.length, 9);
  assert.equal(CUSTOM_BUSINESS_CAPABILITIES.length, 11);
  assert.deepEqual(
    CUSTOM_BUSINESS_CATEGORIES.map((c) => c.label.en),
    [
      'Multiple Mess Management',
      'Student Hostel Management',
      'Bachelor Hostel Management',
      'Shared Apartment Management',
      'Student Accommodation Management',
      'Staff Accommodation Management',
      'Boarding House Management',
      'Co-living Space Management',
      'Multi-property Rental Management',
    ]
  );
});

test('CUSTOM_PACKAGE_DISCOVERY_CARDS defines the three custom discovery cards', () => {
  assert.equal(CUSTOM_PACKAGE_DISCOVERY_CARDS.length, 3);
  assert.deepEqual(
    CUSTOM_PACKAGE_DISCOVERY_CARDS.map((card) => card.title.en),
    ['Multiple Mess', 'Hostel & Accommodation', 'Multi-Property Business']
  );
});
