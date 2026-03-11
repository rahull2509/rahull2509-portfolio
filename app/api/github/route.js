import { NextResponse } from 'next/server';

const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'rahull2509';

// Simple in-memory cache
let cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchGitHub(endpoint) {
  const key = endpoint;
  const now = Date.now();

  if (cache[key] && now - cache[key].ts < CACHE_TTL) {
    return cache[key].data;
  }

  const headers = { 'Accept': 'application/vnd.github.v3+json' };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(`https://api.github.com${endpoint}`, { headers });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

  const data = await res.json();
  cache[key] = { data, ts: now };
  return data;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'profile';

  try {
    switch (type) {
      case 'profile': {
        const data = await fetchGitHub(`/users/${GITHUB_USERNAME}`);
        return NextResponse.json(data);
      }
      case 'repos': {
        const data = await fetchGitHub(
          `/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`
        );
        return NextResponse.json(data);
      }
      case 'events': {
        const data = await fetchGitHub(
          `/users/${GITHUB_USERNAME}/events/public?per_page=10`
        );
        return NextResponse.json(data);
      }
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (err) {
    console.error('GitHub API error:', err.message);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub data' },
      { status: 500 }
    );
  }
}
