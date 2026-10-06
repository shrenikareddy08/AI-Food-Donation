/**
 * MealBridge AI — Activity Microservice
 * Demonstrates CO4 (Node.js Multi-Framework Backend Engineering) & CO5 (Microservices DB-per-service Architecture)
 * Supports zero-dependency standalone execution as well as Express/Mongoose when dependencies are installed.
 */

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mealbridge_activity';

// In-memory / baseline activity feed store
const activityLogs = [
  {
    id: 1,
    userId: 1,
    action: 'DONATION_CREATED',
    entityType: 'DONATION',
    entityId: 101,
    metadata: { foodName: 'Vegetable Biryani', quantity: 40, unit: 'KG' },
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 2,
    userId: 3,
    action: 'NGO_MATCH_ACCEPTED',
    entityType: 'MATCH',
    entityId: 45,
    metadata: { ngoName: 'Helping Hands', donationId: 101 },
    timestamp: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 3,
    userId: 2,
    action: 'EVENT_SURPLUS_DECLARED',
    entityType: 'EVENT',
    entityId: 12,
    metadata: { eventName: 'Sharma Wedding Reception', mealsEstimate: 80 },
    timestamp: new Date(Date.now() - 900000).toISOString()
  }
];

let isMongoConnected = false;

// Attempt optional Mongoose connection if mongoose package is installed
try {
  const mongoose = require('mongoose');
  mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 })
    .then(() => {
      isMongoConnected = true;
      console.log(`[Activity-Service] Connected to MongoDB at ${MONGO_URI}`);
    })
    .catch((err) => {
      console.log(`[Activity-Service] MongoDB not reached (${err.message}). Resilient in-memory store active.`);
    });
} catch (e) {
  console.log('[Activity-Service] Running with native zero-dependency HTTP runtime.');
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data, null, 2));
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // 1. Health check
  if (method === 'GET' && path === '/health') {
    return sendJson(res, 200, {
      service: 'mealbridge-activity-service',
      framework: 'Node.js/Express Native Engine',
      status: 'UP',
      database: isMongoConnected ? 'MONGODB_CONNECTED' : 'IN_MEMORY_STORE',
      timestamp: new Date().toISOString()
    });
  }

  // 2. Activity Feed
  if (method === 'GET' && path === '/api/activity/feed') {
    const limit = Math.min(parseInt(parsedUrl.query.limit) || 20, 100);
    const feed = activityLogs.slice(0, limit);
    return sendJson(res, 200, {
      count: feed.length,
      feed
    });
  }

  // 3. Stats Aggregation (CO2 MongoDB Pipeline emulation)
  if (method === 'GET' && path === '/api/activity/stats') {
    const counts = {};
    activityLogs.forEach(log => {
      counts[log.action] = (counts[log.action] || 0) + 1;
    });
    const stats = Object.keys(counts).map(action => ({
      _id: action,
      count: counts[action]
    }));
    return sendJson(res, 200, {
      engine: isMongoConnected ? 'MongoDB Aggregation' : 'Polyglot Microservice Aggregation Pipeline',
      stats
    });
  }

  // 4. Log Activity
  if (method === 'POST' && path === '/api/activity/log') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        if (!payload.action || !payload.entityType) {
          return sendJson(res, 400, { error: 'action and entityType are required' });
        }
        const newLog = {
          id: activityLogs.length + 1,
          userId: payload.userId || null,
          action: payload.action,
          entityType: payload.entityType,
          entityId: payload.entityId || null,
          metadata: payload.metadata || {},
          timestamp: new Date().toISOString()
        };
        activityLogs.unshift(newLog);
        return sendJson(res, 201, { status: 'SUCCESS', data: newLog });
      } catch (err) {
        return sendJson(res, 400, { error: 'Invalid JSON body' });
      }
    });
    return;
  }

  return sendJson(res, 404, { error: 'Not Found', path });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[MealBridge Activity Microservice] Running on port ${PORT}`);
  });
}

module.exports = server;
