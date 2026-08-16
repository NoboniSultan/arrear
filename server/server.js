require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const { sessionMiddleware } = require('./config/session');
const requireAuth = require('./middleware/requireAuth');

const authRouter = require('./routes/auth');
const flaggedItemsRouter = require('./routes/flaggedItems');
const programsRouter = require('./routes/programs');
const reportsRouter = require('./routes/reports');
const rulesRouter = require('./routes/rules');
const programsController = require('./controllers/programsController');
const flaggedItemsController = require('./controllers/flaggedItemsController');

const app = express();
const PORT = process.env.PORT || 3000;

// Render (and most PaaS platforms) terminate TLS at their edge and forward
// requests to this app over plain HTTP internally, adding an
// X-Forwarded-Proto: https header. Without telling Express to trust that
// header from its immediate proxy, req.secure is always false here, and
// express-session silently refuses to ever send a Secure cookie — every
// login "succeeds" (200, correct user JSON) but no session cookie is set,
// so the user is immediately logged out again. Confirmed by testing this
// exact scenario locally before writing DEPLOY.md. Harmless in local dev:
// there's no proxy, so this header is simply never present.
app.set('trust proxy', 1);

app.use(helmet());

// Only enabled when ALLOWED_ORIGIN is set (production, where the
// Cloudflare Pages frontend and this backend are on different domains).
// Local dev has no ALLOWED_ORIGIN and stays same-origin via the Vite proxy,
// so no CORS handling is needed there at all. Deliberately a single exact
// origin, never a wildcard — credentials: true. A wildcard combined with
// credentialed requests is also rejected by browsers, but the real reason
// is that this API sits behind session cookies and must not honor requests
// from arbitrary origins.
if (process.env.ALLOWED_ORIGIN) {
  app.use(cors({ origin: process.env.ALLOWED_ORIGIN, credentials: true }));
}

app.use(express.json());
app.use(sessionMiddleware);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Public — no session required.
app.use('/api/auth', authRouter);

// Everything below this line requires an authenticated session.
app.use(requireAuth);

app.use('/api/flagged-items', flaggedItemsRouter);
app.use('/api/programs', programsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/rules', rulesRouter);

// Cross-program rollup — kept top-level rather than nested under
// /api/programs since it reports on recovery_summary, not a single program.
app.get('/api/summary', programsController.overview);

// Global feed across all items — kept top-level for the same reason.
app.get('/api/audit-log', flaggedItemsController.globalAuditLog);

app.listen(PORT, () => {
  console.log(`Arrear server listening on http://localhost:${PORT}`);
});
