'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTracked = useRef(null);

  useEffect(() => {
    // 1. Skip if already tracked this exact path recently (prevents React StrictMode double effect)
    if (!pathname || lastTracked.current === pathname) {
      return;
    }

    // 2. Exclude admin and internal API routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return;
    }

    // 3. Respect user Do-Not-Track preference if explicitly enabled
    if (typeof navigator !== 'undefined' && (navigator.doNotTrack === '1' || window.doNotTrack === '1')) {
      return;
    }

    lastTracked.current = pathname;

    // 4. Resolve client-side anonymous visitor token
    let visitorId = null;
    try {
      visitorId = localStorage.getItem('va_client_id');
      if (!visitorId) {
        visitorId = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('va_client_id', visitorId);
      }
    } catch {
      // Ignore localStorage permission errors
    }

    const payload = JSON.stringify({
      event_type: 'portfolio_view',
      page_path: pathname,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      screen_width: typeof window !== 'undefined' ? window.innerWidth : null,
      visitor_id: visitorId,
    });

    // 5. Lightweight, non-blocking asynchronous dispatch
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/track', blob);
    } else {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Silently handle network drops; analytics must never degrade UX
      });
    }
  }, [pathname]);

  return null;
}
