import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MESS_DIRECTORY_CATEGORIES,
  NATIONAL_EMERGENCY_CONTACTS,
  SAFETY_INFORMATION_BLOCKS,
  SAFETY_PRIVACY_SCOPES,
  getSafeTelHref,
} from './emergency-safety';

test('NATIONAL_EMERGENCY_CONTACTS defines exact verified Bangladesh hotlines 999, 102, and 16263', () => {
  assert.equal(NATIONAL_EMERGENCY_CONTACTS.length, 3);
  assert.deepEqual(
    NATIONAL_EMERGENCY_CONTACTS.map((c) => c.number),
    ['999', '102', '16263']
  );
  assert.deepEqual(
    NATIONAL_EMERGENCY_CONTACTS.map((c) => c.serviceName.en),
    [
      'National Emergency Service',
      'Fire Service & Civil Defence',
      'Health Batayon',
    ]
  );
  for (const contact of NATIONAL_EMERGENCY_CONTACTS) {
    assert.equal(contact.verified, true);
    assert.equal(contact.isDemo, false);
    assert.ok(contact.officialSourceDomain.endsWith('.gov.bd'));
    assert.equal(getSafeTelHref(contact), `tel:${contact.number}`);
  }
});

test('getSafeTelHref disables phone actions for unverified or demo contacts', () => {
  assert.equal(
    getSafeTelHref({ number: '999', verified: true, isDemo: false }),
    'tel:999'
  );
  assert.equal(
    getSafeTelHref({ number: '01700000000', verified: false, isDemo: false }),
    null
  );
  assert.equal(
    getSafeTelHref({ number: '01700000000', verified: true, isDemo: true }),
    null
  );
  assert.equal(
    getSafeTelHref({ number: '', verified: true, isDemo: false }),
    null
  );
});

test('MESS_DIRECTORY_CATEGORIES includes all 9 categories as DEMO DATA with no phone numbers', () => {
  assert.equal(MESS_DIRECTORY_CATEGORIES.length, 9);
  assert.deepEqual(
    MESS_DIRECTORY_CATEGORIES.map((item) => item.category.en),
    [
      'Mess Owner',
      'Mess Manager',
      'Local Doctor',
      'Nearby Hospital',
      'Pharmacy',
      'Electrician',
      'Plumber',
      'Building Security',
      'Family Emergency Contact',
    ]
  );
  for (const item of MESS_DIRECTORY_CATEGORIES) {
    assert.equal(item.isDemo, true);
    assert.equal(getSafeTelHref({ number: '12345', verified: true, isDemo: item.isDemo }), null);
  }
});

test('SAFETY_INFORMATION_BLOCKS includes all 6 informational placeholder topics', () => {
  assert.equal(SAFETY_INFORMATION_BLOCKS.length, 6);
  assert.deepEqual(
    SAFETY_INFORMATION_BLOCKS.map((item) => item.title.en),
    [
      'Emergency Exit Information',
      'Fire Safety',
      'First Aid Information',
      'Assembly Point',
      'Building Safety Instructions',
      'Important Safety Notices',
    ]
  );
  for (const block of SAFETY_INFORMATION_BLOCKS) {
    assert.equal(block.isPlaceholder, true);
  }
});

test('SAFETY_PRIVACY_SCOPES covers all 4 public and private visibility models', () => {
  assert.equal(SAFETY_PRIVACY_SCOPES.length, 4);
  assert.deepEqual(
    SAFETY_PRIVACY_SCOPES.map((item) => item.title.en),
    [
      'Public Emergency Contacts',
      'Member-Only Emergency Contacts',
      'Private Family Contact Information',
      'Mess-Specific Safety Instructions',
    ]
  );
});
