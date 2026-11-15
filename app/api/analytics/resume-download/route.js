import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { serialize } from 'cookie';
import {
  hashVisitorId,
  isBot,
  detectDevice,
  sanitizeReferrer,
  isDuplicateEvent,
  recordEvent,
} from '../../../../src/lib/analytics.js';

export async function GET(request) {
  try {
    const resumePath = path.join(process.cwd(), 'public', 'Resume.pdf');

    // 1. Verify file exists on disk - never count failed requests
    if (!fs.existsSync(resumePath)) {
      console.error('Resume file missing at path:', resumePath);
      return NextResponse.json({ error: 'Resume file not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(resumePath);
    const userAgent = request.headers.get('user-agent') || '';

    // 2. Resolve anonymous visitor identification
    let cookieCreated = false;
    let rawVisitorId = request.cookies.get('va_id')?.value;

    if (!rawVisitorId) {
      rawVisitorId = crypto.randomUUID();
      cookieCreated = true;
    }

    const visitorHash = hashVisitorId(rawVisitorId);

    // 3. Only record human downloads (ignore bots and deduplicate 5-second rapid reloads/prefetching)
    if (!isBot(userAgent)) {
      const isDuplicate = isDuplicateEvent(visitorHash, 'resume_download_served', '/api/analytics/resume-download', 5000);
      if (!isDuplicate) {
        const referrerDomain = sanitizeReferrer(request.headers.get('referer') || '');
        const deviceType = detectDevice(userAgent);

        // Record the actual server-served download event
        await recordEvent({
          eventType: 'resume_download_served',
          visitorHash,
          pagePath: '/api/analytics/resume-download',
          referrerDomain,
          deviceType,
        });
      }
    }

    // 4. Return the resume file with proper streaming headers
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Rahul_Gangwar_Resume.pdf"',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

    if (cookieCreated) {
      const cookie = serialize('va_id', rawVisitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
      response.headers.set('Set-Cookie', cookie);
    }

    return response;
  } catch (err) {
    console.error('Error serving resume download:', err);
    return NextResponse.json({ error: 'Failed to serve resume' }, { status: 500 });
  }
}
