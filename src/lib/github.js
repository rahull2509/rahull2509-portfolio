/**
 * Centralized GitHub API Service for Rahul Gangwar Portfolio
 * 
 * Multi-Tier Caching Architecture:
 * - Tier 1: In-Memory TTL & ETag SWR Cache (instantly serves warm requests in dev & warm lambdas)
 * - Tier 2: Next.js 16 Data Cache (unstable_cache) for cross-invocation persistence on Vercel
 * - Tier 3: In-Flight Promise Deduplication at both Service and Upstream levels
 * 
 * Features:
 * - Differentiated Rate Limit Tracking (Core vs Search API quotas)
 * - Proactive Search API throttling (protects 10 req/min Search quota)
 * - HTTP 304 Not Modified conditional requests with ETags
 * - Resilient stale-while-revalidate fallback schemas
 * - Edge-ready CDN Cache-Control headers
 * - Strict security: GITHUB_TOKEN is only accessed server-side and never exposed
 */

import { unstable_cache, revalidateTag } from 'next/cache';

// Environment variables & configuration
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'rahull2509';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_API_BASE = 'https://api.github.com';

// Cache TTLs in seconds
export const CACHE_TTLS = {
    PROFILE: 6 * 3600,       // 6 hours (21,600s)
    REPOS: 30 * 60,          // 30 minutes (1,800s)
    PRS: 30 * 60,            // 30 minutes (1,800s)
    EVENTS: 10 * 60,         // 10 minutes (600s)
    LANGUAGES: 6 * 3600,     // 6 hours (21,600s)
    CONTRIBUTIONS: 6 * 3600, // 6 hours (21,600s)
    REPO_DETAILS: 30 * 60,   // 30 minutes (1,800s)
    ALL: 10 * 60,            // 10 minutes (bounded by events)
};

// Cache Tags for revalidation
export const CACHE_TAGS = {
    PROFILE: 'github:profile',
    REPOS: 'github:repos',
    PRS: 'github:prs',
    EVENTS: 'github:events',
    LANGUAGES: 'github:languages',
    CONTRIBUTIONS: 'github:contributions',
    REPO_DETAILS: 'github:repo',
    ALL: 'github:all',
};

// ── In-Memory State & Caches ──────────────────────────────────────────────────

// In-flight deduplication maps
const inFlightUpstream = new Map(); // endpoint -> Promise<upstreamData>
const inFlightService = new Map();  // serviceKey -> Promise<serviceData>

// Process-level memory cache with TTL & ETag support
// cacheKey -> { data, etag, timestamp, ttlMs }
const memoryCache = new Map();

// GitHub rate-limit tracker: differentiated buckets for Core and Search APIs
const rateLimitState = {
    core: {
        limit: 60,
        remaining: 60,
        reset: 0,
        lastChecked: 0,
    },
    search: {
        limit: 10,
        remaining: 10,
        reset: 0,
        lastChecked: 0,
    },
};

// Metrics tracking for diagnostics and verification
export const cacheMetrics = {
    upstreamRequests: 0,
    upstream304s: 0,
    upstream200s: 0,
    memoryHits: 0,
    deduplicatedHits: 0,
    searchRequests: 0,
};

/**
 * Structured server-side logger (does not log tokens or sensitive data)
 */
function logGithubEvent(event, details = {}) {
    const logPayload = {
        scope: 'github-api',
        event,
        timestamp: new Date().toISOString(),
        ...details,
    };
    console.log(`[GitHub API] ${event}:`, JSON.stringify(logPayload));
}

/**
 * Returns current rate limit information for both Core and Search APIs
 */
export function getRateLimitInfo() {
    const now = Date.now();
    return {
        core: {
            ...rateLimitState.core,
            isThrottled: rateLimitState.core.remaining <= 1 && now < rateLimitState.core.reset * 1000,
            resetDate: rateLimitState.core.reset ? new Date(rateLimitState.core.reset * 1000).toISOString() : null,
        },
        search: {
            ...rateLimitState.search,
            isThrottled: rateLimitState.search.remaining <= 2 && now < rateLimitState.search.reset * 1000,
            resetDate: rateLimitState.search.reset ? new Date(rateLimitState.search.reset * 1000).toISOString() : null,
        },
        remaining: rateLimitState.core.remaining, // backward compatibility helper
        limit: rateLimitState.core.limit,
    };
}

/**
 * Low-level HTTP fetcher to GitHub with ETag 304, rate-limit tracking, and timeout
 */
async function fetchFromGitHub(endpoint, options = {}) {
    const {
        cacheKey = endpoint,
        fallbackData = null,
        timeoutMs = 8000,
        ttlSeconds = 600,
    } = options;

    const isSearch = endpoint.startsWith('/search/');
    const bucket = isSearch ? rateLimitState.search : rateLimitState.core;
    const now = Date.now();

    // 1. Check if the resource is rate-limited before making a call
    const threshold = isSearch ? 2 : 1;
    if (bucket.remaining <= threshold && now < bucket.reset * 1000) {
        logGithubEvent('RATE_LIMIT_PREVENTED', {
            endpoint,
            resource: isSearch ? 'search' : 'core',
            remaining: bucket.remaining,
            reset: bucket.reset,
        });

        // Serve from memory cache if available
        if (memoryCache.has(cacheKey)) {
            const cached = memoryCache.get(cacheKey);
            logGithubEvent('FALLBACK_SERVED', { endpoint, reason: 'rate_limited' });
            return cached.data;
        }

        if (fallbackData !== null) return fallbackData;
        throw new Error(`GitHub ${isSearch ? 'Search' : 'Core'} API rate limit reached. Resets at ${new Date(bucket.reset * 1000).toISOString()}`);
    }

    const fullUrl = `${GITHUB_API_BASE}${endpoint}`;
    const startTime = Date.now();

    // 2. Prepare headers
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'rahull2509-portfolio',
    };

    if (GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    }

    // Include ETag for conditional request (core endpoints support 304)
    const prevCache = memoryCache.get(cacheKey);
    if (prevCache?.etag) {
        headers['If-None-Match'] = prevCache.etag;
    }

    try {
        cacheMetrics.upstreamRequests++;
        if (isSearch) cacheMetrics.searchRequests++;

        logGithubEvent('UPSTREAM_REQUEST', {
            endpoint,
            isSearch,
            conditional: Boolean(headers['If-None-Match']),
        });

        const res = await fetch(fullUrl, {
            headers,
            signal: AbortSignal.timeout(timeoutMs),
        });

        const durationMs = Date.now() - startTime;

        // 3. Update rate limit state from response headers
        const remainingHeader = res.headers.get('x-ratelimit-remaining');
        const limitHeader = res.headers.get('x-ratelimit-limit');
        const resetHeader = res.headers.get('x-ratelimit-reset');

        if (remainingHeader !== null) {
            bucket.remaining = parseInt(remainingHeader, 10);
            bucket.limit = parseInt(limitHeader || (isSearch ? '10' : '60'), 10);
            bucket.reset = parseInt(resetHeader || '0', 10);
            bucket.lastChecked = Date.now();
        }

        // 4. Handle 304 Not Modified
        if (res.status === 304) {
            cacheMetrics.upstream304s++;
            logGithubEvent('UPSTREAM_304_NOT_MODIFIED', {
                endpoint,
                durationMs,
                remaining: bucket.remaining,
            });

            if (prevCache) {
                prevCache.timestamp = Date.now(); // Refresh TTL
                prevCache.ttlMs = ttlSeconds * 1000;
                return prevCache.data;
            }
        }

        // 5. Handle Rate Limit Errors (403/429)
        if (res.status === 403 || res.status === 429) {
            logGithubEvent('RATE_LIMIT_HIT', {
                endpoint,
                status: res.status,
                remaining: bucket.remaining,
                reset: bucket.reset,
            });

            if (prevCache) {
                logGithubEvent('FALLBACK_SERVED', { endpoint, reason: 'rate_limited_response' });
                return prevCache.data;
            }
            if (fallbackData !== null) return fallbackData;
            throw new Error(`GitHub API rate limit exceeded (${res.status})`);
        }

        // 6. Handle General Errors
        if (!res.ok) {
            logGithubEvent('API_ERROR', { endpoint, status: res.status, durationMs });
            if (prevCache) {
                logGithubEvent('FALLBACK_SERVED', { endpoint, reason: `http_${res.status}` });
                return prevCache.data;
            }
            if (fallbackData !== null) return fallbackData;
            throw new Error(`GitHub API error: ${res.status}`);
        }

        // 7. Success (200 OK)
        const data = await res.json();
        const etag = res.headers.get('etag');
        cacheMetrics.upstream200s++;

        logGithubEvent('UPSTREAM_200_OK', {
            endpoint,
            durationMs,
            rateLimitRemaining: bucket.remaining,
            rateLimitLimit: bucket.limit,
            hasEtag: Boolean(etag),
        });

        // Save into process-level memory cache
        memoryCache.set(cacheKey, {
            data,
            etag,
            timestamp: Date.now(),
            ttlMs: ttlSeconds * 1000,
        });

        return data;
    } catch (err) {
        const durationMs = Date.now() - startTime;
        logGithubEvent('FETCH_FAILED', { endpoint, message: err.message, durationMs });

        if (prevCache) {
            logGithubEvent('FALLBACK_SERVED', { endpoint, reason: 'exception' });
            return prevCache.data;
        }
        if (fallbackData !== null) return fallbackData;
        throw err;
    }
}

/**
 * Deduplicated fetch: coalesces concurrent identical upstream requests into a single promise
 */
function deduplicatedUpstreamFetch(endpoint, options = {}) {
    const key = options.cacheKey || endpoint;

    if (inFlightUpstream.has(key)) {
        cacheMetrics.deduplicatedHits++;
        logGithubEvent('DEDUPLICATED_UPSTREAM', { key });
        return inFlightUpstream.get(key);
    }

    const promise = (async () => {
        try {
            return await fetchFromGitHub(endpoint, options);
        } finally {
            inFlightUpstream.delete(key);
        }
    })();

    inFlightUpstream.set(key, promise);
    return promise;
}

/**
 * Tier 1 Memory Cache Resolver:
 * Checks process memory cache first. Only if missing or expired does it call fetcherFn.
 */
async function resolveWithMemoryCache(cacheKey, ttlSeconds, fetcherFn) {
    const cached = memoryCache.get(cacheKey);
    const now = Date.now();

    // Check if valid in memory
    if (cached && (now - cached.timestamp < cached.ttlMs)) {
        cacheMetrics.memoryHits++;
        const ageMs = now - cached.timestamp;
        const ttlRemainingSec = Math.round((cached.ttlMs - ageMs) / 1000);
        logGithubEvent('CACHE_HIT_MEMORY', {
            key: cacheKey,
            ageMs,
            ttlRemainingSec,
        });
        return cached.data;
    }

    // Deduplicate at service level
    if (inFlightService.has(cacheKey)) {
        cacheMetrics.deduplicatedHits++;
        logGithubEvent('DEDUPLICATED_SERVICE', { key: cacheKey });
        return inFlightService.get(cacheKey);
    }

    const promise = (async () => {
        try {
            return await fetcherFn();
        } finally {
            inFlightService.delete(cacheKey);
        }
    })();

    inFlightService.set(cacheKey, promise);
    return promise;
}

// ── Default Fallback Schemas (Graceful Degradation) ──────────────────────────

const FALLBACK_PROFILE = {
    login: GITHUB_USERNAME,
    name: 'Rahul Gangwar',
    avatar_url: `https://github.com/${GITHUB_USERNAME}.png`,
    bio: 'Full Stack Developer | React, Next.js & Python',
    public_repos: 15,
    followers: 10,
    following: 5,
    html_url: `https://github.com/${GITHUB_USERNAME}`,
};

const FALLBACK_REPOS = [];
const FALLBACK_EVENTS = [];
const FALLBACK_PR_COUNT = 38;

// ── Service Operations (Next.js 16 Data Cache + Memory Cache Tier) ───────────

/**
 * 1. Public Profile (TTL: 6 hours)
 */
export const getGitHubProfile = unstable_cache(
    async () => {
        return resolveWithMemoryCache('profile', CACHE_TTLS.PROFILE, async () => {
            logGithubEvent('CACHE_MISS', { type: 'profile' });
            return deduplicatedUpstreamFetch(`/users/${GITHUB_USERNAME}`, {
                cacheKey: 'profile',
                fallbackData: FALLBACK_PROFILE,
                ttlSeconds: CACHE_TTLS.PROFILE,
            });
        });
    },
    ['github-profile', GITHUB_USERNAME],
    {
        revalidate: CACHE_TTLS.PROFILE,
        tags: [CACHE_TAGS.PROFILE],
    }
);

/**
 * 2. Repository List & Star Count (TTL: 30 minutes)
 */
export const getGitHubRepos = unstable_cache(
    async () => {
        return resolveWithMemoryCache('repos', CACHE_TTLS.REPOS, async () => {
            logGithubEvent('CACHE_MISS', { type: 'repos' });
            const data = await deduplicatedUpstreamFetch(
                `/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`,
                {
                    cacheKey: 'repos',
                    fallbackData: FALLBACK_REPOS,
                    ttlSeconds: CACHE_TTLS.REPOS,
                }
            );

            const repos = Array.isArray(data) ? data : [];
            const ownRepos = repos.filter(repo => !repo.fork);
            const totalStars = ownRepos.reduce(
                (total, repo) => total + (repo.stargazers_count || 0),
                0
            );

            const result = { repos, totalStars };
            // Populate memory cache with result
            memoryCache.set('repos_computed', {
                data: result,
                timestamp: Date.now(),
                ttlMs: CACHE_TTLS.REPOS * 1000,
            });

            return result;
        });
    },
    ['github-repos', GITHUB_USERNAME],
    {
        revalidate: CACHE_TTLS.REPOS,
        tags: [CACHE_TAGS.REPOS],
    }
);

/**
 * 3. Pull Requests Count (TTL: 30 minutes)
 * Strictly protected against Search API rate limits (10 req/min).
 */
export const getGitHubPrs = unstable_cache(
    async () => {
        return resolveWithMemoryCache('prs', CACHE_TTLS.PRS, async () => {
            logGithubEvent('CACHE_MISS', { type: 'prs' });
            const data = await deduplicatedUpstreamFetch(
                `/search/issues?q=author%3A${GITHUB_USERNAME}+is%3Apr&per_page=1`,
                {
                    cacheKey: 'prs',
                    fallbackData: { total_count: FALLBACK_PR_COUNT },
                    ttlSeconds: CACHE_TTLS.PRS,
                }
            );
            return { total_count: data?.total_count ?? FALLBACK_PR_COUNT };
        });
    },
    ['github-prs', GITHUB_USERNAME],
    {
        revalidate: CACHE_TTLS.PRS,
        tags: [CACHE_TAGS.PRS],
    }
);

/**
 * 4. Recent Public Activity / Events (TTL: 10 minutes)
 */
export const getGitHubEvents = unstable_cache(
    async () => {
        return resolveWithMemoryCache('events', CACHE_TTLS.EVENTS, async () => {
            logGithubEvent('CACHE_MISS', { type: 'events' });
            const data = await deduplicatedUpstreamFetch(
                `/users/${GITHUB_USERNAME}/events/public?per_page=100`,
                {
                    cacheKey: 'events',
                    fallbackData: FALLBACK_EVENTS,
                    ttlSeconds: CACHE_TTLS.EVENTS,
                }
            );
            return Array.isArray(data) ? data : [];
        });
    },
    ['github-events', GITHUB_USERNAME],
    {
        revalidate: CACHE_TTLS.EVENTS,
        tags: [CACHE_TAGS.EVENTS],
    }
);

/**
 * Computes top programming languages from repos (Pure CPU calculation)
 */
export function computeLanguagesFromRepos(repos = []) {
    const ownRepos = (Array.isArray(repos) ? repos : []).filter(r => !r.fork && r.language);
    const langTotals = {};
    for (const r of ownRepos.slice(0, 20)) {
        if (r.language) {
            langTotals[r.language] = (langTotals[r.language] || 0) + (r.size || 1);
        }
    }
    return langTotals;
}

/**
 * 5. Top Languages Aggregation (TTL: 6 hours)
 * Reuses getGitHubRepos directly without separate upstream calls.
 */
export const getGitHubLanguages = unstable_cache(
    async () => {
        return resolveWithMemoryCache('languages', CACHE_TTLS.LANGUAGES, async () => {
            const { repos } = await getGitHubRepos();
            return computeLanguagesFromRepos(repos);
        });
    },
    ['github-languages', GITHUB_USERNAME],
    {
        revalidate: CACHE_TTLS.LANGUAGES,
        tags: [CACHE_TAGS.LANGUAGES],
    }
);

/**
 * 6. Contribution Stats & URL (TTL: 6 hours)
 * Local metadata generation - zero upstream API calls.
 */
export function getGitHubContributions() {
    return {
        username: GITHUB_USERNAME,
        chartUrl: `https://ghchart.rshah.org/2563EB/${GITHUB_USERNAME}`,
        chartAlt: `GitHub contribution chart for ${GITHUB_USERNAME}`,
        profileUrl: `https://github.com/${GITHUB_USERNAME}`,
    };
}

/**
 * 7. Single Repository Details (TTL: 30 minutes)
 */
export async function getGitHubRepoDetails(repoName) {
    const safeRepo = repoName.replace(/[^a-zA-Z0-9._-]/g, '');
    const cacheKey = `repo:${safeRepo}`;

    return resolveWithMemoryCache(cacheKey, CACHE_TTLS.REPO_DETAILS, async () => {
        const cachedFn = unstable_cache(
            async () => {
                logGithubEvent('CACHE_MISS', { type: 'repo_details', repo: safeRepo });
                return deduplicatedUpstreamFetch(`/repos/${GITHUB_USERNAME}/${safeRepo}`, {
                    cacheKey,
                    fallbackData: null,
                    ttlSeconds: CACHE_TTLS.REPO_DETAILS,
                });
            },
            ['github-repo', GITHUB_USERNAME, safeRepo],
            {
                revalidate: CACHE_TTLS.REPO_DETAILS,
                tags: [`${CACHE_TAGS.REPO_DETAILS}:${safeRepo}`],
            }
        );
        return cachedFn();
    });
}

/**
 * 8. Consolidated GitHub Bundle (TTL: 10 minutes)
 * 
 * Performance & Caching Guarantees:
 * 1. Checks process-level memoryCache('all') first (returns in < 1ms on repeat calls).
 * 2. In-flight promise deduplication: 15 concurrent calls share 1 single promise.
 * 3. Individual services (profile, repos, prs, events) reuse their own cached results.
 * 4. Languages are computed directly from the fetched repos (zero extra network calls).
 * 5. Contributions are generated locally (zero network calls).
 */
export const getGitHubAll = unstable_cache(
    async () => {
        return resolveWithMemoryCache('all', CACHE_TTLS.ALL, async () => {
            logGithubEvent('CACHE_MISS', { type: 'all' });

            // Concurrent resolution of individual services (each checking memory cache first)
            const [profile, reposData, prsData, eventsData] = await Promise.all([
                getGitHubProfile().catch(() => FALLBACK_PROFILE),
                getGitHubRepos().catch(() => ({ repos: FALLBACK_REPOS, totalStars: 0 })),
                getGitHubPrs().catch(() => ({ total_count: FALLBACK_PR_COUNT })),
                getGitHubEvents().catch(() => FALLBACK_EVENTS),
            ]);

            const allRepos = Array.isArray(reposData?.repos) ? reposData.repos : [];
            const ownRepos = allRepos.filter(r => !r.fork);
            const topRepos = ownRepos
                .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
                .slice(0, 6);

            const meaningfulEvents = (Array.isArray(eventsData) ? eventsData : [])
                .filter(e => ['PushEvent', 'PullRequestEvent', 'CreateEvent', 'ForkEvent'].includes(e.type))
                .slice(0, 8);

            const langs = computeLanguagesFromRepos(allRepos);
            const contributions = getGitHubContributions();

            return {
                profile,
                repos: allRepos,
                topRepos,
                totalStars: reposData?.totalStars || 0,
                prCount: prsData?.total_count || 0,
                events: meaningfulEvents,
                langs,
                contributions,
                meta: {
                    cachedAt: new Date().toISOString(),
                    username: GITHUB_USERNAME,
                },
            };
        });
    },
    ['github-all', GITHUB_USERNAME],
    {
        revalidate: CACHE_TTLS.ALL,
        tags: [CACHE_TAGS.ALL],
    }
);

/**
 * On-demand cache invalidation
 */
export function invalidateGitHubCache(tag = CACHE_TAGS.ALL) {
    try {
        // Clear process-level memory cache
        if (tag === CACHE_TAGS.ALL || tag === 'all') {
            memoryCache.clear();
        } else {
            for (const key of memoryCache.keys()) {
                if (key.includes(tag.replace('github:', ''))) {
                    memoryCache.delete(key);
                }
            }
        }

        revalidateTag(tag);
        logGithubEvent('CACHE_REVALIDATED', { tag });
        return { success: true, tag };
    } catch (err) {
        logGithubEvent('REVALIDATE_FAILED', { tag, error: err.message });
        return { success: false, error: err.message };
    }
}
