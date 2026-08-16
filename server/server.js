require('dotenv').config();
const express = require('express');
const helmet = require('helmet');

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

app.use(helmet());
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
