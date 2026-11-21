import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOMEPAGE_SECTIONS,
  PRIMARY_NAV_ITEMS,
  resolveNavHref,
  isNavItemActive,
} from './navigation.ts';

test('HOMEPAGE_SECTIONS follows the exact homepage order including About and Contact', () => {
  const ids = HOMEPAGE_SECTIONS.map((s) => s.id);
  assert.deepEqual(ids, [
    'hero',
    'trust',
    'features',
    'how-it-works',
    'room-rentals',
    'pricing',
    'safety',
    'about',
    'contact',
    'faq',
    'get-started',
  ]);
  for (let i = 0; i < HOMEPAGE_SECTIONS.length; i++) {
    assert.equal(HOMEPAGE_SECTIONS[i].order, i + 1);
  }
});

test('PRIMARY_NAV_ITEMS resolves local anchors on homepage and full paths on subpages', () => {
  const features = PRIMARY_NAV_ITEMS.find((i) => i.id === 'features');
  const about = PRIMARY_NAV_ITEMS.find((i) => i.id === 'about');
  const contact = PRIMARY_NAV_ITEMS.find((i) => i.id === 'contact');
  assert.ok(features);
  assert.ok(about);
  assert.ok(contact);

  assert.equal(resolveNavHref(features, '/'), '#features');
  assert.equal(resolveNavHref(features, '/about'), '/#features');
  assert.equal(resolveNavHref(about, '/'), '#about');
  assert.equal(resolveNavHref(about, '/pricing'), '/#about');
  assert.equal(resolveNavHref(contact, '/'), '#contact');
  assert.equal(resolveNavHref(contact, '/pricing'), '/#contact');
});

test('isNavItemActive highlights active homepage section or matching subpage route', () => {
  const home = PRIMARY_NAV_ITEMS.find((i) => i.id === 'home')!;
  const pricing = PRIMARY_NAV_ITEMS.find((i) => i.id === 'pricing')!;
  const about = PRIMARY_NAV_ITEMS.find((i) => i.id === 'about')!;
  const contact = PRIMARY_NAV_ITEMS.find((i) => i.id === 'contact')!;

  assert.equal(isNavItemActive(home, '/', null), true);
  assert.equal(isNavItemActive(home, '/', 'trust'), true);
  assert.equal(isNavItemActive(pricing, '/', 'pricing'), true);
  assert.equal(isNavItemActive(about, '/', 'about'), true);
  assert.equal(isNavItemActive(contact, '/', 'contact'), true);
  assert.equal(isNavItemActive(home, '/', 'pricing'), false);

  assert.equal(isNavItemActive(about, '/about', null), true);
  assert.equal(isNavItemActive(contact, '/contact', null), true);
  assert.equal(isNavItemActive(pricing, '/pricing', null), true);
  assert.equal(isNavItemActive(home, '/about', null), false);
});
