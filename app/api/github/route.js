import { NextResponse } from 'next/server';
import {
    getGitHubProfile,
    getGitHubRepos,
    getGitHubPrs,
    getGitHubEvents,
    getGitHubLanguages,
    getGitHubContributions,
    getGitHubRepoDetails,
    getGitHubAll,
    invalidateGitHubCache,
    getRateLimitInfo,
    CACHE_TTLS,
    CACHE_TAGS,
} from '../../../src/lib/github';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'all').toLowerCase();
    const repoName = searchParams.get('name');
    const revalidate = searchParams.get('revalidate');

    // Handle manual revalidation trigger if requested
    if (revalidate) {
        const tagToInvalidate = revalidate === 'true' || revalidate === 'all'
            ? CACHE_TAGS.ALL
            : CACHE_TAGS[revalidate.toUpperCase()] || revalidate;

        const result = invalidateGitHubCache(tagToInvalidate);
        return NextResponse.json({ revalidated: true, result });
    }

    // Rate limit info for monitoring
    const rateLimit = getRateLimitInfo();

    try {
        let data;
        let ttl = CACHE_TTLS.ALL;

        switch (type) {
            case 'profile': {
                data = await getGitHubProfile();
                ttl = CACHE_TTLS.PROFILE;
                break;
            }
            case 'repos': {
                const result = await getGitHubRepos();
                // Preserves exact existing contract: { repos, totalStars }
                data = {
                    repos: result.repos,
                    totalStars: result.totalStars,
                };
                ttl = CACHE_TTLS.REPOS;
                break;
            }
            case 'prs': {
                const result = await getGitHubPrs();
                // Preserves exact existing contract: { total_count }
                data = { total_count: result.total_count };
                ttl = CACHE_TTLS.PRS;
                break;
            }
            case 'events': {
                // Preserves exact existing contract: array of events
                data = await getGitHubEvents();
                ttl = CACHE_TTLS.EVENTS;
                break;
            }
            case 'languages': {
                data = await getGitHubLanguages();
                ttl = CACHE_TTLS.LANGUAGES;
                break;
            }
            case 'contributions': {
                data = await getGitHubContributions();
                ttl = CACHE_TTLS.CONTRIBUTIONS;
                break;
            }
            case 'repo': {
                if (!repoName) {
                    return NextResponse.json(
                        { error: 'Repository name required for type=repo' },
                        { status: 400 }
                    );
                }
                data = await getGitHubRepoDetails(repoName);
                ttl = CACHE_TTLS.REPO_DETAILS;
                break;
            }
            case 'all': {
                data = await getGitHubAll();
                ttl = CACHE_TTLS.ALL;
                break;
            }
            default:
                return NextResponse.json(
                    { error: 'Invalid type parameter. Supported: all, profile, repos, prs, events, languages, contributions, repo' },
                    { status: 400 }
                );
        }

        // Return with edge & browser caching headers
        const rateLimitAfter = getRateLimitInfo();
        return NextResponse.json(data, {
            status: 200,
            headers: {
                'Cache-Control': `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`,
                'CDN-Cache-Control': `public, s-maxage=${ttl}`,
                'Vercel-CDN-Cache-Control': `public, s-maxage=${ttl}`,
                'X-RateLimit-Remaining': String(rateLimitAfter.core.remaining),
                'X-RateLimit-Limit': String(rateLimitAfter.core.limit),
                'X-RateLimit-Search-Remaining': String(rateLimitAfter.search.remaining),
                'X-RateLimit-Search-Limit': String(rateLimitAfter.search.limit),
                'X-Cache-TTL': String(ttl),
            },
        });
    } catch (err) {
        // Safe server-side error logging without exposing secrets or stacks to client
        console.error('[GitHub API Route Error]:', err.message);
        return NextResponse.json(
            { error: 'Failed to fetch GitHub data' },
            {
                status: 500,
                headers: {
                    'X-RateLimit-Remaining': String(rateLimit.remaining),
                },
            }
        );
    }
}
