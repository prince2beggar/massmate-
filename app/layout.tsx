import type { Metadata } from 'next';
import {
  Plus_Jakarta_Sans,
  DM_Sans,
  Hind_Siliguri,
  JetBrains_Mono,
} from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { MotionProvider } from '@/components/layout/MotionProvider';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ScrollToTopButton } from '@/components/layout/ScrollToTopButton';
import { cn } from '@/lib/utils';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hind-siliguri',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

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
