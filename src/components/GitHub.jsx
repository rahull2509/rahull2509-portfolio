'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Github, Star, GitFork, Users, BookOpen,
    GitPullRequest, GitCommit, GitBranch, ExternalLink,
    Code2, Zap, Calendar, RefreshCw, AlertCircle
} from 'lucide-react';
import './GitHub.css';

const USERNAME = 'rahull2509';

/* Language colours matching GitHub's palette */
const LANG_COLOR = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    Go: '#00add8',
    'C++': '#f34b7d',
    'C#': '#178600',
    Python: '#3572A5',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Java: '#b07219',
    Rust: '#dea584',
    Shell: '#89e051',
    PHP: '#4F5D95',
    Kotlin: '#A97BFF',
    Swift: '#F05138',
};

/**
 * Pure relative time formatter that does not invoke impure Date.now() during render
 */
function formatTimeAgo(dateStr, baseTimestamp) {
    if (!dateStr) return '';
    const dateMs = new Date(dateStr).getTime();
    const now = baseTimestamp || dateMs;
    const diff = Math.max(0, (now - dateMs) / 1000);

    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ── Layout-Matching Skeletons (Zero CLS) ─────────────────────────────────────

function GitHubSkeleton() {
    return (
        <div className="gh-skeleton-container" aria-busy="true" aria-label="Loading GitHub data">
            {/* Profile skeleton */}
            <div className="gh-profile-card">
                <div className="gh-profile-left">
                    <div className="sk-avatar" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 }}>
                        <div className="sk-line" style={{ width: 160, height: 24 }} />
                        <div className="sk-line short" style={{ width: 110, height: 18 }} />
                        <div className="sk-line" style={{ width: 260, height: 14 }} />
                    </div>
                </div>
                <div className="gh-stats-row">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="gh-stat-badge" style={{ minWidth: 100, height: 86 }}>
                            <div className="sk-line" style={{ width: 36, height: 18 }} />
                            <div className="sk-line" style={{ width: 48, height: 12 }} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Contribution graph skeleton */}
            <div className="gh-contrib-card">
                <div className="gh-card-head"><Calendar size={14} /> Contribution Graph</div>
                <div className="gh-contrib-wrap" style={{ minHeight: 160 }}>
                    <div className="sk-box" style={{ width: '100%', height: 130 }} />
                </div>
            </div>

            {/* Two-column skeleton */}
            <div className="gh-two-col">
                <div className="gh-card">
                    <div className="gh-section-label"><Code2 size={13} /> Languages</div>
                    <div className="sk-box" style={{ width: '100%', height: 14, borderRadius: 100, marginBottom: 24 }} />
                    <div className="gh-lang-legend">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="sk-box" style={{ height: 32 }} />
                        ))}
                    </div>
                </div>

                <div className="gh-card">
                    <div className="gh-section-label"><Zap size={13} /> Recent Activity</div>
                    <div className="gh-activity-feed">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="sk-box" style={{ height: 60 }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Repositories grid skeleton */}
            <div>
                <div className="gh-section-label mt"><Star size={13} /> Top Repositories</div>
                <div className="gh-repos-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="gh-repo-card" style={{ minHeight: 180 }}>
                            <div className="sk-line" style={{ width: '50%', height: 20, marginBottom: 12 }} />
                            <div className="sk-line" style={{ width: '90%', height: 14, marginBottom: 8 }} />
                            <div className="sk-line short" style={{ width: '60%', height: 14, marginBottom: 20 }} />
                            <div className="sk-line" style={{ width: '40%', height: 12, marginTop: 'auto' }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatBadge({ icon: Icon, value, label }) {
    return (
        <div className="gh-stat-badge" title={`${label}: ${value ?? 0}`}>
            <Icon size={16} className="gh-stat-icon" />
            <span className="gh-stat-val">{value ?? 0}</span>
            <span className="gh-stat-lbl">{label}</span>
        </div>
    );
}

function LangBar({ langs }) {
    const [hoveredLang, setHoveredLang] = useState(null);
    if (!langs || Object.keys(langs).length === 0) return null;
    const total = Object.values(langs).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    const sorted = Object.entries(langs)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 7);

    return (
        <div className="gh-lang-section">
            <div className="gh-section-label"><Code2 size={13} /> Languages</div>
            <div className="gh-lang-bar">
                {sorted.map(([lang, bytes]) => {
                    const isHovered = hoveredLang === lang;
                    const isDimmed = hoveredLang && hoveredLang !== lang;
                    const pct = ((bytes / total) * 100).toFixed(1);
                    return (
                        <div
                            key={lang}
                            className={`gh-lang-segment ${isHovered ? 'active' : ''} ${isDimmed ? 'dimmed' : ''}`}
                            style={{
                                width: `${pct}%`,
                                background: LANG_COLOR[lang] || '#94a3b8',
                            }}
                            title={`${lang}: ${pct}%`}
                            onMouseEnter={() => setHoveredLang(lang)}
                            onMouseLeave={() => setHoveredLang(null)}
                        />
                    );
                })}
            </div>
            <div className="gh-lang-legend">
                {sorted.map(([lang, bytes]) => {
                    const isHovered = hoveredLang === lang;
                    const isDimmed = hoveredLang && hoveredLang !== lang;
                    const pct = ((bytes / total) * 100).toFixed(1);
                    return (
                        <div
                            key={lang}
                            className={`gh-lang-item ${isHovered ? 'active' : ''} ${isDimmed ? 'dimmed' : ''}`}
                            onMouseEnter={() => setHoveredLang(lang)}
                            onMouseLeave={() => setHoveredLang(null)}
                        >
                            <span className="gh-lang-dot" style={{ background: LANG_COLOR[lang] || '#94a3b8' }} />
                            <span className="gh-lang-name">{lang}</span>
                            <span className="gh-lang-pct">{pct}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function RepoCard({ repo }) {
    return (
        <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="gh-repo-card"
            title={`View ${repo.name} on GitHub`}
        >
            <div className="gh-repo-header">
                <BookOpen size={13} className="gh-repo-icon" />
                <span className="gh-repo-name">{repo.name}</span>
                <ExternalLink size={11} className="gh-repo-ext" />
            </div>
            <p className="gh-repo-desc">{repo.description || 'No description provided.'}</p>
            <div className="gh-repo-footer">
                {repo.language && (
                    <span className="gh-repo-lang">
                        <span className="gh-lang-dot sm" style={{ background: LANG_COLOR[repo.language] || '#94a3b8' }} />
                        {repo.language}
                    </span>
                )}
                <span className="gh-repo-stars"><Star size={11} /> {repo.stargazers_count || 0}</span>
                <span className="gh-repo-forks"><GitFork size={11} /> {repo.forks_count || 0}</span>
            </div>
        </a>
    );
}

function ActivityItem({ event, baseTime }) {
    const iconMap = {
        PushEvent: <GitCommit size={13} />,
        PullRequestEvent: <GitPullRequest size={13} />,
        CreateEvent: <GitBranch size={13} />,
        ForkEvent: <GitFork size={13} />,
    };

    const labelMap = {
        PushEvent: 'Pushed to',
        PullRequestEvent: (e) => `PR #${e.payload?.number || ''} ${e.payload?.action || ''}`,
        CreateEvent: 'Created branch in',
        ForkEvent: 'Forked',
    };

    const label = typeof labelMap[event.type] === 'function'
        ? labelMap[event.type](event)
        : (labelMap[event.type] || event.type.replace('Event', ''));

    const repoName = event.repo?.name ? event.repo.name.split('/')[1] : 'repo';
    const repoUrl = `https://github.com/${event.repo?.name || USERNAME}`;
    const commitMsg = event.payload?.commits?.[0]?.message;

    return (
        <div className="gh-activity-item">
            <div className={`gh-act-dot ${event.type === 'PullRequestEvent' ? 'pr' : ''}`}>
                {iconMap[event.type] || <Zap size={13} />}
            </div>
            <div className="gh-act-body">
                <div>
                    <span className="gh-act-label">{label}</span>{' '}
                    <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="gh-act-repo">
                        {repoName}
                    </a>
                </div>
                {commitMsg && (
                    <div className="gh-act-msg" title={commitMsg}>
                        &ldquo;{commitMsg.length > 55 ? `${commitMsg.slice(0, 55)}…` : commitMsg}&rdquo;
                    </div>
                )}
            </div>
            <span className="gh-act-time">{formatTimeAgo(event.created_at, baseTime)}</span>
        </div>
    );
}

export default function GitHub() {
    const sectionRef = useRef(null);
    const [profile, setProfile] = useState(null);
    const [repos, setRepos] = useState([]);
    const [events, setEvents] = useState([]);
    const [langs, setLangs] = useState({});
    const [totalStars, setTotalStars] = useState(0);
    const [prCount, setPrCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadedAt, setLoadedAt] = useState(null);

    // Optimized consolidated fetch (single request to server-cached bundle)
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/github?type=all');
            if (!res.ok) {
                throw new Error(`API returned status ${res.status}`);
            }

            const data = await res.json();
            const now = Date.now();
            setLoadedAt(now);

            // Populate state from consolidated response
            setProfile(data.profile || null);
            setPrCount(Number(data.prCount) || 0);
            setTotalStars(Number(data.totalStars) || 0);

            // Top repos
            if (Array.isArray(data.topRepos)) {
                setRepos(data.topRepos);
            } else if (Array.isArray(data.repos)) {
                const own = data.repos.filter(r => !r.fork);
                setRepos(own.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0)).slice(0, 6));
            }

            // Events
            if (Array.isArray(data.events)) {
                setEvents(data.events);
            }

            // Languages: prefer server-aggregated stats, fallback to client computation
            if (data.langs && Object.keys(data.langs).length > 0) {
                setLangs(data.langs);
            } else if (Array.isArray(data.repos)) {
                const langTotals = {};
                data.repos.filter(r => !r.fork && r.language).slice(0, 15).forEach(r => {
                    langTotals[r.language] = (langTotals[r.language] || 0) + (r.size || 1);
                });
                setLangs(langTotals);
            }
        } catch (err) {
            console.error('GitHub section error:', err);
            setError(err.message || 'Failed to load GitHub data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Lazy-load data when section scrolls into view
    useEffect(() => {
        let active = true;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && active) {
                    loadData();
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        const currentRef = sectionRef.current;
        if (currentRef) observer.observe(currentRef);

        return () => {
            active = false;
            if (currentRef) observer.disconnect();
        };
    }, [loadData]);

    const pushCount = events.filter(e => e.type === 'PushEvent').length;

    return (
        <section id="github" className="section" ref={sectionRef}>
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.6 }}
                    className="section-header fm-initial"
                >
                    <div className="section-tag">Open Source</div>
                    <h2 className="section-title">
                        <span className="grad-text">GitHub</span> Activity
                    </h2>
                    <p className="section-desc">
                        Live stats pulled from the GitHub API — commits, PRs, repos, and language usage.
                    </p>
                </motion.div>

                {loading ? (
                    <GitHubSkeleton />
                ) : error && !profile ? (
                    <div className="gh-error-card">
                        <AlertCircle size={28} color="#ef4444" style={{ marginBottom: 8 }} />
                        <p style={{ color: 'var(--text-secondary)' }}>Unable to connect to GitHub right now.</p>
                        <button className="gh-retry-btn" onClick={loadData}>
                            <RefreshCw size={13} /> Try Again
                        </button>
                    </div>
                ) : (
                    <>
                        {/* ── Profile + Stats row ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ delay: 0.1 }}
                            className="gh-profile-card fm-initial"
                        >
                            <div className="gh-profile-left">
                                <img
                                    src={profile?.avatar_url || `https://github.com/${USERNAME}.png`}
                                    alt={profile?.name || USERNAME}
                                    className="gh-avatar"
                                    loading="lazy"
                                />
                                <div>
                                    <div className="gh-name">{profile?.name || USERNAME}</div>
                                    <a
                                        href={`https://github.com/${USERNAME}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="gh-handle"
                                    >
                                        <Github size={13} /> @{USERNAME}
                                    </a>
                                    {profile?.bio && <p className="gh-bio">{profile.bio}</p>}
                                </div>
                            </div>

                            <div className="gh-stats-row">
                                <StatBadge icon={BookOpen} value={profile?.public_repos} label="Repos" />
                                <StatBadge icon={Users} value={profile?.followers} label="Followers" />
                                <StatBadge icon={Star} value={totalStars} label="Stars Received" />
                                <StatBadge icon={GitPullRequest} value={prCount} label="PRs" />
                                <StatBadge icon={GitCommit} value={pushCount} label="Recent Pushes" />
                            </div>
                        </motion.div>

                        {/* ── Contribution graph ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ delay: 0.15 }}
                            className="gh-contrib-card fm-initial"
                        >
                            <div className="gh-card-head"><Calendar size={14} /> Contribution Graph</div>
                            <div className="gh-contrib-wrap">
                                <img
                                    src={`https://ghchart.rshah.org/2563EB/${USERNAME}`}
                                    alt="GitHub contribution chart"
                                    className="gh-contrib-img"
                                    loading="lazy"
                                />
                            </div>
                            <a
                                href={`https://github.com/${USERNAME}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="gh-view-all"
                            >
                                View on GitHub <ExternalLink size={12} />
                            </a>
                        </motion.div>

                        {/* ── Languages + Activity ── */}
                        <div className="gh-two-col">
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ delay: 0.18 }}
                                className="gh-card fm-initial"
                            >
                                <LangBar langs={langs} />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ delay: 0.2 }}
                                className="gh-card fm-initial"
                            >
                                <div className="gh-section-label"><Zap size={13} /> Recent Activity</div>
                                <div className="gh-activity-feed">
                                    {events.length > 0
                                        ? events.map(e => (
                                            <ActivityItem
                                                key={e.id}
                                                event={e}
                                                baseTime={loadedAt}
                                            />
                                        ))
                                        : <p className="gh-empty">No recent public activity.</p>
                                    }
                                </div>
                            </motion.div>
                        </div>

                        {/* ── Top Repos ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ delay: 0.22 }}
                        >
                            <div className="gh-section-label mt"><Star size={13} /> Top Repositories</div>
                            <div className="gh-repos-grid">
                                {repos.map(r => <RepoCard key={r.id} repo={r} />)}
                            </div>
                        </motion.div>
                    </>
                )}
            </div>
        </section>
    );
}
