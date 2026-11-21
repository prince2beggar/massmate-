import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FOOTER_CONTACT_INFO,
  FOOTER_LEGAL_LINKS,
  FOOTER_PLATFORM_LINKS,
  FOOTER_QUICK_LINKS,
  FOOTER_SOCIAL_LINKS,
  resolveFooterHref,
} from './footer';

test('Footer quick links include all 7 required links and resolve cleanly on home vs subpages', () => {
  assert.deepEqual(
    FOOTER_QUICK_LINKS.map((item) => item.label.en),
    ['Home', 'About Us', 'Features', 'How It Works', 'Pricing', 'FAQ', 'Contact']
  );

  for (const item of FOOTER_QUICK_LINKS) {
    assert.ok(resolveFooterHref(item, '/').startsWith('#'));
    assert.ok(resolveFooterHref(item, '/about').startsWith('/'));
  }
});

test('Footer platform and legal links match Task 12 requirements with defined routes', () => {
  assert.deepEqual(
    FOOTER_PLATFORM_LINKS.map((item) => item.label.en),
    ['Mess Admin Login', 'Member Portal', 'Room Rental', 'Start Free Trial']
  );

  assert.deepEqual(
    FOOTER_LEGAL_LINKS.map((item) => item.label.en),
    ['Privacy Policy', 'Terms & Conditions', 'Refund Policy']
  );

  assert.equal(FOOTER_SOCIAL_LINKS.length, 4);
  for (const social of FOOTER_SOCIAL_LINKS) {
    assert.equal(social.href, '#social-coming-soon');
  }
});

test('Footer contact placeholders never contain invented email addresses or phone numbers', () => {
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const digitPhoneRegex = /\+?\d[\d\s-]{6,}/;

  const values = [
    FOOTER_CONTACT_INFO.emailPlaceholder.en,
    FOOTER_CONTACT_INFO.phonePlaceholder.en,
    FOOTER_CONTACT_INFO.locationReference.en,
  ];

  for (const value of values) {
    assert.equal(emailRegex.test(value), false);
    assert.equal(digitPhoneRegex.test(value), false);
  }
  assert.ok(FOOTER_CONTACT_INFO.locationReference.en.includes('Bangladesh'));
});
