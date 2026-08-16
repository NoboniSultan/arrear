# Deploying Arrear

## Demo Deployment vs. Production Deployment — Read This First

This deployment (Cloudflare Pages free tier + Render free tier + Neon free
tier + Ollama on a personal laptop via Tailscale) is intended **only** for
internal viewing of synthetic/fake data by the founding team. It must **not**
be used once real patient data (PHI) is involved, for these reasons:

- **Render's free tier is not a HIPAA-eligible workspace.** Render only
  supports signing a BAA and processing PHI on Scale/Enterprise-tier
  HIPAA-enabled workspaces (starting around $250/month, plus a 20% usage
  surcharge), and only within that specifically enabled workspace.
- **Running Ollama on a personal laptop is not appropriate for real PHI**
  regardless of network encryption (Tailscale) — a personal device isn't an
  access-controlled, dedicated environment, and can be lost, stolen, or go
  offline unpredictably. Once real data is involved, the LLM must run on
  dedicated hardware, ideally physically at the clinic or on a leased server
  used only for this purpose.
- **Before any real patient data touches any part of this system, we need:**
  a signed BAA with the clinic, a signed BAA with Render (if continuing to
  use Render) upgraded to a HIPAA-enabled workspace, and a reassessment of
  where Ollama runs.

Treat this deployment as a way to demo the UI and workflow only. Nothing
about the current setup should be assumed to carry over unchanged once real
data is introduced.

**Known, accepted limitation of this phase:** report generation (the local
LLM drafting a plain-language summary of a flagged item) will be unreliable
on the hosted demo whenever the Render backend has spun down from
inactivity — see Part 5 for exactly why. This is an accepted tradeoff, not
a bug to chase: the demo's purpose is showing the UI and review workflow,
not proving out reliable LLM inference under a free-tier host. When this
happens, the app shows a clear explanation in place of the report ("Couldn't
reach the local LLM...") rather than failing silently or showing a generic
error — if you ever see a raw/generic error here instead of that specific
message, that's the actual bug to report.

---

## Order of operations

Set these up in this order — Render needs Neon's connection string, and
Cloudflare Pages needs Render's URL, so this is the order the dependencies
actually require:

1. **Neon** — create the database, load schema + synthetic seed data
2. **Render** — deploy the backend (needs Neon's `DATABASE_URL`)
3. **Cloudflare Pages** — deploy the frontend (needs Render's URL)
4. Back to Render once — set `ALLOWED_ORIGIN` to the real Cloudflare Pages
   URL now that you have it
5. Ollama/Tailscale — **read this section before creating any Tailscale
   config**; the free-tier constraints here are real, not cosmetic

Confirm each step actually works (there's a concrete check after each one)
before moving to the next.

---

## Part 1: Database — Neon (free tier)

### Why Neon and not Render's built-in Postgres

Render's free Postgres databases **expire and are permanently deleted 30
days after creation** (with a 14-day grace period to upgrade before
deletion), and don't support backups on the free tier. Neon's free tier has
no such expiry — it's a permanent free plan, not a trial. Compute does scale
to zero after 5 minutes of inactivity (a cold start on the next query), but
the data itself is never deleted for being idle. `render.yaml` in this repo
deliberately does not provision a Render Postgres instance for this reason.

### Steps

1. Create a free account at [neon.tech](https://neon.tech) — no credit card
   required.
2. Create a new project. This is your Postgres instance (free tier: 0.5 GB
   storage, 100 compute-hours/month, one project's worth of that is more
   than enough for this demo).
3. On the project dashboard, click **Connect** and copy the connection
   string. It looks like:
   ```
   postgresql://<user>:<password>@<host>/<dbname>?sslmode=require
   ```
   This whole string is your `DATABASE_URL` — keep it somewhere private,
   it's a credential.
4. From your local machine, load the schema and then the synthetic seed
   data against this Neon database (both `db/schema.sql` and `db/seed.js`
   already support this — see `server/config/db.js`):
   ```bash
   psql "<paste your Neon connection string>" -f db/schema.sql
   DATABASE_URL="<paste your Neon connection string>" node db/seed.js
   ```
5. Create your login account on this database too (accounts are per-database
   — the one you created locally doesn't carry over):
   ```bash
   DATABASE_URL="<paste your Neon connection string>" node db/createUser.js \
     --email you@example.com --password "a real password" --name "Your Name" --role owner
   ```

**Check before moving on:** `psql "<connection string>" -c "SELECT count(*) FROM flagged_items;"` should return 20.

---

## Part 2: Backend — Render (free tier)

### What NOT to provision

Don't add a Render Postgres database when Render prompts you to — this repo's
`render.yaml` deliberately has none (see Part 1 for why).

### Steps

1. Push your latest commits to GitHub (this repo is already at
   `github.com/NoboniSultan/arrear`).
2. Sign up at [render.com](https://render.com) — free, no credit card
   required for the free plan.
3. **New +** → **Blueprint** → connect this GitHub repo. Render will detect
   `render.yaml` at the repo root.
4. When prompted, fill in the environment variables marked for manual entry:
   - `DATABASE_URL` — the Neon connection string from Part 1
   - `OLLAMA_URL` — **read Part 5 below before filling this in** — there are
     real limitations here worth understanding first
   - `ALLOWED_ORIGIN` — leave blank/placeholder for now; you'll come back
     and set this once Cloudflare Pages gives you its URL (Part 3)
   - `SESSION_SECRET` and `NODE_ENV` are handled automatically by
     `render.yaml` (Render generates a random secret; `NODE_ENV` is
     hardcoded to `production`) — nothing to fill in for those two.
5. Deploy. Render builds with `npm install` and starts with `npm start`,
   using this repo's existing root `package.json` scripts.

**Check before moving on:** visit `https://<your-service>.onrender.com/api/health`
— should return `{"status":"ok"}`. If the service had been idle, expect this
first request to take up to ~1 minute (see below).

### Free-tier behavior worth knowing before you rely on this

- **Spins down after 15 minutes with no incoming requests.** The next
  request triggers a cold start, taking roughly a minute.
- **750 free instance-hours/month, 512 MB RAM, 0.1 CPU** — plenty for two
  people poking at a demo, nowhere near enough for production traffic.
- **No persistent disk on the free tier.** Anything written to the
  container's local filesystem is wiped on every restart or redeploy. This
  doesn't affect Arrear's actual data (all of it lives in Neon), but it's
  the direct reason the Tailscale approach in Part 5 doesn't really work on
  this tier.

---

## Part 3: Frontend — Cloudflare Pages (free)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → select this repo.
2. Build settings:
   - **Root directory:** `client`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`

   (Verified locally: `cd client && npm run build` succeeds and produces a
   `dist/` folder.)
3. **Settings → Environment variables** (set for both Production and
   Preview):
   - `VITE_API_URL` = `https://<your-render-service>.onrender.com` (no
     trailing slash) — the URL Render gave you in Part 2.
4. Deploy. Cloudflare Pages gives you a free subdomain like
   `https://arrear.pages.dev` — that's enough for this internal-only phase.
   A custom domain can be added later under the **Custom domains** tab with
   zero changes to anything above; everything here stays the same.
5. **Go back to Render** (Part 2) and set `ALLOWED_ORIGIN` to this exact
   `.pages.dev` URL (no trailing slash). Render redeploys automatically and
   CORS opens up for that one origin.

**Check before moving on:** open the `.pages.dev` URL, it should redirect to
`/login`; log in with the account from Part 1, and the app should load.

---

## Part 4: CORS and session config — what's already wired up

Confirmed by direct testing, not just code review, before this was written:

- **CORS** is configured in `server.js` via the `cors` package, enabled only
  when `ALLOWED_ORIGIN` is set, allowing exactly that one origin with
  `credentials: true` — never a wildcard, since this API sits behind
  cookie-based sessions. Tested locally: a simulated request from the
  configured origin gets `Access-Control-Allow-Origin` back; the CORS
  contract means a browser running on any *other* origin won't be able to
  read the response even though the header value is static.
- **Session cookies** (`server/config/session.js`) use `secure: true` and
  `sameSite: 'none'` in production (frontend and backend are on different
  domains, so the cookie has to be sendable cross-site), versus
  `secure: false` / `sameSite: 'lax'` in local dev.
- **A real bug caught by testing, now fixed:** Render terminates TLS at its
  edge and forwards plain HTTP internally. Without telling Express to trust
  that proxy, `req.secure` is always `false` from the app's point of view,
  and express-session **silently refuses to ever send the session cookie**
  — login looks like it succeeds (200 response, correct user JSON) but no
  session is actually established, so the user is logged out again
  immediately. `app.set('trust proxy', 1)` in `server.js` fixes this; it was
  verified locally by simulating Render's `X-Forwarded-Proto: https` header
  and confirming the `Set-Cookie` header appears with `Secure; SameSite=None`
  — and confirming it's correctly absent without that header, i.e. this
  isn't just unconditionally trusting every request.

Nothing to do here — this is already in place. Listed so it's clear what's
been verified rather than assumed.

---

## Part 5: Reaching Ollama on your Mac (Tailscale) — read before setting `OLLAMA_URL`

### The honest short answer

**On Render's free tier, a reliably persistent Tailscale connection isn't
practically achievable.** This isn't a guess — it comes directly from how
Render's own reference Tailscale setup is built, cross-checked against
Render's documented free-tier limits.

### Why, specifically

Render's own example for running Tailscale
([render-examples/tailscale](https://github.com/render-examples/tailscale))
runs it as a **Background Worker** service with a **1 GB persistent disk**
mounted at `/var/lib/tailscale` to store its connection state across
restarts. Neither of those is available on the free tier:

- **Background Workers have no free tier at all** — they start at $7/month.
- **Persistent disks aren't available on free Web Services at any price on
  this plan.** Render's own docs state free web services "cannot" use
  persistent disks.

Even setting the official pattern aside and trying to run `tailscaled` as a
side process inside the same free Web Service (the only free service type
available), the free tier's core behavior gets in the way regardless:

- Free services **fully suspend after 15 minutes** with no incoming HTTP
  traffic — everything running in the container, including a live Tailscale
  connection, stops with it.
- The filesystem is **wiped on every restart**, so Tailscale's local state
  (keys, auth) can't persist across those restarts either.

In practice, for a low-traffic two-person demo (which will sit idle for
15+ minutes constantly), this means: every time the service spins back up,
the very next request that needs the LLM has to both cold-start the whole
container (~1 minute) *and* reconnect Tailscale from scratch before it can
reach your Mac — either by re-authenticating with a reusable/ephemeral
Tailscale auth key on every restart, or simply failing. There's a real
chance the first request after any idle period times out while Tailscale is
still negotiating.

### What this means practically right now

Given the "free tier only" constraint for this phase, treat Ollama-backed
report generation **on the hosted (Render) deployment** as best-effort, not
something to depend on. The reliable way to test report generation is still
running the whole app locally — `npm start` + `npm run dev` + `ollama serve`
on the same machine, as already documented in `README.md`. No Tailscale, no
free-tier limitations, none of the above applies.

You can still set `OLLAMA_URL` on Render to your Mac's Tailscale address if
you want to experiment with the hosted version reaching it — just expect it
to be unreliable for the reasons above, not a bug to chase down.

If reliable hosted LLM access becomes something you actually need later, the
two realistic paths are:

- pay for a Render Background Worker + a small persistent disk just for the
  Tailscale piece (breaks "free tier only," but only for this one piece), or
- reconsider where Ollama runs entirely — which the demo-vs-production
  section above says has to happen anyway before any real patient data is
  involved.

Not making that call here — flagging it because it directly affects what
the hosted demo can actually do today.

**Sources:** [Render Tailscale example repo](https://github.com/render-examples/tailscale) ·
[Render free tier docs](https://render.com/docs/free) ·
[Render free PostgreSQL expiration changelog](https://render.com/changelog/free-postgresql-instances-now-expire-after-30-days-previously-90) ·
[Neon free tier FAQ](https://neon.com/faqs/managed-postgres-databases-free-tier) ·
[Neon secure connection docs](https://neon.com/docs/connect/connect-securely)
