import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { generateReport } from '../../services/api';
import styles from './ReportGenerator.module.css';

// Ollama is unreachable in two genuinely different ways: on the free-tier
// hosted deployment (see DEPLOY.md Part 5 — expected, not a bug), or
// locally when `ollama serve` just isn't running. Either way the raw error
// (a bare "fetch failed", or a connection-refused message) is not something
// a reviewer should have to interpret — surface the actual reason plainly
// instead of a generic "something went wrong".
const UNREACHABLE_MESSAGE = "Report generation requires the local Ollama connection, which isn't reliably available in this free demo deployment — try again, or test this feature locally.";

export function ReportGenerator({ flaggedItemId }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const result = await generateReport(flaggedItemId);
      setReport(result.reportText);
    } catch {
      // The backend already logs the real error (connection refused, DNS
      // failure, timeout, etc.) — the reviewer just needs the plain
      // explanation, not the raw technical detail.
      setError(UNREACHABLE_MESSAGE);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className={styles.header}>
        <span className="mono-label">Plain-language report</span>
        <Button variant="secondary" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : report ? 'Regenerate' : 'Generate report'}
        </Button>
      </div>

      {!report && !error && !loading && (
        <p className={styles.hint}>
          Drafts a plain-language summary of this flag using the local LLM (Ollama). Not saved, not sent anywhere.
        </p>
      )}

      {loading && <p className={styles.hint}>Asking the local model to draft this…</p>}

      {error && (
        <div className={styles.error}>
          <div className="mono-label">Couldn't reach the local LLM</div>
          <p>{error}</p>
        </div>
      )}

      {report && <p className={styles.reportText}>{report}</p>}
    </Card>
  );
}
