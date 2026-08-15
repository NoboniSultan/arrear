import { Link, useParams } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { RuleEditor } from '../components/domain/RuleEditor';
import { RuleVersionHistory } from '../components/domain/RuleVersionHistory';
import { RuleReviewPanel } from '../components/domain/RuleReviewPanel';
import { useRule } from '../hooks/useRule';
import { submitRuleForReview, archiveRule } from '../services/api';
import styles from './RuleEditorPage.module.css';

const STATUS_LABELS = { draft: 'Draft', in_review: 'In review', active: 'Active', archived: 'Archived' };
const STATUS_CLASS = { draft: 'draft', in_review: 'inReview', active: 'active', archived: 'archived' };

export function RuleEditorPage() {
  const { programId, ruleId } = useParams();
  const { rule, loading, refetch } = useRule(ruleId);

  async function handleSubmitForReview() {
    await submitRuleForReview(ruleId);
    refetch();
  }

  async function handleArchive() {
    await archiveRule(ruleId);
    refetch();
  }

  if (loading || !rule) {
    return (
      <>
        <TopBar breadcrumb={['Programs', 'Rules']} />
        <div className={styles.page}>Loading…</div>
      </>
    );
  }

  return (
    <>
      <TopBar breadcrumb={['Programs', rule.program_name, 'Rules', rule.name]} />
      <div className={styles.page}>
        <Link to={`/programs/${programId}/rules`} className={styles.backLink}>← Back to rules</Link>
        <div className={styles.header}>
          <div>
            <div className={styles.badgeRow}>
              <span className={`${styles.badge} ${styles[STATUS_CLASS[rule.status]]}`}>{STATUS_LABELS[rule.status]}</span>
              <span className="mono-label">{rule.program_full_name} · v{rule.version}</span>
            </div>
            <h1>{rule.name}</h1>
          </div>
          <div className={styles.workflowActions}>
            {rule.status === 'draft' && <Button variant="primary" onClick={handleSubmitForReview}>Submit for review</Button>}
            {rule.status === 'active' && <Button variant="outline" onClick={handleArchive}>Archive</Button>}
          </div>
        </div>

        <div className={styles.mainGrid}>
          <div className={styles.mainColumn}>
            <RuleEditor rule={rule} onSaved={refetch} />
          </div>
          <div className={styles.sideColumn}>
            <RuleVersionHistory versions={rule.versions} />
            <RuleReviewPanel rule={rule} reviews={rule.reviews} onReviewed={refetch} />
          </div>
        </div>
      </div>
    </>
  );
}
