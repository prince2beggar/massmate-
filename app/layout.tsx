import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { MotionProvider } from '@/components/layout/MotionProvider';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ScrollToTopButton } from '@/components/layout/ScrollToTopButton';
import { cn } from '@/lib/utils';

const plusJakarta = { variable: '--font-plus-jakarta' };
const dmSans = { variable: '--font-dm-sans' };
const hindSiliguri = { variable: '--font-hind-siliguri' };
const jetbrainsMono = { variable: '--font-jetbrains-mono' };

export const metadata: Metadata = {
  title: {
    default: 'MessMate',
    template: '%s | MessMate',
  },
  description: 'Smart and simple mess management for modern shared living.',
  openGraph: {
    title: 'MessMate',
    description: 'Smart and simple mess management for modern shared living.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MessMate',
    description: 'Smart and simple mess management for modern shared living.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        plusJakarta.variable,
        dmSans.variable,
        hindSiliguri.variable,
        jetbrainsMono.variable,
        'font-sans'
      )}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col bg-white text-[#525F7F]"
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-[#324CDD] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>
        <MotionProvider>
          <LanguageProvider>
            <SiteHeader />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <SiteFooter />
            <ScrollToTopButton />
          </LanguageProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
