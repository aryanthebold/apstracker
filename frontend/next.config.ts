import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
          {
            // CSP: restrict what can run on the page
            // Adjust script-src / style-src if you add CDN resources
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js requires inline scripts for hydration
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // CSS-in-JS & Tailwind need unsafe-inline for styles
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              // Allow API calls to the backend origin
              `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}`,
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          {
            key: "Strict-Transport-Security",
            // Enforce HTTPS after first visit (1 year). Enable only when deployed on HTTPS.
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
