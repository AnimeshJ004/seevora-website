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

## Scripts

```bash
npm run dev
npm run dev:server
npm run build
npm run lint
```
