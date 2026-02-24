# Deployment Notes — VJIT Alumni Portal

## Required Environment Variables (Vercel Production)

Set these in **Vercel → Project Settings → Environment Variables**:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | Neon/Postgres connection string |
| `JWT_SECRET` | ✅ Yes | Secret key for JWT signing (min 32 chars recommended) |
| `NEXT_PUBLIC_APP_URL` | Optional | Production URL (defaults to `http://localhost:3000`) |
| `REFRESH_TOKEN_SECRET` | Optional | Separate secret for refresh tokens (defaults to `JWT_SECRET`) |
| `PUSHER_APP_ID` | Optional | Pusher app ID for real-time events |
| `NEXT_PUBLIC_PUSHER_KEY` | Optional | Pusher public key |
| `PUSHER_SECRET` | Optional | Pusher secret key |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Optional | Pusher cluster region |

## Build Behavior

- Environment validation is **lazy** — it only runs at runtime when an API request is made, not during the build.
- If `DATABASE_URL` or `JWT_SECRET` are missing at runtime, API routes return a clear error listing the missing variables.
- The build will succeed without env vars; the app just won't function until they're set.

## Deploy

```bash
git push origin main   # Triggers Vercel auto-deploy
```
