import type { Metadata } from 'next';
import { DesignSystemPreview } from '@/components/design-system/DesignSystemPreview';

export const metadata: Metadata = {
  title: 'Design System',
  description:
    'Explore the MessMate visual design system: brand tokens, typography hierarchy, shadcn/ui components, forms, badges, dialogs, loading, and empty states.',
};

export default function DesignSystemPage() {
  return <DesignSystemPreview />;
}
