import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { addNote } from '../../services/api';
import { formatDateLong } from '../../utils/formatters';
import styles from './InternalNotes.module.css';

export function InternalNotes({ flaggedItemId, notes, onNoteAdded }) {
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  async function handlePost() {
    if (!draft.trim()) return;
    setPosting(true);
    setError(null);
    try {
      await addNote(flaggedItemId, { note: draft.trim() });
      setDraft('');
      onNoteAdded && onNoteAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  }

  return (
    <Card>
      <div className={styles.header}>
        <span className="mono-label">Internal notes</span>
        <span className="mono-label">Not sent to the payer</span>
      </div>

      <div className={styles.thread}>
        {notes.map((note) => (
          <div key={note.id} className={styles.note}>
            <div className={styles.noteHeader}>
              <span className={styles.author}>{note.author}</span>
              <span className={`mono-label ${styles.timestamp}`}>{formatDateLong(note.created_at)}</span>
            </div>
            <p className={styles.body}>{note.note}</p>
          </div>
        ))}
        {notes.length === 0 && <p className={styles.empty}>No notes yet.</p>}
      </div>

      <div className={styles.composer}>
        <span className={styles.avatar} />
        <input
          type="text"
          className={styles.input}
          placeholder="Add a note for the record..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePost()}
        />
        <Button variant="outline" onClick={handlePost} disabled={posting || !draft.trim()}>
          {posting ? 'Posting...' : 'Post'}
        </Button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </Card>
  );
}
