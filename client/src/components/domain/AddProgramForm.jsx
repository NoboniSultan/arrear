import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import styles from './AddProgramForm.module.css';

export function AddProgramForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: '', fullName: '', description: '', rulesVersion: '2026.1' });
  const [saving, setSaving] = useState(false);

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.fullName.trim()) return;
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className="mono-label">Add program</div>
        <div className={styles.grid}>
          <label className={styles.field}>
            <span className="mono-label">Code</span>
            <input value={form.name} onChange={(e) => set('name', e.target.value.toUpperCase())} placeholder="CCM" required />
          </label>
          <label className={styles.field}>
            <span className="mono-label">Name</span>
            <input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Chronic care management" required />
          </label>
          <label className={styles.field}>
            <span className="mono-label">Rules version</span>
            <input value={form.rulesVersion} onChange={(e) => set('rulesVersion', e.target.value)} placeholder="2026.1" />
          </label>
        </div>
        <label className={styles.field}>
          <span className="mono-label">Description</span>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} />
        </label>
        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Creating...' : 'Create program'}</Button>
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
