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

## Why local

Patient data never leaves the clinic's network. The LLM runs locally via
Ollama, not a cloud API.

## Tech stack

Node.js/Express, PostgreSQL, React (Vite), Ollama.

## Project structure

```
server/
  config/       Postgres connection pool
  models/       data access layer (flagged items, programs, rules, reviews, ...)
  controllers/  request handlers and business rules (status transitions, review gates)
  routes/       Express route definitions
  services/     Ollama integration, SQL validation, rule-preview execution
  server.js     entry point

client/
  src/components/  layout shell, reusable UI primitives, and domain-specific components
  src/pages/       one file per route
  src/hooks/       data-fetching hooks, one per resource
  src/services/    api.js — every fetch call to the backend lives here
  src/styles/      design tokens (tokens.css)
  src/utils/       formatters and shared helpers

db/
  schema.sql    CREATE TABLE statements
  seed.js       synthetic dataset for local dev/testing
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

Re-running this wipes and re-seeds cleanly.

### 4. Start Ollama (for report generation)

```bash
ollama pull llama3.1   # or whatever model you set in OLLAMA_MODEL
ollama serve
```

### 5. Start the backend

```bash
npm start
```

Runs on `http://localhost:3000`.

### 6. Start the frontend

In a second terminal:

```bash
cd client
npm run dev
```

Opens on `http://localhost:5173`. Vite proxies `/api` to the Express server,
so no CORS setup is needed.

## Status

Early-stage project built in collaboration between **[your name]** and
**[dad's name]**. Currently uses synthetic data only — no real patient data
or live Epic connection yet.

## Data policy

This repository must never contain real PHI, real Clarity connection
strings, or real patient data. Synthetic data only; all credentials go
through environment variables, never committed.
