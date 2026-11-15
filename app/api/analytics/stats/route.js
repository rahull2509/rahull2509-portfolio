import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../src/lib/auth.js';
import { getAnalyticsStats } from '../../../../src/lib/analytics.js';

export async function GET(request) {
  try {
    // 1. Mandatory JWT Admin Authentication
    const token = request.cookies.get('ks_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const VALID_RANGES = ['today', '7d', '30d', '90d', 'all', 'custom'];
    if (!VALID_RANGES.includes(range)) {
      return NextResponse.json({ error: 'Invalid range parameter' }, { status: 400 });
    }

    // Validate custom dates if provided
    if (range === 'custom') {
      if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        return NextResponse.json({ error: 'Invalid startDate format (expected YYYY-MM-DD)' }, { status: 400 });
      }
      if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return NextResponse.json({ error: 'Invalid endDate format (expected YYYY-MM-DD)' }, { status: 400 });
      }
    }

    // 3. Fetch aggregated stats
    const stats = await getAnalyticsStats({
      range,
      startDate: startDate || null,
      endDate: endDate || null,
    });

    return NextResponse.json({ success: true, data: stats });
  } catch (err) {
    console.error('Error fetching analytics stats:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
