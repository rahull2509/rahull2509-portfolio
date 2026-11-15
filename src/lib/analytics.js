import crypto from 'crypto';
import { executeQuery, isPostgresDatabase } from './db.js';

const BOT_PATTERNS = [
  /bot/i,
  /crawl/i,
  /spider/i,
  /slurp/i,
  /bingbot/i,
  /googlebot/i,
  /yandex/i,
  /baidu/i,
  /duckduckbot/i,
  /facebookexternalhit/i,
  /headlesschrome/i,
  /lighthouse/i,
  /postman/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /axios/i,
  /httpclient/i,
  /node-fetch/i,
  /go-http-client/i,
];

// In-memory LRU-style caches for rate limiting and deduplication across serverless invocations
// Map<key, timestamp>
const dedupeCache = new Map();
// Map<visitorHash, timestamp[]>
const rateLimitCache = new Map();

// Periodic cleanup of in-memory caches every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupCaches() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  // Clean dedupe items older than 30 seconds
  for (const [key, timestamp] of dedupeCache.entries()) {
    if (now - timestamp > 30000) {
      dedupeCache.delete(key);
    }
  }

  // Clean rate limit items older than 60 seconds
  for (const [key, timestamps] of rateLimitCache.entries()) {
    const valid = timestamps.filter(t => now - t <= 60000);
    if (valid.length === 0) {
      rateLimitCache.delete(key);
    } else {
      rateLimitCache.set(key, valid);
    }
  }
}

/**
 * Anonymously hash a visitor identifier using HMAC-SHA256
 */
export function hashVisitorId(rawId) {
  if (!rawId || typeof rawId !== 'string') {
    return 'anon_' + crypto.randomBytes(16).toString('hex');
  }
  const secret = process.env.ANALYTICS_SALT || process.env.JWT_SECRET || 'rahul-portfolio-analytics-salt-key-2026';
  return crypto.createHmac('sha256', secret).update(rawId.trim()).digest('hex');
}

/**
 * Detect whether a user-agent belongs to an automated crawler or bot
 */
export function isBot(userAgent) {
  if (!userAgent || typeof userAgent !== 'string') return false;
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

/**
 * Detect device type from User-Agent and optional screen width
 */
export function detectDevice(userAgent = '', screenWidth = null) {
  if (typeof screenWidth === 'number' && screenWidth > 0) {
    if (screenWidth < 768) return 'mobile';
    if (screenWidth <= 1024) return 'tablet';
    return 'desktop';
  }

  const ua = (userAgent || '').toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Extract and sanitize referrer domain
 */
export function sanitizeReferrer(referrerUrl = '') {
  if (!referrerUrl || typeof referrerUrl !== 'string') return 'direct';
  try {
    const parsed = new URL(referrerUrl);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    
    // Ignore self-referrals or local testing
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.includes('rahulgangwar') ||
      host.includes('rahull2509')
    ) {
      return 'direct';
    }

    // Common source normalization
    if (host.includes('google')) return 'google.com';
    if (host.includes('github')) return 'github.com';
    if (host.includes('linkedin')) return 'linkedin.com';
    if (host.includes('twitter') || host === 'x.com' || host === 't.co') return 'twitter.com';
    if (host.includes('instagram')) return 'instagram.com';
    if (host.includes('reddit')) return 'reddit.com';

    return host.slice(0, 100);
  } catch {
    return 'direct';
  }
}

/**
 * Check if the event was recently recorded to prevent duplicates (e.g. React StrictMode, double clicks)
 */
export function isDuplicateEvent(visitorHash, eventType, pagePath, windowMs = 3000) {
  cleanupCaches();
  const key = `${visitorHash}:${eventType}:${pagePath}`;
  const now = Date.now();
  const lastTime = dedupeCache.get(key);

  if (lastTime && now - lastTime < windowMs) {
    return true;
  }

  dedupeCache.set(key, now);
  return false;
}

/**
 * Rate limit requests per visitor (max 60 requests per 60 seconds)
 */
export function isRateLimited(visitorHash, limit = 60, windowMs = 60000) {
  cleanupCaches();
  const now = Date.now();
  const timestamps = rateLimitCache.get(visitorHash) || [];
  const valid = timestamps.filter(t => now - t < windowMs);

  if (valid.length >= limit) {
    return true;
  }

  valid.push(now);
  rateLimitCache.set(visitorHash, valid);
  return false;
}

/**
 * Record an analytics event in the database
 */
export async function recordEvent({
  eventType,
  visitorHash,
  pagePath = '/',
  referrerDomain = 'direct',
  deviceType = 'desktop',
}) {
  const sql = `
    INSERT INTO analytics_events 
      (event_type, visitor_id_hash, page_path, referrer_domain, device_type) 
    VALUES 
      ($1, $2, $3, $4, $5)
  `;

  return await executeQuery(sql, [
    eventType,
    visitorHash,
    pagePath.slice(0, 255),
    referrerDomain.slice(0, 255),
    deviceType.slice(0, 32),
  ]);
}

/**
 * Parse date filter into ISO boundaries and day count
 */
function resolveDateRange(range = '30d', customStart = null, customEnd = null) {
  const now = new Date();
  let start = new Date();
  let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (range) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
    case '7d':
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case '30d':
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    case '90d':
      start.setDate(now.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      break;
    case 'all':
      start = new Date(2024, 0, 1, 0, 0, 0, 0); // Beginning of portfolio tracking
      break;
    case 'custom':
      if (customStart) {
        const parsedStart = new Date(customStart);
        if (!isNaN(parsedStart.getTime())) {
          start = new Date(parsedStart.getFullYear(), parsedStart.getMonth(), parsedStart.getDate(), 0, 0, 0, 0);
        }
      }
      if (customEnd) {
        const parsedEnd = new Date(customEnd);
        if (!isNaN(parsedEnd.getTime())) {
          end = new Date(parsedEnd.getFullYear(), parsedEnd.getMonth(), parsedEnd.getDate(), 23, 59, 59, 999);
        }
      }
      break;
    default:
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
  }

  const diffMs = end.getTime() - start.getTime();
  const daysCount = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    daysCount,
    startDateStr: start.toISOString().split('T')[0],
    endDateStr: end.toISOString().split('T')[0],
  };
}

/**
 * Compute high-performance aggregated analytics for the admin dashboard
 */
export async function getAnalyticsStats({ range = '30d', startDate = null, endDate = null }) {
  const { startIso, endIso, daysCount, startDateStr, endDateStr } = resolveDateRange(range, startDate, endDate);
  const isPg = isPostgresDatabase();

  const dayExpr = isPg
    ? "TO_CHAR(created_at, 'YYYY-MM-DD')"
    : "strftime('%Y-%m-%d', created_at)";

  const timeCond = isPg
    ? "created_at >= $1 AND created_at <= $2"
    : "datetime(created_at) >= datetime($1) AND datetime(created_at) <= datetime($2)";

  // 1. Primary summary metrics
  const summarySql = `
    SELECT 
      COUNT(*) AS total_events,
      COALESCE(SUM(CASE WHEN event_type = 'portfolio_view' THEN 1 ELSE 0 END), 0) AS total_views,
      COALESCE(COUNT(DISTINCT CASE WHEN event_type = 'portfolio_view' THEN visitor_id_hash ELSE NULL END), 0) AS unique_visitors,
      COALESCE(SUM(CASE WHEN event_type = 'resume_click' THEN 1 ELSE 0 END), 0) AS resume_clicks,
      COALESCE(SUM(CASE WHEN event_type = 'resume_download_served' THEN 1 ELSE 0 END), 0) AS resume_downloads
    FROM analytics_events
    WHERE ${timeCond}
  `;

  // 2. Daily timeline metrics for charts
  const timelineSql = `
    SELECT 
      ${dayExpr} AS day,
      COALESCE(SUM(CASE WHEN event_type = 'portfolio_view' THEN 1 ELSE 0 END), 0) AS views,
      COALESCE(COUNT(DISTINCT CASE WHEN event_type = 'portfolio_view' THEN visitor_id_hash ELSE NULL END), 0) AS visitors,
      COALESCE(SUM(CASE WHEN event_type = 'resume_click' THEN 1 ELSE 0 END), 0) AS clicks,
      COALESCE(SUM(CASE WHEN event_type = 'resume_download_served' THEN 1 ELSE 0 END), 0) AS downloads
    FROM analytics_events
    WHERE ${timeCond}
    GROUP BY ${dayExpr}
    ORDER BY day ASC
  `;

  // 3. Device breakdown (page views only)
  const devicesSql = `
    SELECT 
      device_type,
      COUNT(*) AS count
    FROM analytics_events
    WHERE event_type = 'portfolio_view' AND ${timeCond}
    GROUP BY device_type
    ORDER BY count DESC
  `;

  // 4. Top Referrers (page views only)
  const referrersSql = `
    SELECT 
      referrer_domain,
      COUNT(*) AS count
    FROM analytics_events
    WHERE event_type = 'portfolio_view' AND ${timeCond}
    GROUP BY referrer_domain
    ORDER BY count DESC
    LIMIT 10
  `;

  // 5. Top Public Pages (page views only)
  const pagesSql = `
    SELECT 
      page_path,
      COUNT(*) AS views
    FROM analytics_events
    WHERE event_type = 'portfolio_view' AND ${timeCond}
    GROUP BY page_path
    ORDER BY views DESC
    LIMIT 10
  `;

  // Execute all aggregations in parallel for maximum performance
  const [summaryRes, timelineRes, devicesRes, referrersRes, pagesRes] = await Promise.all([
    executeQuery(summarySql, [startIso, endIso]),
    executeQuery(timelineSql, [startIso, endIso]),
    executeQuery(devicesSql, [startIso, endIso]),
    executeQuery(referrersSql, [startIso, endIso]),
    executeQuery(pagesSql, [startIso, endIso]),
  ]);

  const rawSummary = summaryRes.rows[0] || {};
  const totalViews = Number(rawSummary.total_views || 0);
  const uniqueVisitors = Number(rawSummary.unique_visitors || 0);
  const resumeClicks = Number(rawSummary.resume_clicks || 0);
  const resumeDownloads = Number(rawSummary.resume_downloads || 0);

  const clickToDownloadRatio = resumeClicks > 0
    ? Number(((resumeDownloads / resumeClicks) * 100).toFixed(1))
    : 0;

  const dailyAvgVisitors = Number((uniqueVisitors / daysCount).toFixed(1));

  // Fill in zero-activity dates in timeline for smooth, gapless charts
  const timelineMap = new Map();
  for (const row of timelineRes.rows) {
    timelineMap.set(row.day, {
      date: row.day,
      views: Number(row.views || 0),
      visitors: Number(row.visitors || 0),
      clicks: Number(row.clicks || 0),
      downloads: Number(row.downloads || 0),
    });
  }

  const completeTimeline = [];
  const curDate = new Date(startIso);
  const stopDate = new Date(endIso);

  // For reasonable date ranges (up to 90 days), fill in missing days
  if (daysCount <= 90) {
    while (curDate <= stopDate) {
      const dayStr = curDate.toISOString().split('T')[0];
      if (timelineMap.has(dayStr)) {
        completeTimeline.push(timelineMap.get(dayStr));
      } else {
        completeTimeline.push({
          date: dayStr,
          views: 0,
          visitors: 0,
          clicks: 0,
          downloads: 0,
        });
      }
      curDate.setDate(curDate.getDate() + 1);
    }
  } else {
    // For 'all' or wide custom ranges, use the aggregated timeline rows directly
    for (const item of timelineMap.values()) {
      completeTimeline.push(item);
    }
  }

  // Format device breakdown with percentages
  const deviceTotal = devicesRes.rows.reduce((acc, r) => acc + Number(r.count || 0), 0);
  const devices = devicesRes.rows.map(r => ({
    device: r.device_type,
    count: Number(r.count || 0),
    percentage: deviceTotal > 0 ? Number(((Number(r.count || 0) / deviceTotal) * 100).toFixed(1)) : 0,
  }));

  // Format referrers with percentages
  const referrerTotal = referrersRes.rows.reduce((acc, r) => acc + Number(r.count || 0), 0);
  const referrers = referrersRes.rows.map(r => ({
    domain: r.referrer_domain,
    count: Number(r.count || 0),
    percentage: referrerTotal > 0 ? Number(((Number(r.count || 0) / referrerTotal) * 100).toFixed(1)) : 0,
  }));

  // Format top pages
  const topPages = pagesRes.rows.map(r => ({
    path: r.page_path,
    views: Number(r.views || 0),
  }));

  return {
    summary: {
      totalViews,
      uniqueVisitors,
      resumeClicks,
      resumeDownloads,
      clickToDownloadRatio,
      dailyAvgVisitors,
      daysInRange: daysCount,
    },
    timeline: completeTimeline,
    devices,
    referrers,
    topPages,
    meta: {
      range,
      startDate: startDateStr,
      endDate: endDateStr,
      generatedAt: new Date().toISOString(),
      database: isPg ? 'PostgreSQL' : 'SQLite (Local/Fallback)',
    },
  };
}
