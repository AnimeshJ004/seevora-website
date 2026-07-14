# Seevora App

React/Vite frontend with a Node.js, Express, and PostgreSQL authentication API.

## Backend Setup

1. Install PostgreSQL and create the app database:

```sql
CREATE DATABASE seevora_app;
```

2. Copy the environment example and set real values:

```bash
cp .env.example .env
```

Set `JWT_SECRET` and `RATE_LIMIT_KEY_SECRET` to different, high-entropy values of at least 32 characters. Update `DATABASE_URL` if your PostgreSQL username, password, host, port, or database name is different.

3. Start the backend API:

```bash
npm run dev:server
```

The API runs on `http://localhost:4000` and creates the `users` table automatically.
On first start it also seeds demo auth accounts for the PostgreSQL login flow:

- `admin@seevora.in` / `admin123`
- `hr@seevora.in` / `hr123`

4. Start the frontend in another terminal:

```bash
npm run dev
```

Vite proxies `/api/*` requests to the Express backend.

## Production Proxy and Rate Limiting

Run Express behind a same-host Nginx proxy and keep the Node port bound to loopback with `HOST=127.0.0.1`. Port 4000 must not be publicly reachable.

The proxy must enforce the coarse IP quota from the TCP peer address and overwrite client-supplied forwarding headers. A complete merge-ready example is available in `deploy/nginx-seevora.conf.example`; the important API directives are:

```nginx
location ^~ /api/ {
    limit_req zone=seevora_api_per_ip burst=50 nodelay;
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;
}
```

Define the shared Nginx zone in the `http` context with `limit_req_zone $binary_remote_addr zone=seevora_api_per_ip:10m rate=300r/m;`. Do not use `$proxy_add_x_forwarded_for` for this single-proxy deployment because it preserves an incoming client-supplied value.

Sensitive endpoint counters are stored atomically in PostgreSQL using HMAC-SHA256 subject identifiers. Raw login identifiers, email addresses, user IDs, and sales-session IDs are never stored in the rate-limit table. These counters are shared across Node processes and survive application restarts.

When PostgreSQL is unavailable, protected routes fail closed with HTTP 503 and `Retry-After: 5`. `GET /api/health` returns HTTP 503 with a degraded PostgreSQL status until the dependency recovers.

Current policies are:

- Nginx API edge: 300 requests per minute per TCP client IP, with a burst of 50.
- Login: 20 requests per 15 minutes per normalized login identifier.
- Public audit submission: 10 requests per 15 minutes per normalized email.
- Email sending actions: 20 requests per minute per authenticated user and policy.
- Sales-agent messages: 20 requests per minute per public session ID.

## Caching

Application query caching uses a bounded, single-process `node-cache` store. Entries are performance-only: PostgreSQL remains authoritative, and losing the cache during a restart is safe. Cache keys are SHA-256 digests of canonical descriptors, private API responses use `Cache-Control: private, no-store`, and write routes invalidate affected namespaces after successful database changes.

The cache is limited to 2,000 entries and 1 MB per entry. `GET /api/system/cache-stats` exposes hit, miss, size, and in-flight-load counts to administrators without exposing keys or values.

The Nginx example caches Vite fingerprinted `/assets/` files for one year with `immutable`, unfingerprinted public images and fonts for one day, and leaves SPA HTML non-cacheable because it contains a per-response CSP nonce. This design targets one Node process; use a shared cache before horizontally scaling to multiple Node instances.

## Auth API

- `POST /api/auth/login` validates credentials and returns a JWT.
- `POST /api/auth/forgot-password` creates a one-time reset code for a username/email and returns it for the in-app reset flow.
- `POST /api/auth/reset-password` accepts the reset code and updates the password.
- `GET /api/auth/me` returns the current user when called with `Authorization: Bearer <token>`.

## Audit Requests

- `POST /api/audit-requests` stores Book a Call audit requests.
- `GET /api/audit-requests` returns audit requests for the admin dashboard.
- `POST /api/audit-requests/:id/respond` saves an admin response and sends it by email when SMTP is configured.

Set these optional environment variables to enable email sending:

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=hello@seevora.in
SMTP_SECURE=false
```

## Scripts

```bash
npm run dev
npm run dev:server
npm run build
npm run lint
```
