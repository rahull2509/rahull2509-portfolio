import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { serialize } from 'cookie';
import {
  hashVisitorId,
  isBot,
  detectDevice,
  sanitizeReferrer,
  isDuplicateEvent,
  isRateLimited,
  recordEvent,
} from '../../../../src/lib/analytics.js';

export async function POST(request) {
  try {
    const userAgent = request.headers.get('user-agent') || '';

    // 1. Filter out automated bots, spiders, crawlers
    if (isBot(userAgent)) {
      return NextResponse.json({ success: true, ignored: 'bot' });
    }

    const body = await request.json().catch(() => ({}));
    const {
      event_type,
      page_path = '/',
      referrer = '',
      screen_width = null,
      visitor_id: clientVisitorId = null,
    } = body;

    // 2. Validate event type
    const VALID_EVENTS = ['portfolio_view', 'resume_click'];
    if (!event_type || !VALID_EVENTS.includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // 3. Validate path and exclude admin / API paths
    if (typeof page_path !== 'string' || !page_path.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid page path' }, { status: 400 });
    }

    if (page_path.startsWith('/admin') || page_path.startsWith('/api')) {
      return NextResponse.json({ success: true, ignored: 'excluded_path' });
    }

    // 4. Resolve or generate anonymous visitor identifier
    let cookieCreated = false;
    let rawVisitorId = request.cookies.get('va_id')?.value;

    if (!rawVisitorId && clientVisitorId && typeof clientVisitorId === 'string' && clientVisitorId.length <= 128) {
      rawVisitorId = clientVisitorId;
    }

    if (!rawVisitorId) {
      rawVisitorId = crypto.randomUUID();
      cookieCreated = true;
    }

    const visitorHash = hashVisitorId(rawVisitorId);

    // 5. Rate limit protection (60 requests per minute per visitor)
    if (isRateLimited(visitorHash, 60, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // 6. Deduplicate rapid duplicate submissions (e.g. React StrictMode or double-clicks within 3 seconds)
    if (isDuplicateEvent(visitorHash, event_type, page_path, 3000)) {
      return NextResponse.json({ success: true, deduped: true });
    }

    // 7. Sanitize metadata
    const referrerDomain = sanitizeReferrer(referrer || request.headers.get('referer') || '');
    const deviceType = detectDevice(userAgent, screen_width);

    // 8. Record event
    await recordEvent({
      eventType: event_type,
      visitorHash,
      pagePath: page_path,
      referrerDomain,
      deviceType,
    });

    const response = NextResponse.json({ success: true });

    // 9. Attach first-party visitor cookie if newly generated
    if (cookieCreated) {
      const cookie = serialize('va_id', rawVisitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
      response.headers.set('Set-Cookie', cookie);
    }

    return response;
  } catch (err) {
    console.error('Analytics tracking error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
