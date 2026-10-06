const http = require('http');
const EventEmitter = require('events');
const server = require('./server');

function testEndpoint(method, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = urlPath;
    req.headers = { host: 'localhost' };

    let resHeaders = {};
    let resStatusCode = 200;
    let resBody = '';

    const res = {
      writeHead: (code, headers) => {
        resStatusCode = code;
        resHeaders = headers;
      },
      end: (chunk) => {
        if (chunk) resBody += chunk;
        try {
          const parsed = JSON.parse(resBody || '{}');
          resolve({ status: resStatusCode, body: parsed });
        } catch (e) {
          resolve({ status: resStatusCode, body: resBody });
        }
      }
    };

    server.emit('request', req, res);

    if (body) {
      req.emit('data', JSON.stringify(body));
    }
    req.emit('end');
  });
}

async function runTests() {
  console.log('[Microservice Test Runner] Initializing unit tests...');

  // 1. Test /health
  const healthRes = await testEndpoint('GET', '/health');
  console.log('[Test] GET /health status:', healthRes.body.status === 'UP' ? 'PASS' : 'FAIL');
  if (healthRes.body.status !== 'UP') process.exit(1);

  // 2. Test /api/activity/feed
  const feedRes = await testEndpoint('GET', '/api/activity/feed');
  console.log('[Test] GET /api/activity/feed count:', feedRes.body.count > 0 ? 'PASS' : 'FAIL');
  if (feedRes.body.count <= 0) process.exit(1);

  // 3. Test /api/activity/log
  const logRes = await testEndpoint('POST', '/api/activity/log', {
    userId: 88,
    action: 'TEST_IN_PROCESS_EVENT',
    entityType: 'TEST',
    metadata: { note: 'Socket-free automated test runner' }
  });
  console.log('[Test] POST /api/activity/log:', logRes.body.status === 'SUCCESS' ? 'PASS' : 'FAIL');
  if (logRes.body.status !== 'SUCCESS') process.exit(1);

  // 4. Test /api/activity/stats
  const statsRes = await testEndpoint('GET', '/api/activity/stats');
  console.log('[Test] GET /api/activity/stats:', Array.isArray(statsRes.body.stats) ? 'PASS' : 'FAIL');
  if (!Array.isArray(statsRes.body.stats)) process.exit(1);

  console.log('\n>>> ALL ACTIVITY MICROSERVICE TESTS PASSED (PASS: 4/4) <<<\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('[Microservice Test Failure]:', err);
  process.exit(1);
});
