import { spawn } from 'child_process';
import assert from 'assert';
import http from 'http';
import { signToken } from '../src/lib/auth.js';
import { executeQuery, getDb } from '../src/lib/db.js';

const PORT = 3009;
const BASE_URL = `http://localhost:${PORT}`;

function waitForServer(port, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`http://localhost:${port}/api/auth`, (res) => {
        if (res.statusCode) {
          resolve();
        } else {
          setTimeout(check, 300);
        }
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Server failed to start on port ${port} within ${timeoutMs}ms`));
        } else {
          setTimeout(check, 300);
        }
      });
    };
    check();
  });
}

async function run() {
  console.log('🚀 Starting Next.js Production Server on port', PORT, '...');
  
  // Clean database before test
  await getDb();
  await executeQuery('DELETE FROM analytics_events');
  console.log('🧹 Cleaned analytics_events table.');

  const nextProcess = spawn(
    'npx',
    ['next', 'start', '-p', String(PORT)],
    {
      shell: true,
      stdio: 'inherit',
      env: { ...process.env, PORT: String(PORT) },
    }
  );

  try {
    await waitForServer(PORT);
    console.log('✅ Server is up and ready! Running test scenarios...\n');

    // -------------------------------------------------------------------------
    // Scenario 1: Open portfolio homepage
    // -------------------------------------------------------------------------
    console.log('--- Scenario 1: Open portfolio homepage ---');
    const res1 = await fetch(`${BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0',
        'Referer': 'https://github.com/rahull2509',
      },
      body: JSON.stringify({
        event_type: 'portfolio_view',
        page_path: '/',
        screen_width: 1440,
        visitor_id: 'visitor_session_alpha',
      }),
    });

    assert.strictEqual(res1.status, 200);
    const data1 = await res1.json();
    assert.strictEqual(data1.success, true);
    
    // Check Set-Cookie
    const cookieHeader = res1.headers.get('set-cookie');
    console.log('Set-Cookie received:', Boolean(cookieHeader));
    console.log('✅ Scenario 1 Passed: Initial page view recorded successfully.');

    // -------------------------------------------------------------------------
    // Scenario 2: Rapid duplicate submission (deduplication check)
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 2: Immediate duplicate tracking check ---');
    const res2 = await fetch(`${BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
      },
      body: JSON.stringify({
        event_type: 'portfolio_view',
        page_path: '/',
        visitor_id: 'visitor_session_alpha',
      }),
    });
    const data2 = await res2.json();
    assert.strictEqual(data2.deduped, true, 'Immediate duplicate should be deduped');
    console.log('✅ Scenario 2 Passed: React StrictMode/rapid duplicate prevented by deduplication window.');

    // -------------------------------------------------------------------------
    // Scenario 3: Navigate between public pages
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 3: Navigate to public project detail page ---');
    const res3 = await fetch(`${BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile',
      },
      body: JSON.stringify({
        event_type: 'portfolio_view',
        page_path: '/project/socialhub-1',
        screen_width: 390,
        visitor_id: 'visitor_session_beta',
      }),
    });
    const data3 = await res3.json();
    assert.strictEqual(data3.success, true);
    console.log('✅ Scenario 3 Passed: Public page navigation recorded.');

    // -------------------------------------------------------------------------
    // Scenario 4: Click resume button
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 4: Click View Resume button ---');
    const res4 = await fetch(`${BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
      },
      body: JSON.stringify({
        event_type: 'resume_click',
        page_path: '/',
        visitor_id: 'visitor_session_alpha',
      }),
    });
    const data4 = await res4.json();
    assert.strictEqual(data4.success, true);
    console.log('✅ Scenario 4 Passed: Resume click recorded independently.');

    // -------------------------------------------------------------------------
    // Scenario 5: Download resume served by server
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 5: Server-served Resume Download ---');
    const res5 = await fetch(`${BASE_URL}/api/analytics/resume-download`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
      },
    });
    assert.strictEqual(res5.status, 200);
    assert.strictEqual(res5.headers.get('content-type'), 'application/pdf');
    assert.strictEqual(res5.headers.get('content-disposition'), 'attachment; filename="Rahul_Gangwar_Resume.pdf"');
    const pdfBytes = await res5.arrayBuffer();
    assert.strictEqual(pdfBytes.byteLength > 100000, true, 'Resume PDF must be valid non-empty PDF');
    console.log(`✅ Scenario 5 Passed: Resume served (${pdfBytes.byteLength} bytes) and download event recorded.`);

    // -------------------------------------------------------------------------
    // Scenario 6: Visit admin dashboard (must be excluded from metrics)
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 6: Admin dashboard visit (excluded) ---');
    const res6 = await fetch(`${BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'portfolio_view',
        page_path: '/admin/dashboard',
        visitor_id: 'visitor_session_admin',
      }),
    });
    const data6 = await res6.json();
    assert.strictEqual(data6.ignored, 'excluded_path');
    console.log('✅ Scenario 6 Passed: Admin visits excluded from portfolio metrics.');

    // -------------------------------------------------------------------------
    // Scenario 7: Bot filtering check
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 7: Bot traffic filter ---');
    const res7 = await fetch(`${BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
      body: JSON.stringify({
        event_type: 'portfolio_view',
        page_path: '/',
        visitor_id: 'bot_crawler_1',
      }),
    });
    const data7 = await res7.json();
    assert.strictEqual(data7.ignored, 'bot');
    console.log('✅ Scenario 7 Passed: Crawler/bot traffic automatically filtered out.');

    // -------------------------------------------------------------------------
    // Scenario 8: Unauthorized analytics stats access
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 8: Unauthorized stats API access ---');
    const res8Unauth = await fetch(`${BASE_URL}/api/analytics/stats?range=30d`);
    assert.strictEqual(res8Unauth.status, 401, 'Unauthenticated request must return 401');
    console.log('✅ Scenario 8a Passed: Unauthenticated access blocked with 401.');

    // Authenticated admin request
    const adminToken = signToken({ email: 'admin@rahulgangwar.dev', role: 'admin' });
    const res8Auth = await fetch(`${BASE_URL}/api/analytics/stats?range=30d`, {
      headers: {
        Cookie: `ks_token=${adminToken}`,
      },
    });
    assert.strictEqual(res8Auth.status, 200, 'Authenticated admin should receive 200 OK');
    const statsData = await res8Auth.json();
    assert.strictEqual(statsData.success, true);
    
    console.log('\n📊 Verified Dashboard Stats:');
    console.log('  Total Views:', statsData.data.summary.totalViews);
    console.log('  Unique Visitors:', statsData.data.summary.uniqueVisitors);
    console.log('  Resume Clicks:', statsData.data.summary.resumeClicks);
    console.log('  Resume Downloads:', statsData.data.summary.resumeDownloads);
    console.log('  Click-to-Download Ratio:', statsData.data.summary.clickToDownloadRatio + '%');
    console.log('  Devices breakdown:', statsData.data.devices);
    console.log('  Top pages:', statsData.data.topPages);

    assert.strictEqual(statsData.data.summary.totalViews, 2, 'Total views should be 2');
    assert.strictEqual(statsData.data.summary.uniqueVisitors, 2, 'Unique visitors should be 2');
    assert.strictEqual(statsData.data.summary.resumeClicks, 1, 'Resume clicks should be 1');
    assert.strictEqual(statsData.data.summary.resumeDownloads, 1, 'Resume downloads served should be 1');
    assert.strictEqual(statsData.data.summary.clickToDownloadRatio, 100, 'Ratio should be 100%');
    console.log('✅ Scenario 8b Passed: Admin stats retrieved accurately with verified numbers.');

    console.log('\n========================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED 100%!');
    console.log('========================================\n');
  } finally {
    console.log('🛑 Stopping Next.js test server...');
    nextProcess.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error('\n❌ E2E Test Failed:', err);
  process.exit(1);
});
