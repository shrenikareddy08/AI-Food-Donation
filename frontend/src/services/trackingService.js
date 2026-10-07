/**
 * trackingService.js
 *
 * Provides mock and real delivery tracking data.
 * Mock mode simulates volunteer movement along a route.
 * Real mode is prepared for WebSocket / SSE / polling.
 */

const MOCK_MODE = true;

// Generate a mock route between two coordinates
function interpolateRoute(start, end, steps = 20) {
  const route = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    route.push({
      latitude: start.latitude + (end.latitude - start.latitude) * t,
      longitude: start.longitude + (end.longitude - start.longitude) * t,
      timestamp: new Date(Date.now() + i * 3000).toISOString(),
      status: 'IN_TRANSIT',
    });
  }
  return route;
}

export const trackingService = {
  isMockMode: MOCK_MODE,

  /**
   * Start mock tracking — calls onUpdate with each position along the route.
   * Returns a cancel function.
   */
  startMockTracking(pickup, destination, onUpdate, intervalMs = 2000) {
    const route = interpolateRoute(pickup, destination, 25);
    let index = 0;

    onUpdate({ ...route[0], progress: 0 });

    const timer = setInterval(() => {
      index++;
      if (index >= route.length) {
        onUpdate({ ...route[route.length - 1], status: 'DELIVERED', progress: 100 });
        clearInterval(timer);
        return;
      }
      const progress = Math.round((index / (route.length - 1)) * 100);
      onUpdate({ ...route[index], progress });
    }, intervalMs);

    return () => clearInterval(timer);
  },

  /**
   * Real tracking via WebSocket — prepared for future backend integration.
   * URL would be something like ws://localhost:8081/tracking/{deliveryId}
   */
  startWebSocketTracking(url, onUpdate, onError) {
    let ws;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      onError?.(err);
      return () => {};
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onUpdate(data);
      } catch {
        // ignore malformed
      }
    };
    ws.onerror = (err) => onError?.(err);

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  },

  /**
   * Real tracking via Server-Sent Events — prepared for future backend integration.
   */
  startSSETracking(url, onUpdate, onError) {
    let eventSource;
    try {
      eventSource = new EventSource(url);
    } catch (err) {
      onError?.(err);
      return () => {};
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onUpdate(data);
      } catch {
        // ignore
      }
    };
    eventSource.onerror = (err) => onError?.(err);

    return () => eventSource.close();
  },

  /**
   * Real tracking via polling — prepared for future backend integration.
   */
  startPollingTracking(fetchFn, onUpdate, onError, intervalMs = 5000) {
    const poll = async () => {
      try {
        const data = await fetchFn();
        onUpdate(data);
      } catch (err) {
        onError?.(err);
      }
    };
    poll();
    const timer = setInterval(poll, intervalMs);
    return () => clearInterval(timer);
  },
};
