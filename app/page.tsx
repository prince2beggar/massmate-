import React from 'react';
import {
  HeroSection,
  TrustIndicatorsSection,
  FeaturesOverviewSection,
  HowItWorksSection,
  RoomRentalPreviewSection,
  PricingPreviewSection,
  EmergencySafetyPreviewSection,
  AboutSection,
  ContactSection,
  FaqPreviewSection,
  FinalCtaSection,
} from '@/components/sections';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustIndicatorsSection />
      <FeaturesOverviewSection />
      <HowItWorksSection />
      <RoomRentalPreviewSection />
      <PricingPreviewSection background="white" />
      <EmergencySafetyPreviewSection />
      <AboutSection />
      <ContactSection />
      <FaqPreviewSection background="white" />
      <FinalCtaSection />
    </>
  );
}
