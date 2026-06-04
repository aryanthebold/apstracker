from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os

# Allowed origins — restrict to your deployed frontend domain(s).
# Set ALLOWED_ORIGINS in .env as a comma-separated list for production.
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

ENV = os.environ.get("ENV", "production")

app = FastAPI(
    title="APS Tracker API",
    # Only expose /docs and /openapi.json in local development
    docs_url="/docs" if ENV == "development" else None,
    redoc_url="/redoc" if ENV == "development" else None,
    openapi_url="/openapi.json" if ENV == "development" else None,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# Restrict to specific frontend origin(s). Never use allow_origins=["*"]
# alongside allow_credentials=True — that is a security bypass.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Security headers middleware ───────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # Remove server fingerprinting
    if "server" in response.headers:
        del response.headers["server"]
    # Prevent MIME-type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    # Limit referrer info leakage
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # Content Security Policy — restrict what scripts/resources can load
    response.headers["Content-Security-Policy"] = (
        "default-src 'none'; "
        "frame-ancestors 'none';"
    )
    # Prevent XSS in older browsers
    response.headers["X-XSS-Protection"] = "1; mode=block"
    # Only send Permissions-Policy to restrict dangerous browser APIs
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response

@app.get("/", include_in_schema=False)
def read_root():
    return {"message": "APS Tracker API is running."}

from routers import upload, leaderboard, admin, students

app.include_router(upload.router)
app.include_router(leaderboard.router)
app.include_router(admin.router)
app.include_router(students.router)
