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

Set `JWT_SECRET` to a long random value and update `DATABASE_URL` if your PostgreSQL username, password, host, port, or database name is different.

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
