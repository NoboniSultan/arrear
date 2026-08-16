# Arrear

## What this is

Arrear helps clinics recover missed government/payer incentive revenue (MIPS,
HCC risk adjustment, and similar programs) by continuously scanning Epic EMR
data for documented care that qualifies for reporting but was never
submitted, flagging it for human review, and tracking recovery through to
submission.

## How it works

1. Detection rules (SQL queries, one or more per program) run on a schedule
   against clinic EMR data.
2. Every rule that runs against real data has been reviewed and formally
   approved through the Rules review workflow — no query touches patient
   data without human sign-off, and every activated version is permanently
   logged.
3. Matches get written to Arrear's own database as flagged items.
4. A local LLM (via Ollama) generates a plain-language explanation for each
   flag, so a reviewer doesn't have to manually parse raw codes and lab
   values.
5. A human coder reviews each flagged item — approve & submit, request more
   info, or reject — in the review UI.
6. Approved items are tracked through submission and counted as recovered
   revenue.

## Key features

- Flagged items queue with filtering, bulk actions, and audit logging
- Item detail view with full evidence trail and proposed coding changes
- Recovery dashboard (totals, trend over time, breakdown by program)
- Rules engine with a review/finalize workflow: analysts can view, edit, and
  preview SQL detection logic, but nothing goes live until a second reviewer
  approves it, and every activated version is permanently versioned for
  audit purposes
- Session-based login for internal team accounts only — there is no public
  signup; every action (review, note, rule edit/approval) is attributed to
  the authenticated user, not a client-supplied name

## Why local

Patient data never leaves the clinic's network. The LLM runs locally via
Ollama, not a cloud API.

## Tech stack

Node.js/Express, PostgreSQL, React (Vite), Ollama.

## Project structure

```
server/
  config/       Postgres connection pool, session store config
  models/       data access layer (flagged items, programs, rules, reviews, users, ...)
  controllers/  request handlers and business rules (status transitions, review gates)
  routes/       Express route definitions
  services/     Ollama integration, SQL validation, rule-preview execution, password hashing
  middleware/   requireAuth, requireRole, login rate limiting
  server.js     entry point

client/
  src/components/  layout shell, reusable UI primitives, and domain-specific components
  src/pages/       one file per route (LoginPage included)
  src/context/     AuthContext — session state and login/logout, via useAuth()
  src/hooks/       data-fetching hooks, one per resource
  src/services/    api.js — every fetch call to the backend lives here
  src/styles/      design tokens (tokens.css)
  src/utils/       formatters and shared helpers

db/
  schema.sql      CREATE TABLE statements
  seed.js         synthetic app dataset for local dev/testing
  createUser.js   the only way to create a login — see "Getting started" below
```

## Getting started

### 1. Install dependencies

```bash
npm install
cd client && npm install && cd ..
```

### 2. Set up Postgres

```bash
createdb arrear_dev
cp .env.example .env          # backend config; edit with your local Postgres credentials
cp client/.env.example client/.env
psql -d arrear_dev -f db/schema.sql
```

### 3. Seed synthetic data

```bash
npm run seed
```

Re-running this wipes and re-seeds cleanly — it never touches the `users`
table (see step 4), so reseeding demo data never deletes real logins.

### 4. Create your login accounts

There is no signup page — accounts are created only via this CLI script:

```bash
node db/createUser.js --email you@example.com --password "a real password" --name "Your Name" --role owner
```

`--role` is `owner` or `analyst` (defaults to `analyst` if omitted). The rule
approval step is owner-only. Run it again with a different `--email` for
each additional teammate.

### 5. Start Ollama (for report generation)

```bash
ollama pull llama3.1   # or whatever model you set in OLLAMA_MODEL
ollama serve
```

### 6. Start the backend

```bash
npm start
```

Runs on `http://localhost:3000`.

### 7. Start the frontend

In a second terminal:

```bash
cd client
npm run dev
```

Opens on `http://localhost:5173`. Vite proxies `/api` to the Express server,
so no CORS setup is needed.

## Deployment

**Live demo:** https://arrear.sultannoboni.workers.dev (frontend) — talks to
the backend at https://arrear-backend-i4kz.onrender.com. Free tier: the
backend may take up to ~1 minute to respond after being idle.

For hosting this for internal/demo viewing (free-tier only — Cloudflare
Pages + Render + Neon), see [DEPLOY.md](DEPLOY.md). **Read its "Demo
Deployment vs. Production Deployment" section first** — this deployment
path must never be used once real patient data is involved.

## Future enhancements

Not built yet, deliberately: password reset, email verification, and 2FA.
With only two known users, if a password needs to change, the owner can
update it directly via a small update to `db/createUser.js` (or a future
admin script) rather than building a full self-service flow now.

## Status

Early-stage project built in collaboration between **Sultan Bashar** and
**Noboni Sultan**. Currently uses synthetic data only — no real patient data
or live Epic connection yet.

## Data policy

This repository must never contain real PHI, real Clarity connection
strings, or real patient data. Synthetic data only; all credentials go
through environment variables, never committed.
