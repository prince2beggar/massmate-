import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateContactForm,
  isContactFormValid,
  type ContactFormValues,
} from './contact-validation';

const VALID: ContactFormValues = {
  fullName: 'Farhan Hossain',
  email: 'farhan@example.com',
  phone: '+880 1712-345678',
  messType: 'student',
  memberCount: '16',
  subject: 'Onboarding our 16-member mess',
  message: 'We want to migrate our monthly bazar and meal tracking from notebooks to MessMate.',
};

test('accepts a valid contact form submission', () => {
  const errors = validateContactForm(VALID, 'en');
  assert.equal(isContactFormValid(errors), true);
});

test('rejects invalid empty fields with localized errors', () => {
  const empty: ContactFormValues = {
    fullName: '',
    email: 'invalid-email',
    phone: '123',
    messType: 'bachelor',
    memberCount: '0',
    subject: 'Hi',
    message: 'Too short',
  };

  const enErrors = validateContactForm(empty, 'en');
  assert.equal(isContactFormValid(enErrors), false);
  assert.ok(enErrors.fullName);
  assert.ok(enErrors.email);
  assert.ok(enErrors.phone);
  assert.ok(enErrors.memberCount);
  assert.ok(enErrors.subject);
  assert.ok(enErrors.message);

  const bnErrors = validateContactForm(empty, 'bn');
  assert.ok(bnErrors.email?.includes('ইমেইল'));
});
