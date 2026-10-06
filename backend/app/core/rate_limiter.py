import time
from collections import defaultdict
from fastapi import HTTPException, Request, status


class SlidingWindowRateLimiter:
    """
    In-Memory Sliding Window Rate Limiter.
    Tracks timestamps per key (e.g. IP or email) within a sliding time window.
    Designed for zero-dependency local operation and production safety.
    """

    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)

    def is_allowed(self, key: str) -> tuple[bool, int]:
        now = time.time()
        window_start = now - self.window_seconds
        
        # Filter out timestamps outside current sliding window
        self.requests[key] = [ts for ts in self.requests[key] if ts > window_start]
        
        if len(self.requests[key]) >= self.max_requests:
            oldest = self.requests[key][0]
            retry_after = int(oldest + self.window_seconds - now) + 1
            return False, max(1, retry_after)
            
        self.requests[key].append(now)
        return True, 0

    def check(self, request: Request, identifier: str | None = None):
        client_ip = request.client.host if request.client else "127.0.0.1"
        key = f"{client_ip}:{identifier}" if identifier else client_ip
        
        allowed, retry_after = self.is_allowed(key)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)}
            )


# Pre-configured domain limiters
otp_rate_limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=60)
login_rate_limiter = SlidingWindowRateLimiter(max_requests=10, window_seconds=60)
rag_rate_limiter = SlidingWindowRateLimiter(max_requests=20, window_seconds=60)
search_rate_limiter = SlidingWindowRateLimiter(max_requests=30, window_seconds=60)
