import { formatDateLong } from '../../utils/formatters';
import styles from './RulePreviewResults.module.css';

export function RulePreviewResults({ result, error, loading }) {
  if (loading) {
    return <div className={styles.status}>Running preview…</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <div className="mono-label">Preview rejected</div>
        <p>{error}</p>
      </div>
    );
  }

  if (!result) return null;

  const columns = result.sampleRows.length ? Object.keys(result.sampleRows[0]) : [];

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className="mono-label">{result.rowCount} row{result.rowCount === 1 ? '' : 's'} (capped at 50)</span>
        <span className="mono-label">Run at {formatDateLong(result.executedAt)}</span>
      </div>

      {columns.length === 0 ? (
        <p className={styles.empty}>Query ran successfully but returned no rows.</p>
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map((col) => <th key={col} className="mono-label">{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {result.sampleRows.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => <td key={col}>{String(row[col] ?? '—')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
