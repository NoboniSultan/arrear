import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { Badge } from '../components/ui/Badge';
import { FlagReasonPanel } from '../components/domain/FlagReasonPanel';
import { CriteriaChecklist } from '../components/domain/CriteriaChecklist';
import { CodingChangeCompare } from '../components/domain/CodingChangeCompare';
import { InternalNotes } from '../components/domain/InternalNotes';
import { ValueEstimateCard } from '../components/domain/ValueEstimateCard';
import { AssignmentCard } from '../components/domain/AssignmentCard';
import { AuditTrail } from '../components/domain/AuditTrail';
import { ItemDispositionBar } from '../components/domain/ItemDispositionBar';
import { useFlaggedItem } from '../hooks/useFlaggedItem';
import { reviewFlaggedItem } from '../services/api';
import { formatCurrency, formatDateLong, formatDateISO } from '../utils/formatters';
import styles from './ItemDetailPage.module.css';

export function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { item, loading, refetch } = useFlaggedItem(id);
  const [submitting, setSubmitting] = useState(false);

  async function disposition(action, notes) {
    setSubmitting(true);
    try {
      // reviewer is derived server-side from the authenticated session.
      await reviewFlaggedItem(id, { action, notes });
      refetch();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !item) {
    return (
      <>
        <TopBar breadcrumb={['Flagged items', 'Assigned to me']} />
        <div className={styles.page}>Loading…</div>
      </>
    );
  }

  return (
    <>
      <TopBar breadcrumb={['Flagged items', 'Assigned to me', item.patient_ref]}>
        <span className="mono-label">Item {item.position} of {item.totalCount}</span>
        <button className={styles.navArrow} disabled={Number(id) <= 1} onClick={() => navigate(`/flagged-items/${Number(id) - 1}`)}>‹</button>
        <button className={styles.navArrow} disabled={Number(id) >= item.totalCount} onClick={() => navigate(`/flagged-items/${Number(id) + 1}`)}>›</button>
      </TopBar>

      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.badgeRow}>
              <Badge status={item.status} />
              <span className={styles.programBadge}>{item.program_full_name || item.program_name}</span>
              <span className="mono-label">{item.patient_ref} · Flagged {formatDateLong(item.created_at)}</span>
            </div>
            <h1>{item.title}</h1>
            <div className={`mono-label ${styles.metaRow}`}>
              <span>Encounter {formatDateISO(item.encounter_date)}</span>
              <span>Provider: {item.provider}</span>
              <span>Claim {item.claim_number}</span>
              <span>Submit by {formatDateISO(item.submit_by_date)}</span>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className="mono-label">Estimated value</div>
            <div className={`tabular-nums ${styles.value}`}>{formatCurrency(item.estimated_dollar_value)}</div>
            <div className="mono-label">Annualized, plan year {new Date(item.submit_by_date).getUTCFullYear()}</div>
          </div>
        </div>

        <div className={styles.mainGrid}>
          <div className={styles.mainColumn}>
            <FlagReasonPanel item={item} />
            <CriteriaChecklist criteria={item.criteriaChecklist} />
            <CodingChangeCompare item={item} />
            <InternalNotes flaggedItemId={item.id} notes={item.internalNotes} onNoteAdded={refetch} />
          </div>
          <div className={styles.sideColumn}>
            <ValueEstimateCard item={item} />
            <AssignmentCard item={item} />
            <AuditTrail trail={item.auditTrail} />
          </div>
        </div>
      </div>

      <ItemDispositionBar
        submitting={submitting}
        onApprove={() => disposition('submitted', 'Approved and submitted for program credit.')}
        onNeedsInfo={() => disposition('needs_info', 'Requested more information before disposition.')}
        onReject={(reason) => disposition('rejected', `Reason: ${reason}`)}
      />
    </>
  );
}
