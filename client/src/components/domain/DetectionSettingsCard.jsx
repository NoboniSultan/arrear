import { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Toggle } from '../ui/Toggle';
import styles from './DetectionSettingsCard.module.css';

const LOOKBACK_OPTIONS = [6, 12, 18, 24, 36];

export function DetectionSettingsCard({ programs, onUpdate }) {
  const [selectedId, setSelectedId] = useState(programs[0]?.id);
  const program = programs.find((p) => p.id === selectedId) || programs[0];
  const [minValue, setMinValue] = useState(Number(program.min_estimated_value));

  useEffect(() => {
    setMinValue(Number(program.min_estimated_value));
  }, [program.id, program.min_estimated_value]);

  return (
    <Card>
      <div className={styles.header}>
        <span className="mono-label">Detection settings</span>
        <select className={styles.programSelect} value={program.id} onChange={(e) => setSelectedId(Number(e.target.value))}>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className={styles.inputsRow}>
        <div className={styles.field}>
          <span className="mono-label">Minimum estimated value</span>
          <div className={styles.currencyInput}>
            <span>$</span>
            <input
              type="number"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              onBlur={() => onUpdate(program.id, { minEstimatedValue: Number(minValue) })}
            />
          </div>
          <span className={styles.caption}>Flags below this are suppressed</span>
        </div>

        <div className={styles.field}>
          <span className="mono-label">Encounter lookback</span>
          <select
            className={styles.select}
            value={program.encounter_lookback_months}
            onChange={(e) => onUpdate(program.id, { encounterLookbackMonths: Number(e.target.value) })}
          >
            {LOOKBACK_OPTIONS.map((m) => <option key={m} value={m}>{m} months</option>)}
          </select>
          <span className={styles.caption}>Bounded by payer appeal windows</span>
        </div>

        <div className={styles.field}>
          <span className="mono-label">Detection run</span>
          <input
            className={styles.select}
            defaultValue={program.detection_run_schedule}
            key={program.id}
            onBlur={(e) => onUpdate(program.id, { detectionRunSchedule: e.target.value })}
          />
          <span className={styles.caption}>After the Epic warehouse load</span>
        </div>
      </div>

      <div className={styles.toggles}>
        <div className={styles.toggleRow}>
          <Toggle checked={program.require_coder_review} onChange={(v) => onUpdate(program.id, { requireCoderReview: v })} label="Certified coder review required" />
          <div>
            <div className={styles.toggleLabel}>Certified coder review required before submission</div>
            <div className={styles.caption}>No flag can be submitted straight from a detection run, including in bulk.</div>
          </div>
        </div>
        <div className={styles.toggleRow}>
          <Toggle checked={program.reflag_on_amendment} onChange={(v) => onUpdate(program.id, { reflagOnAmendment: v })} label="Re-flag on encounter amendment" />
          <div>
            <div className={styles.toggleLabel}>Re-flag on encounter amendment</div>
            <div className={styles.caption}>A closed item reopens if its source documentation changes.</div>
          </div>
        </div>
        <div className={styles.toggleRow}>
          <Toggle checked={program.email_digest_enabled} onChange={(v) => onUpdate(program.id, { emailDigestEnabled: v })} label="Email digest to program owners" />
          <div>
            <div className={styles.toggleLabel}>Email digest to program owners</div>
            <div className={styles.caption}>{program.email_digest_enabled ? 'On.' : 'Off.'} Owners are notified in-app only.</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
