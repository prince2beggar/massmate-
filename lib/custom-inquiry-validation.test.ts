import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidContactChannel,
  validateCustomPricingInquiry,
  type CustomPricingInquiryValues,
} from './custom-inquiry-validation';

const VALID_INQUIRY: CustomPricingInquiryValues = {
  businessName: 'Northside Student Residences',
  businessCategory: 'student-hostel',
  propertyCount: '4',
  estimatedMembers: '120',
  requiredFeatures: ['Centralized management dashboard', 'Custom domain support'],
  preferredCustomization: 'Custom domain and branded notice portal',
  contactName: 'Mahmudul Hasan',
  contactChannel: 'mahmudul@northside.example',
  additionalRequirements: 'Need separate billing schedules per building.',
};

test('validateCustomPricingInquiry accepts a complete valid inquiry', () => {
  const result = validateCustomPricingInquiry(VALID_INQUIRY, 'en');
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
});

test('validateCustomPricingInquiry accepts valid phone numbers and rejects invalid contact values', () => {
  assert.equal(isValidContactChannel('+880 1711-234890'), true);
  assert.equal(isValidContactChannel('01819456210'), true);
  assert.equal(isValidContactChannel('owner@hostel.bd'), true);
  assert.equal(isValidContactChannel('abc'), false);
  assert.equal(isValidContactChannel(''), false);
});

test('validateCustomPricingInquiry rejects missing required fields with clear field errors', () => {
  const result = validateCustomPricingInquiry(
    {
      businessName: '',
      businessCategory: '',
      propertyCount: '0',
      estimatedMembers: '-5',
      requiredFeatures: [],
      preferredCustomization: '',
      contactName: 'A',
      contactChannel: 'invalid-contact',
      additionalRequirements: '',
    },
    'en'
  );

  assert.equal(result.valid, false);
  assert.ok(result.errors.businessName);
  assert.ok(result.errors.businessCategory);
  assert.ok(result.errors.propertyCount);
  assert.ok(result.errors.estimatedMembers);
  assert.ok(result.errors.requiredFeatures);
  assert.ok(result.errors.contactName);
  assert.ok(result.errors.contactChannel);
});
