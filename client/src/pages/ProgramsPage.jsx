import { useState } from 'react';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgramsTable } from '../components/domain/ProgramsTable';
import { DetectionSettingsCard } from '../components/domain/DetectionSettingsCard';
import { RuleSetChangelog } from '../components/domain/RuleSetChangelog';
import { AddProgramForm } from '../components/domain/AddProgramForm';
import { usePrograms } from '../hooks/usePrograms';
import { createProgram, updateProgram } from '../services/api';
import styles from './ProgramsPage.module.css';

export function ProgramsPage() {
  const { programs, loading, refetch } = usePrograms();
  const [showAddForm, setShowAddForm] = useState(false);

  async function handleUpdate(id, patch) {
    await updateProgram(id, patch);
    refetch();
  }

  async function handleCreate(form) {
    await createProgram(form);
    setShowAddForm(false);
    refetch();
  }

  if (loading) {
    return (
      <>
        <TopBar breadcrumb={['Programs']} />
        <div className={styles.page}>Loading…</div>
      </>
    );
  }

  const activeCount = programs.filter((p) => p.status === 'active').length;

  return (
    <>
      <TopBar breadcrumb={['Programs']}>
        <span className="mono-label">Rule sets synced nightly from CMS</span>
      </TopBar>

      <div className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <h1>Programs</h1>
            <div className={`mono-label ${styles.subtitle}`}>
              {programs.length} configured · {activeCount} active · {programs.length - activeCount} paused
            </div>
          </div>
          <Button variant="secondary" onClick={() => setShowAddForm((s) => !s)}>Add program</Button>
        </div>

        {showAddForm && <AddProgramForm onSubmit={handleCreate} onCancel={() => setShowAddForm(false)} />}

        <Card padded={false}>
          <ProgramsTable programs={programs} onActivate={(id) => handleUpdate(id, { status: 'active' })} />
        </Card>

        <div className={styles.bottomGrid}>
          <DetectionSettingsCard programs={programs} onUpdate={handleUpdate} />
          <RuleSetChangelog programs={programs} />
        </div>
      </div>
    </>
  );
}
