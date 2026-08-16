import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { reviewRule } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDateLong } from '../../utils/formatters';
import styles from './RuleReviewPanel.module.css';

const ACTION_LABELS = {
  approved: 'Approved',
  requested_changes: 'Requested changes',
  rejected: 'Rejected',
};

export function RuleReviewPanel({ rule, reviews, onReviewed }) {
  const { user } = useAuth();
  const [action, setAction] = useState('approved');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isInReview = rule.status === 'in_review';
  const isOwner = user?.role === 'owner';
  const notesRequired = action !== 'approved';

  async function handleSubmit() {
    if (notesRequired && !notes.trim()) {
      setError('Notes are required when requesting changes or rejecting.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // reviewer is derived server-side from the authenticated session, not
      // sent from here — see server/controllers/rulesController.js.
      await reviewRule(rule.id, { action, notes: notes.trim() || undefined });
      setNotes('');
      onReviewed && onReviewed();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <div className="mono-label">Review history</div>
      <div className={styles.feed}>
        {reviews.map((r) => (
          <div key={r.id} className={styles.entry}>
            <div className={styles.meta}>
              <span className={r.action === 'approved' ? styles.approved : styles.otherAction}>{ACTION_LABELS[r.action] || r.action}</span>
              <span className="mono-label">{formatDateLong(r.created_at)} · By {r.reviewer}</span>
            </div>
            {r.notes && <p className={styles.description}>{r.notes}</p>}
          </div>
        ))}
        {reviews.length === 0 && <p className={styles.empty}>No reviews yet.</p>}
      </div>

      {isInReview && !isOwner && (
        <p className={styles.restricted}>Only an owner can approve, request changes, or reject this rule.</p>
      )}

      {isInReview && isOwner && (
        <div className={styles.form}>
          <div className={`mono-label ${styles.formLabel}`}>Record a review</div>
          <select className={styles.select} value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="approved">Approve &amp; activate</option>
            <option value="requested_changes">Request changes</option>
            <option value="rejected">Reject</option>
          </select>
          <textarea
            className={styles.notesInput}
            rows={3}
            placeholder={notesRequired ? 'Notes are required for this action...' : 'Notes (optional)...'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button variant={action === 'approved' ? 'primary' : 'outline'} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : `Submit review`}
          </Button>
          {error && <p className={styles.error}>{error}</p>}
        </div>
      )}
    </Card>
  );
}
