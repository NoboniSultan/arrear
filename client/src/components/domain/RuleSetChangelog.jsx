import { useState } from 'react';
import { Card } from '../ui/Card';
import { formatDateLong } from '../../utils/formatters';
import styles from './RuleSetChangelog.module.css';

export function RuleSetChangelog({ programs }) {
  const [expanded, setExpanded] = useState(false);

  const entries = programs
    .flatMap((p) => p.changelog.map((c) => ({ ...c, programName: p.name })))
    .sort((a, b) => new Date(b.change_date) - new Date(a.change_date));

  const visible = expanded ? entries : entries.slice(0, 4);

  return (
    <Card>
      <div className="mono-label">Rule set changelog</div>
      <div className={styles.feed}>
        {visible.map((entry) => (
          <div key={entry.id} className={styles.entry}>
            <div className={styles.meta}>
              <span className="mono-label">{formatDateLong(entry.change_date)}</span>
              <span className="mono-label">{entry.programName} v{entry.version}</span>
            </div>
            <p className={styles.description}>{entry.description}</p>
          </div>
        ))}
      </div>
      {entries.length > 4 && (
        <button type="button" className={styles.expandLink} onClick={() => setExpanded((e) => !e)}>
          {expanded ? 'Show fewer ←' : `All ${entries.length} rule set changes →`}
        </button>
      )}
    </Card>
  );
}
