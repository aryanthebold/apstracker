"""
Simple in-memory sliding-window rate limiter.
Uses client IP as the key.  Suitable for a single-process deployment.
For multi-process / multi-replica deploy, swap the dict for Redis.
"""
from fastapi import Request, HTTPException
from collections import defaultdict, deque
import time


class RateLimiter:
    """
    Sliding-window rate limiter.
    max_requests  – allowed hits per window_seconds
    window_seconds – rolling window duration in seconds
    """

    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # {client_ip: deque of timestamps}
        self._store: dict[str, deque] = defaultdict(deque)

    def _client_ip(self, request: Request) -> str:
        # Respect X-Forwarded-For if behind a trusted reverse proxy
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def __call__(self, request: Request):
        ip = self._client_ip(request)
        now = time.monotonic()
        window_start = now - self.window_seconds

        # Prune stale entries
        q = self._store[ip]
        while q and q[0] < window_start:
            q.popleft()

        if len(q) >= self.max_requests:
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please slow down.",
                headers={"Retry-After": str(self.window_seconds)},
            )

        q.append(now)


# Pre-built limiters — import & attach via Depends()
upload_limiter = RateLimiter(max_requests=10, window_seconds=60)   # 10 uploads / min
admin_limiter  = RateLimiter(max_requests=30, window_seconds=60)   # 30 admin calls / min
general_limiter = RateLimiter(max_requests=60, window_seconds=60)  # 60 general calls / min
