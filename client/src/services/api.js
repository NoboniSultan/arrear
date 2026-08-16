// All fetch calls to the Express backend live here — no component should
// call fetch() directly. Vite's dev server proxies /api to the Express app
// (see vite.config.js), so plain relative paths work in both dev and a
// built/served bundle.

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    // The backend uses cookie-based sessions (see server/config/session.js)
    // rather than a bearer token, so every request must send credentials —
    // otherwise the session cookie never reaches the server and every
    // protected route looks unauthenticated.
    credentials: 'include',
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      // response wasn't JSON; fall back to the generic message
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

function toQueryString(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function login(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return request('/api/auth/logout', { method: 'POST' });
}

export function fetchCurrentUser() {
  return request('/api/auth/me');
}

export function fetchFlaggedItems(params) {
  return request(`/api/flagged-items${toQueryString(params)}`);
}

export function fetchFlaggedItem(id) {
  return request(`/api/flagged-items/${id}`);
}

// reviewer is derived server-side from the authenticated session — never
// sent from here (see server/controllers/flaggedItemsController.js).
export function reviewFlaggedItem(id, { action, notes }) {
  return request(`/api/flagged-items/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ action, notes }),
  });
}

// author is derived server-side from the authenticated session.
export function addNote(id, { note }) {
  return request(`/api/flagged-items/${id}/notes`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export function fetchPrograms() {
  return request('/api/programs');
}

export function createProgram({ name, fullName, description, rulesVersion }) {
  return request('/api/programs', {
    method: 'POST',
    body: JSON.stringify({ name, fullName, description, rulesVersion }),
  });
}

export function updateProgram(id, patch) {
  return request(`/api/programs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function fetchSummary() {
  return request('/api/summary');
}

export function fetchAuditLog() {
  return request('/api/audit-log');
}

export function generateReport(flaggedItemId) {
  return request(`/api/reports/generate/${flaggedItemId}`, { method: 'POST' });
}

export function fetchRules(params) {
  return request(`/api/rules${toQueryString(params)}`);
}

export function fetchRule(id) {
  return request(`/api/rules/${id}`);
}

// createdBy is derived server-side from the authenticated session.
export function createRule({ programId, name, description, sqlQuery }) {
  return request('/api/rules', {
    method: 'POST',
    body: JSON.stringify({ programId, name, description, sqlQuery }),
  });
}

export function updateRule(id, { name, description, sqlQuery }) {
  return request(`/api/rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, description, sqlQuery }),
  });
}

export function previewRule(id, sqlQuery) {
  return request(`/api/rules/${id}/preview`, {
    method: 'POST',
    body: JSON.stringify({ sqlQuery }),
  });
}

export function submitRuleForReview(id) {
  return request(`/api/rules/${id}/submit-for-review`, { method: 'POST' });
}

// reviewer is derived server-side from the authenticated session.
export function reviewRule(id, { action, notes }) {
  return request(`/api/rules/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ action, notes }),
  });
}

export function archiveRule(id) {
  return request(`/api/rules/${id}/archive`, { method: 'POST' });
}
