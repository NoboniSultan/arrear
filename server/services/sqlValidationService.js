// Gatekeeper for any analyst-submitted SQL. Must run before ANY preview or
// execution of a rule's query — see rulePreviewService.js. On failure, we
// reject with a clear reason; we never try to "fix" or strip the dangerous
// part of a query, since silently rewriting someone's SQL is its own risk.
//
// This is a pattern-based check, not a real SQL parser — it's a fast, blunt
// safety net, not a substitute for running preview under a database role
// that only has SELECT privileges in the first place (see the comment in
// rulePreviewService.js).

// The task that requested this feature explicitly listed these seven:
// INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, GRANT. The rest below are
// added for the same reason — each can write data, run arbitrary code, or
// touch the filesystem, so a "read-only" guarantee has to cover them too.
// Flagged here rather than silently expanding scope.
const FORBIDDEN_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'GRANT',
  'REVOKE', 'CREATE', 'COPY', 'EXECUTE', 'CALL', 'MERGE', 'VACUUM', 'DO',
];

// Repeatedly strips leading whitespace and leading `--` line comments, so a
// well-commented query (like the ones this project's own seed data writes)
// isn't rejected just because it explains itself before the SELECT starts.
// Only used to locate where the real statement begins for the check below —
// the original string (comments included) is still what actually runs.
function stripLeadingCommentsAndWhitespace(sql) {
  let result = sql;
  let changed = true;
  while (changed) {
    changed = false;
    const withoutLeadingSpace = result.replace(/^\s+/, '');
    if (withoutLeadingSpace !== result) {
      result = withoutLeadingSpace;
      changed = true;
    }
    if (result.startsWith('--')) {
      const newlineIndex = result.indexOf('\n');
      result = newlineIndex === -1 ? '' : result.slice(newlineIndex + 1);
      changed = true;
    }
  }
  return result;
}

/**
 * @param {string} sqlString
 * @returns {{ ok: boolean, reason: string | null }}
 */
function isReadOnlyQuery(sqlString) {
  if (typeof sqlString !== 'string' || !sqlString.trim()) {
    return { ok: false, reason: 'Query is empty.' };
  }

  const trimmed = sqlString.trim();

  // Allow one optional trailing semicolon, but reject any query that still
  // has a semicolon after stripping it — that means multiple statements.
  const withoutTrailingSemicolon = trimmed.replace(/;\s*$/, '');
  if (withoutTrailingSemicolon.includes(';')) {
    return {
      ok: false,
      reason: 'Multiple statements are not allowed. Remove any semicolons other than one optional trailing semicolon.',
    };
  }

  for (const keyword of FORBIDDEN_KEYWORDS) {
    const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
    if (pattern.test(withoutTrailingSemicolon)) {
      return {
        ok: false,
        reason: `Query contains a disallowed keyword: ${keyword}. Only read-only SELECT queries are permitted.`,
      };
    }
  }

  const effectiveStart = stripLeadingCommentsAndWhitespace(withoutTrailingSemicolon);
  if (!/^(WITH|SELECT)\b/i.test(effectiveStart)) {
    return {
      ok: false,
      reason: 'Query must start with SELECT (or a WITH ... common table expression).',
    };
  }

  return { ok: true, reason: null };
}

module.exports = { isReadOnlyQuery };
