import { Card } from '../ui/Card';
import { formatDateISO } from '../../utils/formatters';
import styles from './FlagReasonPanel.module.css';

export function FlagReasonPanel({ item }) {
  const sources = item.sources || [];

  return (
    <Card>
      <div className="mono-label">Why this was flagged</div>
      <p className={styles.narrative}>{item.narrative}</p>

      {sources.length > 0 && (
        <div className={styles.sources}>
          <span className="mono-label">Sources</span>
          {sources.map((source) => (
            <span key={source.label} className={styles.source} title="Source document viewer isn't wired up yet">
              {source.label}{source.date ? ` · ${formatDateISO(source.date)}` : ''} <span aria-hidden="true">→</span>
            </span>
          ))}
        </div>
      )}

      <div className={`mono-label ${styles.ruleSet}`}>Rule set {item.program_name} v{item.rule_set_version}</div>
    </Card>
  );
}
