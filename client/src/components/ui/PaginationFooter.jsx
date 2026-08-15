import styles from './PaginationFooter.module.css';

function buildPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('…');
    result.push(p);
  });
  return result;
}

export function PaginationFooter({ total, page, pageSize, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className={styles.footer}>
      <span className="mono-label">{start}–{end} of {total}</span>

      <div className={styles.controls}>
        <span className="mono-label">Rows</span>
        <select className={styles.rowsSelect} value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
          {[10, 25, 50].map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>

        <button type="button" className={styles.arrow} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>‹</button>
        {buildPageList(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className={styles.ellipsis}>…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={`${styles.pageButton} ${p === page ? styles.pageActive : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}
        <button type="button" className={styles.arrow} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>›</button>
      </div>
    </div>
  );
}
