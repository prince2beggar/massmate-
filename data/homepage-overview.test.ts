import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOMEPAGE_OVERVIEW_FEATURES,
  TRUST_BENEFITS,
} from './homepage-overview';

test('TRUST_BENEFITS defines the exact four Task 05 platform benefits without fake stats', () => {
  assert.equal(TRUST_BENEFITS.length, 4);
  assert.deepEqual(
    TRUST_BENEFITS.map((item) => item.title.en),
    [
      'All-in-One Management',
      'Transparent Finance',
      'Organized Community',
      'Privacy & Security',
    ]
  );
  for (const item of TRUST_BENEFITS) {
    assert.ok(item.description.en.length > 20);
    assert.ok(item.description.bn.length > 10);
    assert.equal(/\d{3,}|thousands|hundreds/i.test(item.description.en), false);
  }
});

test('HOMEPAGE_OVERVIEW_FEATURES defines all eight Task 05 feature cards in order', () => {
  assert.equal(HOMEPAGE_OVERVIEW_FEATURES.length, 8);
  assert.deepEqual(
    HOMEPAGE_OVERVIEW_FEATURES.map((item) => item.title.en),
    [
      'Member Management',
      'Meal Management',
      'Bazar Management',
      'Finance & Bills',
      'Room Management',
      'Community & Notices',
      'Rental Management',
      'Emergency & Safety',
    ]
  );

  for (const feature of HOMEPAGE_OVERVIEW_FEATURES) {
    assert.ok(feature.sectionHref.startsWith('#'));
    assert.ok(feature.description.en.length > 20);
    assert.ok(feature.description.bn.length > 10);
  }
});
