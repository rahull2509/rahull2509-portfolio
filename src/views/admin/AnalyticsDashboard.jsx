'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import {
  Eye,
  Users,
  MousePointerClick,
  FileDown,
  RefreshCw,
  Calendar,
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  FileText,
  AlertCircle,
  TrendingUp,
  Database,
  CheckCircle2,
} from 'lucide-react';
import './Analytics.css';

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: 'all', label: 'All Time' },
  { id: 'custom', label: 'Custom' },
];

function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString();
}

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AnalyticsDashboard() {
  const [range, setRange] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeChartTab, setActiveChartTab] = useState('traffic'); // 'traffic' | 'resume'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      let url = `/api/analytics/stats?range=${range}`;
      if (range === 'custom') {
        if (customStart) url += `&startDate=${customStart}`;
        if (customEnd) url += `&endDate=${customEnd}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load analytics');
      }

      setData(json.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Network error fetching analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range, customStart, customEnd]);

  useEffect(() => {
    if (range !== 'custom') {
      fetchStats();
    }
  }, [range, fetchStats]);

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (customStart && customEnd) {
      fetchStats();
    }
  };

  const summary = data?.summary || {
    totalViews: 0,
    uniqueVisitors: 0,
    resumeClicks: 0,
    resumeDownloads: 0,
    clickToDownloadRatio: 0,
    dailyAvgVisitors: 0,
    daysInRange: 30,
  };

  const timeline = data?.timeline || [];
  const devices = data?.devices || [];
  const referrers = data?.referrers || [];
  const topPages = data?.topPages || [];

  // SVG Chart Geometry Calculations
  const chartHeight = 220;
  const chartWidth = 700;
  const paddingX = 40;
  const paddingY = 24;
  const innerW = chartWidth - paddingX * 2;
  const innerH = chartHeight - paddingY * 2;

  const isTraffic = activeChartTab === 'traffic';
  const seriesAKey = isTraffic ? 'views' : 'clicks';
  const seriesBKey = isTraffic ? 'visitors' : 'downloads';
  const seriesALabel = isTraffic ? 'Page Views' : 'Resume Clicks';
  const seriesBLabel = isTraffic ? 'Unique Visitors' : 'Downloads Served';
  const seriesAColor = isTraffic ? '#2563eb' : '#ea580c';
  const seriesBColor = isTraffic ? '#7c3aed' : '#059669';

  const maxVal = Math.max(
    5,
    ...timeline.map((d) => Math.max(Number(d[seriesAKey] || 0), Number(d[seriesBKey] || 0)))
  );

  const pointsA = timeline.map((d, i) => {
    const x = paddingX + (i / Math.max(1, timeline.length - 1)) * innerW;
    const y = paddingY + innerH - (Number(d[seriesAKey] || 0) / maxVal) * innerH;
    return { x, y, val: Number(d[seriesAKey] || 0), date: d.date };
  });

  const pointsB = timeline.map((d, i) => {
    const x = paddingX + (i / Math.max(1, timeline.length - 1)) * innerW;
    const y = paddingY + innerH - (Number(d[seriesBKey] || 0) / maxVal) * innerH;
    return { x, y, val: Number(d[seriesBKey] || 0), date: d.date };
  });

  const pathA = pointsA.length > 0
    ? pointsA.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`, '')
    : '';

  const pathB = pointsB.length > 0
    ? pointsB.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`, '')
    : '';

  const areaA = pointsA.length > 0
    ? `${pathA} L ${pointsA[pointsA.length - 1].x.toFixed(1)},${(paddingY + innerH).toFixed(1)} L ${pointsA[0].x.toFixed(1)},${(paddingY + innerH).toFixed(1)} Z`
    : '';

  const areaB = pointsB.length > 0
    ? `${pathB} L ${pointsB[pointsB.length - 1].x.toFixed(1)},${(paddingY + innerH).toFixed(1)} L ${pointsB[0].x.toFixed(1)},${(paddingY + innerH).toFixed(1)} Z`
    : '';

  const gradAId = useId();
  const gradBId = useId();

  // Pick ~6 evenly spaced labels for the X-axis
  const labelInterval = Math.max(1, Math.floor(timeline.length / 5));

  return (
    <div className="analytics-section">
      {/* 1. Toolbar & Controls */}
      <div className="analytics-toolbar">
        <div className="analytics-filter-group">
          {RANGES.map((r) => (
            <button
              key={r.id}
              className={`date-pill ${range === r.id ? 'active' : ''}`}
              onClick={() => setRange(r.id)}
            >
              {r.label}
            </button>
          ))}

          {range === 'custom' && (
            <form onSubmit={handleApplyCustom} className="custom-date-form">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="custom-date-input"
                required
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="custom-date-input"
                required
              />
              <button type="submit" className="date-pill active" style={{ padding: '4px 10px' }}>
                Apply
              </button>
            </form>
          )}
        </div>

        <div className="analytics-meta-actions">
          {lastUpdated && (
            <span className="analytics-timestamp">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetchStats(true)}
            className="refresh-btn"
            disabled={loading || refreshing}
            title="Refresh analytics data"
          >
            <RefreshCw size={13} className={refreshing ? 'rotating' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Error Banner */}
      {error && (
        <div className="analytics-error-state">
          <AlertCircle size={24} />
          <div>
            <strong>Unable to load analytics</strong>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>{error}</p>
          </div>
          <button onClick={() => fetchStats()} className="date-pill active" style={{ marginTop: '8px' }}>
            Retry
          </button>
        </div>
      )}

      {/* 3. Primary Summary Cards */}
      <div className="analytics-grid-4">
        {/* Total Views */}
        <div className="analytics-card">
          <div className="card-top">
            <span className="card-label">Total Portfolio Views</span>
            <div className="card-icon-wrap icon-blue">
              <Eye size={18} />
            </div>
          </div>
          {loading ? (
            <div className="skeleton skeleton-val" />
          ) : (
            <div className="card-val">{formatNumber(summary.totalViews)}</div>
          )}
          <span className="card-hint">Total public page visits</span>
        </div>

        {/* Unique Visitors */}
        <div className="analytics-card">
          <div className="card-top">
            <span className="card-label">Unique Visitors</span>
            <div className="card-icon-wrap icon-purple">
              <Users size={18} />
            </div>
          </div>
          {loading ? (
            <div className="skeleton skeleton-val" />
          ) : (
            <div className="card-val">{formatNumber(summary.uniqueVisitors)}</div>
          )}
          <span className="card-hint">Distinct anonymous sessions</span>
        </div>

        {/* Resume Clicks */}
        <div className="analytics-card">
          <div className="card-top">
            <span className="card-label">Resume Clicks</span>
            <div className="card-icon-wrap icon-orange">
              <MousePointerClick size={18} />
            </div>
          </div>
          {loading ? (
            <div className="skeleton skeleton-val" />
          ) : (
            <div className="card-val">{formatNumber(summary.resumeClicks)}</div>
          )}
          <span className="card-hint">View Resume button clicks</span>
        </div>

        {/* Resume Downloads Served */}
        <div className="analytics-card">
          <div className="card-top">
            <span className="card-label">Resume Downloads Served</span>
            <div className="card-icon-wrap icon-emerald">
              <FileDown size={18} />
            </div>
          </div>
          {loading ? (
            <div className="skeleton skeleton-val" />
          ) : (
            <div className="card-val">{formatNumber(summary.resumeDownloads)}</div>
          )}
          <span className="card-hint">Server-verified file deliveries</span>
        </div>
      </div>

      {/* 4. Secondary KPI Bar */}
      <div className="analytics-kpi-bar">
        <div className="kpi-pill">
          <span className="kpi-title">Click-to-Download Ratio</span>
          <span className="badge-ratio">
            {summary.clickToDownloadRatio}% conversion
          </span>
        </div>
        <div className="kpi-pill">
          <span className="kpi-title">Daily Average Visitors</span>
          <span className="kpi-val">{summary.dailyAvgVisitors} / day</span>
        </div>
        <div className="kpi-pill">
          <span className="kpi-title">Reporting Window</span>
          <span className="kpi-val">{summary.daysInRange} days</span>
        </div>
        <div className="kpi-pill">
          <span className="kpi-title">Storage Architecture</span>
          <span className="kpi-val" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Database size={13} color="var(--orange-dk)" />
            {data?.meta?.database || 'PostgreSQL'}
          </span>
        </div>
      </div>

      {/* 5. Interactive SVG Charts */}
      <div className="analytics-chart-card">
        <div className="chart-header">
          <div className="chart-title-wrap">
            <h3>Traffic Trends & Funnel Analysis</h3>
            <p>Historical trends over the selected reporting window</p>
          </div>

          <div className="chart-tab-group">
            <button
              className={`chart-tab ${activeChartTab === 'traffic' ? 'active' : ''}`}
              onClick={() => setActiveChartTab('traffic')}
            >
              Traffic (Views & Visitors)
            </button>
            <button
              className={`chart-tab ${activeChartTab === 'resume' ? 'active' : ''}`}
              onClick={() => setActiveChartTab('resume')}
            >
              Resume (Clicks vs Downloads)
            </button>
          </div>
        </div>

        {loading ? (
          <div className="skeleton skeleton-chart" />
        ) : timeline.length === 0 ? (
          <div className="analytics-empty-state">
            <TrendingUp size={36} />
            <p>No activity recorded for this period yet.</p>
          </div>
        ) : (
          <div>
            <div className="chart-svg-container">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                style={{ width: '100%', height: '100%', overflow: 'visible' }}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id={gradAId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={seriesAColor} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={seriesAColor} stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id={gradBId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={seriesBColor} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={seriesBColor} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-axis gridlines & labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                  const y = paddingY + innerH - pct * innerH;
                  const labelVal = Math.round(pct * maxVal);
                  return (
                    <g key={pct}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="#e5e7eb"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingX - 8}
                        y={y + 3}
                        fontSize="10"
                        fill="#9ca3af"
                        textAnchor="end"
                      >
                        {labelVal}
                      </text>
                    </g>
                  );
                })}

                {/* Area fills */}
                {areaA && <path d={areaA} fill={`url(#${gradAId})`} />}
                {areaB && <path d={areaB} fill={`url(#${gradBId})`} />}

                {/* Lines */}
                {pathA && (
                  <path
                    d={pathA}
                    fill="none"
                    stroke={seriesAColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {pathB && (
                  <path
                    d={pathB}
                    fill="none"
                    stroke={seriesBColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points */}
                {pointsA.map((p, i) => (
                  <circle
                    key={`pa-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={hoveredIndex === i ? 5 : 2.5}
                    fill="#ffffff"
                    stroke={seriesAColor}
                    strokeWidth="2"
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                ))}

                {pointsB.map((p, i) => (
                  <circle
                    key={`pb-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={hoveredIndex === i ? 5 : 2.5}
                    fill="#ffffff"
                    stroke={seriesBColor}
                    strokeWidth="2"
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                ))}

                {/* X-axis date labels */}
                {timeline.map((d, i) => {
                  if (i % labelInterval !== 0 && i !== timeline.length - 1) return null;
                  const x = paddingX + (i / Math.max(1, timeline.length - 1)) * innerW;
                  return (
                    <text
                      key={d.date}
                      x={x}
                      y={chartHeight - 4}
                      fontSize="10"
                      fill="#9ca3af"
                      textAnchor="middle"
                    >
                      {formatDateLabel(d.date)}
                    </text>
                  );
                })}
              </svg>

              {/* Hover Tooltip */}
              {hoveredIndex !== null && timeline[hoveredIndex] && (
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: `${(pointsA[hoveredIndex].x / chartWidth) * 100}%`,
                    transform: 'translateX(-50%)',
                    background: 'rgba(17, 17, 17, 0.92)',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    pointerEvents: 'none',
                    zIndex: 20,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {formatDateLabel(timeline[hoveredIndex].date)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#93c5fd' }}>
                    <span>{seriesALabel}:</span>
                    <strong>{timeline[hoveredIndex][seriesAKey]}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c4b5fd' }}>
                    <span>{seriesBLabel}:</span>
                    <strong>{timeline[hoveredIndex][seriesBKey]}</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="chart-legend" style={{ marginTop: '16px' }}>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: seriesAColor }} />
                <span>{seriesALabel}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: seriesBColor }} />
                <span>{seriesBLabel}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Detailed Breakdown Grid */}
      <div className="analytics-breakdown-grid">
        {/* Device Breakdown */}
        <div className="breakdown-card">
          <div className="breakdown-header">
            <h4>Device Distribution</h4>
            <Laptop size={16} color="var(--text-muted)" />
          </div>
          {devices.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No device data yet</p>
          ) : (
            <div className="breakdown-list">
              {devices.map((d) => {
                const Icon = d.device === 'mobile' ? Smartphone : d.device === 'tablet' ? Tablet : Laptop;
                return (
                  <div key={d.device} className="breakdown-row">
                    <div className="breakdown-info">
                      <span className="breakdown-label">
                        <Icon size={14} />
                        {d.device.charAt(0).toUpperCase() + d.device.slice(1)}
                      </span>
                      <span className="breakdown-val">
                        {d.percentage}% ({d.count})
                      </span>
                    </div>
                    <div className="breakdown-progress-bg">
                      <div
                        className="breakdown-progress-fill blue"
                        style={{ width: `${Math.min(100, Math.max(3, d.percentage))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Referrers */}
        <div className="breakdown-card">
          <div className="breakdown-header">
            <h4>Traffic Sources</h4>
            <Globe size={16} color="var(--text-muted)" />
          </div>
          {referrers.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No referral data yet</p>
          ) : (
            <div className="breakdown-list">
              {referrers.map((r) => (
                <div key={r.domain} className="breakdown-row">
                  <div className="breakdown-info">
                    <span className="breakdown-label">
                      {r.domain === 'direct' ? 'Direct / Bookmark' : r.domain}
                    </span>
                    <span className="breakdown-val">
                      {r.percentage}% ({r.count})
                    </span>
                  </div>
                  <div className="breakdown-progress-bg">
                    <div
                      className="breakdown-progress-fill purple"
                      style={{ width: `${Math.min(100, Math.max(3, r.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Visited Public Pages */}
        <div className="breakdown-card">
          <div className="breakdown-header">
            <h4>Top Public Pages</h4>
            <FileText size={16} color="var(--text-muted)" />
          </div>
          {topPages.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No page view data yet</p>
          ) : (
            <div className="breakdown-list">
              {topPages.map((p) => (
                <div key={p.path} className="breakdown-row">
                  <div className="breakdown-info">
                    <span className="breakdown-label" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {p.path}
                    </span>
                    <span className="breakdown-val">
                      {p.views} {p.views === 1 ? 'view' : 'views'}
                    </span>
                  </div>
                  <div className="breakdown-progress-bg">
                    <div
                      className="breakdown-progress-fill emerald"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(3, (p.views / Math.max(1, summary.totalViews)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
