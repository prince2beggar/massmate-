import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ABOUT_HOW_MESSMATE_HELPS,
  ABOUT_MISSION_VISION,
  ABOUT_PROBLEMS_SOLVED,
  ABOUT_TARGET_AUDIENCES,
  ABOUT_WHY_CHOOSE_ITEMS,
  CENTRALIZED_CONTACT_PLACEHOLDERS,
  CONTACT_INFO_CHANNELS,
  HOMEPAGE_INQUIRY_TYPES,
} from './about-contact';
import {
  validateHomepageContactForm,
  type HomepageContactFormValues,
} from '../lib/homepage-contact-validation';

test('About content covers all 7 audiences, 6 problems, 6 solutions, exact mission/vision, and 4 highlights', () => {
  assert.equal(ABOUT_TARGET_AUDIENCES.length, 7);
  assert.equal(ABOUT_PROBLEMS_SOLVED.length, 6);
  assert.equal(ABOUT_HOW_MESSMATE_HELPS.length, 6);
  assert.equal(ABOUT_WHY_CHOOSE_ITEMS.length, 4);

  assert.equal(
    ABOUT_MISSION_VISION.mission.statement.en,
    'To make shared living management simpler, more transparent and more organized through accessible technology.'
  );
  assert.equal(
    ABOUT_MISSION_VISION.vision.statement.en,
    'To become a trusted management platform for messes, hostels and shared accommodation businesses.'
  );
  assert.deepEqual(
    ABOUT_WHY_CHOOSE_ITEMS.map((item) => item.title.en),
    [
      'Easy to Use',
      'Transparent Management',
      'Flexible for Different Businesses',
      'Organized Community',
    ]
  );
});

test('Centralized contact placeholders cover all 4 channels without inventing real emails or phone numbers', () => {
  assert.equal(CONTACT_INFO_CHANNELS.length, 4);
  assert.deepEqual(
    CONTACT_INFO_CHANNELS.map((c) => c.title.en),
    [
      'General Inquiries',
      'Sales & Custom Solutions',
      'Technical Support',
      'Business Partnerships',
    ]
  );

  // Confirm no invented email addresses or digit-based phone numbers exist in placeholders
  assert.equal(CENTRALIZED_CONTACT_PLACEHOLDERS.email.en.includes('@'), false);
  assert.equal(/\d{5,}/.test(CENTRALIZED_CONTACT_PLACEHOLDERS.phone.en), false);
  assert.equal(
    CENTRALIZED_CONTACT_PLACEHOLDERS.officeAddress.en,
    'Office address to be announced'
  );
});

test('HOMEPAGE_INQUIRY_TYPES defines all 6 required inquiry categories', () => {
  assert.deepEqual(
    HOMEPAGE_INQUIRY_TYPES.map((item) => item.label.en),
    [
      'General Inquiry',
      'Subscription & Pricing',
      'Custom Business Solution',
      'Technical Support',
      'Partnership',
      'Other',
    ]
  );
});

test('validateHomepageContactForm accepts valid input with optional empty phone and rejects invalid input', () => {
  const validNoPhone: HomepageContactFormValues = {
    fullName: 'Nadia Rahman',
    email: 'nadia@example.com',
    phone: '',
    inquiryType: 'general',
    subject: 'Question about Starter trial',
    message: 'Can we try MessMate for 7 days for our 10-member student mess?',
  };
  const okResult = validateHomepageContactForm(validNoPhone, 'en');
  assert.equal(okResult.valid, true);
  assert.deepEqual(okResult.errors, {});

  const validWithPhone = validateHomepageContactForm(
    { ...validNoPhone, phone: '+880 1700-000000' },
    'en'
  );
  assert.equal(validWithPhone.valid, true);

  const invalidResult = validateHomepageContactForm(
    {
      fullName: 'A',
      email: 'not-an-email',
      phone: '123',
      inquiryType: '',
      subject: 'Hi',
      message: 'Short',
    },
    'en'
  );
  assert.equal(invalidResult.valid, false);
  assert.ok(invalidResult.errors.fullName);
  assert.ok(invalidResult.errors.email);
  assert.ok(invalidResult.errors.phone);
  assert.ok(invalidResult.errors.inquiryType);
  assert.ok(invalidResult.errors.subject);
  assert.ok(invalidResult.errors.message);
});
