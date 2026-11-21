import type { DemoRentalShowcaseItem } from '@/data/homepage-workflow-rentals';

export interface ShowcaseRentalFilterCriteria {
  locationQuery: string;
  roomType: string;
  maxBudget: string;
}

export interface RoomInfoRequestValues {
  name: string;
  contact: string;
  note: string;
}

export type RoomInfoRequestErrors = Partial<
  Record<keyof RoomInfoRequestValues, string>
>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[+]?[\d\s\-()]{7,20}$/;

function normalizeRoomTypeSlug(roomTypeEn: string): string {
  return roomTypeEn.trim().toLowerCase().replace(/\s+/g, '-');
}

export function filterDemoShowcaseRooms(
  items: readonly DemoRentalShowcaseItem[],
  criteria: ShowcaseRentalFilterCriteria
): DemoRentalShowcaseItem[] {
  const query = criteria.locationQuery.trim().toLowerCase();
  const maxBudgetNum =
    criteria.maxBudget !== 'any' ? Number(criteria.maxBudget) : null;

  return items.filter((item) => {
    if (query) {
      const searchable = [
        item.location.en,
        item.location.bn,
        item.title.en,
        item.title.bn,
      ]
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(query)) return false;
    }

    if (criteria.roomType && criteria.roomType !== 'all') {
      if (normalizeRoomTypeSlug(item.roomType.en) !== criteria.roomType) {
        return false;
      }
    }

    if (maxBudgetNum !== null && Number.isFinite(maxBudgetNum)) {
      if (item.rentBdt > maxBudgetNum) return false;
    }

    return true;
  });
}

export function validateRoomInfoRequest(
  values: RoomInfoRequestValues,
  locale: 'en' | 'bn' = 'en'
): { valid: boolean; errors: RoomInfoRequestErrors } {
  const errors: RoomInfoRequestErrors = {};
  const isBn = locale === 'bn';

  if (values.name.trim().length < 2) {
    errors.name = isBn
      ? 'অনুগ্রহ করে আপনার নাম লিখুন (কমপক্ষে ২ অক্ষর)।'
      : 'Please enter your name (at least 2 characters).';
  }

  const trimmedContact = values.contact.trim();
  const isValidContact =
    EMAIL_PATTERN.test(trimmedContact) || PHONE_PATTERN.test(trimmedContact);
  if (!isValidContact) {
    errors.contact = isBn
      ? 'অনুগ্রহ করে একটি বৈধ ইমেইল অথবা ফোন নম্বর লিখুন।'
      : 'Please enter a valid email address or phone number.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
