import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_RENTAL_FILTERS,
  filterAndSortRentals,
  type RentalListing,
} from './rental-filter';

const SAMPLE: RentalListing[] = [
  {
    id: '1',
    slug: 'dhanmondi-student',
    title: { en: 'Sunny Single Room near Dhanmondi 27', bn: 'ধানমন্ডি ২৭ সিঙ্গেল রুম' },
    messName: { en: 'Scholars Residence', bn: 'স্কলার্স রেসিডেন্স' },
    area: { en: 'Dhanmondi', bn: 'ধানমন্ডি' },
    city: { en: 'Dhaka', bn: 'ঢাকা' },
    category: 'student',
    roomType: 'single-room',
    genderPolicy: 'male',
    monthlyRentBdt: 9500,
    serviceChargeBdt: 1200,
    mealDepositEstimateBdt: 3500,
    availableSeats: 1,
    totalMembers: 12,
    availableFrom: { en: 'Dec 1, 2026', bn: '১ ডিসেম্বর ২০২৬' },
    image: '/images/rental-dhanmondi.jpg',
    verified: true,
    featured: true,
    highlights: { en: ['Attached bath'], bn: ['অ্যাটাচড বাথ'] },
    amenities: { en: ['Fiber Wi-Fi'], bn: ['ফাইবার ওয়াই-ফাই'] },
    houseRules: { en: ['Quiet after 11 PM'], bn: ['রাত ১১টার পর নীরবতা'] },
    description: { en: 'Clean room.', bn: 'পরিচ্ছন্ন রুম।' },
    managerPhone: '+880 1711-000101',
  },
  {
    id: '2',
    slug: 'uttara-bachelor',
    title: { en: 'Twin Seat in Uttara Sector 7', bn: 'উত্তরা সেক্টর ৭ টুইন সিট' },
    messName: { en: 'Northgate Mess', bn: 'নর্থগেট মেস' },
    area: { en: 'Uttara', bn: 'উত্তরা' },
    city: { en: 'Dhaka', bn: 'ঢাকা' },
    category: 'bachelor',
    roomType: 'single-seat',
    genderPolicy: 'male',
    monthlyRentBdt: 4800,
    serviceChargeBdt: 900,
    mealDepositEstimateBdt: 3200,
    availableSeats: 3,
    totalMembers: 16,
    availableFrom: { en: 'Immediate', bn: 'তাৎক্ষণিক' },
    image: '/images/rental-uttara.jpg',
    verified: true,
    featured: false,
    highlights: { en: ['Balcony'], bn: ['বারান্দা'] },
    amenities: { en: ['Generator'], bn: ['জেনারেটর'] },
    houseRules: { en: ['No smoking'], bn: ['ধূমপান নিষেধ'] },
    description: { en: 'Spacious seat.', bn: 'প্রশস্ত সিট।' },
    managerPhone: '+880 1711-000102',
  },
];

test('filters by category and area query', () => {
  const res = filterAndSortRentals(SAMPLE, {
    ...DEFAULT_RENTAL_FILTERS,
    category: 'student',
    query: 'dhanmondi',
  });
  assert.equal(res.length, 1);
  assert.equal(res[0].id, '1');
});

test('filters by maxRentBdt and sorts ascending', () => {
  const res = filterAndSortRentals(SAMPLE, {
    ...DEFAULT_RENTAL_FILTERS,
    maxRentBdt: 5000,
    sortBy: 'rent-asc',
  });
  assert.equal(res.length, 1);
  assert.equal(res[0].id, '2');
});

test('sorts by seats descending', () => {
  const res = filterAndSortRentals(SAMPLE, {
    ...DEFAULT_RENTAL_FILTERS,
    sortBy: 'seats-desc',
  });
  assert.equal(res[0].id, '2');
  assert.equal(res[1].id, '1');
});
