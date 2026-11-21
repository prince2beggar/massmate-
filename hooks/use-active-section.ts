'use client';

import { useEffect, useState } from 'react';
import type { HomeSectionId } from '@/types/navigation';

const OBSERVED_SECTION_IDS: HomeSectionId[] = [
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
];

const HEADER_OFFSET_PX = 120;

function detectActiveSection(): HomeSectionId {
  let current: HomeSectionId = 'hero';

  for (const id of OBSERVED_SECTION_IDS) {
    const el = document.getElementById(id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.top <= HEADER_OFFSET_PX) {
      current = id;
    } else {
      break;
    }
  }

  return current;
}

export function useActiveSection(enabled: boolean): HomeSectionId | null {
  const [activeId, setActiveId] = useState<HomeSectionId | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    let rafId = 0;

    const scheduleUpdate = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const next = detectActiveSection();
        setActiveId((prev) => (prev === next ? prev : next));
      });
    };

    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.addEventListener('hashchange', scheduleUpdate);

    return () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('hashchange', scheduleUpdate);
    };
  }, [enabled]);

  return enabled ? activeId : null;
}
