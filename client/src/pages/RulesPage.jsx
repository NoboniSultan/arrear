import { useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { usePrograms } from '../hooks/usePrograms';
import { useRules } from '../hooks/useRules';
import { createRule } from '../services/api';
import { CURRENT_USER } from '../constants';
import { formatDateLong } from '../utils/formatters';
import styles from './RulesPage.module.css';

const STATUS_LABELS = { draft: 'Draft', in_review: 'In review', active: 'Active', archived: 'Archived' };
const STATUS_CLASS = { draft: 'draft', in_review: 'inReview', active: 'active', archived: 'archived' };

export function RulesPage() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { programs } = usePrograms();
  const { rules, loading } = useRules({ program_id: programId });
  const program = programs.find((p) => String(p.id) === programId);

  async function handleAddRule() {
    const rule = await createRule({
      programId: Number(programId),
      name: 'New rule',
      description: '',
      sqlQuery: '-- Write a SELECT-only detection query\nSELECT * FROM flagged_items LIMIT 10',
      createdBy: CURRENT_USER.name,
    });
    navigate(`/programs/${programId}/rules/${rule.id}`);
  }

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className={styles.name}>{r.name}</span> },
    { key: 'status', label: 'Status', render: (r) => <span className={`${styles.badge} ${styles[STATUS_CLASS[r.status]]}`}>{STATUS_LABELS[r.status]}</span> },
    { key: 'version', label: 'Version', render: (r) => <span className="mono-label">v{r.version}</span> },
    { key: 'updated_at', label: 'Last updated', render: (r) => formatDateLong(r.updated_at) },
    {
      key: 'action',
      label: '',
      render: (r) => <button type="button" className={styles.openLink} onClick={() => navigate(`/programs/${programId}/rules/${r.id}`)}>Open →</button>,
    },
  ];

  return (
    <>
      <TopBar breadcrumb={['Programs', program?.name || '...', 'Rules']} />
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <h1>Rules</h1>
            <div className={`mono-label ${styles.subtitle}`}>{program?.full_name || ''} · {rules.length} rule{rules.length === 1 ? '' : 's'}</div>
          </div>
          <Button variant="secondary" onClick={handleAddRule}>Add rule</Button>
        </div>

        <Card padded={false}>
          {loading ? <div className={styles.loading}>Loading…</div> : <DataTable columns={columns} rows={rules} rowKey={(r) => r.id} />}
        </Card>
      </div>
    </>
  );
}
