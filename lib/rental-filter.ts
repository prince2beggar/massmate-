export type MessCategory = 'student' | 'bachelor' | 'job-holder' | 'shared-apartment';
export type RoomType = 'single-room' | 'shared-room' | 'single-seat';
export type GenderPolicy = 'male' | 'female' | 'any';
export type RentalSortOption = 'featured' | 'rent-asc' | 'rent-desc' | 'seats-desc';

export interface RentalListing {
  id: string;
  slug: string;
  title: { en: string; bn: string };
  messName: { en: string; bn: string };
  area: { en: string; bn: string };
  city: { en: string; bn: string };
  category: MessCategory;
  roomType: RoomType;
  genderPolicy: GenderPolicy;
  monthlyRentBdt: number;
  serviceChargeBdt: number;
  mealDepositEstimateBdt: number;
  availableSeats: number;
  totalMembers: number;
  availableFrom: { en: string; bn: string };
  image: string;
  verified: boolean;
  featured: boolean;
  highlights: { en: string[]; bn: string[] };
  amenities: { en: string[]; bn: string[] };
  houseRules: { en: string[]; bn: string[] };
  description: { en: string; bn: string };
  managerPhone: string;
}

export interface RentalFilterState {
  query: string;
  category: MessCategory | 'all';
  roomType: RoomType | 'all';
  genderPolicy: GenderPolicy | 'all';
  maxRentBdt: number | null;
  sortBy: RentalSortOption;
}

export const DEFAULT_RENTAL_FILTERS: RentalFilterState = {
  query: '',
  category: 'all',
  roomType: 'all',
  genderPolicy: 'all',
  maxRentBdt: null,
  sortBy: 'featured',
};

export function filterAndSortRentals(
  listings: RentalListing[],
  filters: RentalFilterState
): RentalListing[] {
  const normalizedQuery = filters.query.trim().toLowerCase();

  const filtered = listings.filter((item) => {
    if (filters.category !== 'all' && item.category !== filters.category) {
      return false;
    }
    if (filters.roomType !== 'all' && item.roomType !== filters.roomType) {
      return false;
    }
    if (
      filters.genderPolicy !== 'all' &&
      item.genderPolicy !== filters.genderPolicy
    ) {
      return false;
    }
    if (
      filters.maxRentBdt !== null &&
      item.monthlyRentBdt > filters.maxRentBdt
    ) {
      return false;
    }
    if (normalizedQuery.length > 0) {
      const haystack = [
        item.title.en,
        item.title.bn,
        item.messName.en,
        item.messName.bn,
        item.area.en,
        item.area.bn,
        item.city.en,
        item.city.bn,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }
    return true;
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (filters.sortBy) {
      case 'rent-asc':
        return a.monthlyRentBdt - b.monthlyRentBdt;
      case 'rent-desc':
        return b.monthlyRentBdt - a.monthlyRentBdt;
      case 'seats-desc':
        return b.availableSeats - a.availableSeats;
      case 'featured':
      default: {
        if (a.featured !== b.featured) {
          return a.featured ? -1 : 1;
        }
        return a.monthlyRentBdt - b.monthlyRentBdt;
      }
    }
  });

  return sorted;
}
