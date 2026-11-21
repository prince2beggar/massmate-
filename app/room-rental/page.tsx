import type { Metadata } from 'next';
import { RentalExplorer } from '@/components/rental/RentalExplorer';

export const metadata: Metadata = {
  title: 'Room Rental',
  description:
    'Browse verified student mess seats, bachelor rooms, job-holder residences, and shared apartments with transparent monthly rent and house rules.',
};

export default function RoomRentalPage() {
  return <RentalExplorer />;
}
