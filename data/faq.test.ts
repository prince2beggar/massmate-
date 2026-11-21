import test from 'node:test';
import assert from 'node:assert/strict';
import { FAQ_CATEGORIES, FAQ_CATEGORY_GROUPS, FAQ_ITEMS } from './faq';

test('FAQ defines the exact 4 categories plus All Questions filter', () => {
  assert.deepEqual(
    FAQ_CATEGORY_GROUPS.map((g) => g.label.en),
    [
      'General Questions',
      'Subscription & Pricing',
      'Features & Management',
      'Security & Support',
    ]
  );
  assert.equal(FAQ_CATEGORIES.length, 5);
  assert.equal(FAQ_CATEGORIES[0].id, 'all');
});

test('FAQ contains all 12 exact Task 11 questions and answers in order', () => {
  assert.equal(FAQ_ITEMS.length, 12);

  const expectedPairs: Array<[string, string, string]> = [
    [
      'general',
      'What is MessMate?',
      'MessMate is a platform designed to organize mess management, including members, meals, bazar expenses, rent, bills and everyday activities.',
    ],
    [
      'general',
      'Who can use MessMate?',
      'Students, bachelors, job holders, shared apartments, hostels and accommodation businesses can use MessMate.',
    ],
    [
      'general',
      'Do I need technical knowledge to use MessMate?',
      'No. MessMate is designed to provide a simple and user-friendly management experience.',
    ],
    [
      'subscription-pricing',
      'Does MessMate offer a free trial?',
      'Yes. The Starter plan includes a 7-day free trial. After the trial, the subscription price is ৳99 per month.',
    ],
    [
      'subscription-pricing',
      'Can I manage multiple messes?',
      'Multiple mess management is intended for the Customized Business Plan. Contact the team to discuss your requirements.',
    ],
    [
      'subscription-pricing',
      'Can I get a customized subscription plan?',
      'Yes. Businesses managing multiple messes, hostels or accommodation properties can request customized pricing.',
    ],
    [
      'subscription-pricing',
      'Are domain registration and renewal included in the subscription?',
      'Domain registration, renewal and third-party service charges may be billed separately.',
    ],
    [
      'features-management',
      'Can I manage meals and bazar expenses?',
      'Yes. MessMate is designed to organize meal tracking, bazar records and related expenses.',
    ],
    [
      'features-management',
      'Can members see their own financial statements?',
      'The planned member portal will allow members to view their own financial information, subject to appropriate access permissions.',
    ],
    [
      'features-management',
      'Can I customize my mess website?',
      'MessMate is designed to support mess-specific branding and website customization, depending on the available plan features.',
    ],
    [
      'security-support',
      'Is member information private?',
      'MessMate is designed with role-based access and tenant data isolation. Access to private information should be limited to authorized users.',
    ],
    [
      'security-support',
      'How can I contact MessMate?',
      'Visitors can use the Contact section to submit an inquiry once backend contact submission is available.',
    ],
  ];

  expectedPairs.forEach(([category, question, answer], idx) => {
    const item = FAQ_ITEMS[idx];
    assert.equal(item.category, category);
    assert.equal(item.question.en, question);
    assert.equal(item.answer.en, answer);
    assert.ok(item.question.bn.trim().length > 0);
    assert.ok(item.answer.bn.trim().length > 0);
  });
});
