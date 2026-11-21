import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center py-16 bg-[#F8F9FE]">
      <Container className="text-center space-y-6 max-w-xl">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#324CDD] shadow-inner">
          <Building2 className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-wide text-[#324CDD] uppercase">
            404 Error
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#172B4D]">
            Page Not Found
          </h1>
          <p className="text-base text-[#525F7F]">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div>
          <Button href="/" variant="primary" size="md">
            <ArrowLeft className="h-4 w-4 mr-1.5" aria-hidden="true" />
            <span>Return to Homepage</span>
          </Button>
        </div>
      </Container>
    </section>
  );
}
