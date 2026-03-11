'use client';

import { useEffect } from 'react';

export default function HydrationGate() {
  useEffect(() => {
    document.documentElement.classList.add('hydrated');
  }, []);

  return null;
}
