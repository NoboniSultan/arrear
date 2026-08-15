import { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { updateRule, previewRule } from '../../services/api';
import { RulePreviewResults } from './RulePreviewResults';
import styles from './RuleEditor.module.css';

const EDITABLE_STATUSES = ['draft', 'in_review'];

export function RuleEditor({ rule, onSaved }) {
  const isEditable = EDITABLE_STATUSES.includes(rule.status);

  const [name, setName] = useState(rule.name);
  const [description, setDescription] = useState(rule.description || '');
  const [sqlQuery, setSqlQuery] = useState(rule.sql_query);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [previewResult, setPreviewResult] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    setName(rule.name);
    setDescription(rule.description || '');
    setSqlQuery(rule.sql_query);
  }, [rule.id, rule.name, rule.description, rule.sql_query]);

  const isDirty = name !== rule.name || description !== (rule.description || '') || sqlQuery !== rule.sql_query;

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      await updateRule(rule.id, { name, description, sqlQuery });
      onSaved && onSaved();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRunPreview() {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewResult(null);
    try {
      const result = await previewRule(rule.id, sqlQuery);
      setPreviewResult(result);
    } catch (err) {
      setPreviewError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <Card>
      <div className={styles.fields}>
        <label className={styles.field}>
          <span className="mono-label">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={!isEditable} />
        </label>
        <label className={styles.field}>
          <span className="mono-label">Description</span>
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} disabled={!isEditable} />
        </label>
        <label className={styles.field}>
          <span className="mono-label">SQL query</span>
          <textarea
            className={styles.sqlTextarea}
            rows={12}
            spellCheck={false}
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            disabled={!isEditable}
          />
          <span className={styles.caption}>
            Preview runs against Arrear's own database — there's no Epic Clarity connection configured yet.
          </span>
        </label>
      </div>

      <div className={styles.actions}>
        {isEditable && (
          <Button variant="primary" onClick={handleSave} disabled={saving || !isDirty}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        )}
        <Button variant="secondary" onClick={handleRunPreview} disabled={previewLoading}>
          {previewLoading ? 'Running...' : 'Run preview'}
        </Button>
      </div>
      {saveError && <p className={styles.error}>{saveError}</p>}

      <div className={styles.previewSection}>
        <RulePreviewResults result={previewResult} error={previewError} loading={previewLoading} />
      </div>
    </Card>
  );
}
