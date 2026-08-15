import styles from './DataTable.module.css';

export function DataTable({ columns, rows, rowKey, sortKey, sortOrder, onSort, onRowClick, rowClassName = () => '' }) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`mono-label ${styles.th} ${col.align === 'right' ? styles.alignRight : ''} ${col.sortable ? styles.sortable : ''}`}
                onClick={col.sortable ? () => onSort(col.key) : undefined}
              >
                {col.align === 'right' && col.sortable && sortKey === col.key && (
                  <span className={styles.sortArrow}>{sortOrder === 'asc' ? '▴' : '▾'}</span>
                )}
                {col.label}
                {col.align !== 'right' && col.sortable && sortKey === col.key && (
                  <span className={styles.sortArrow}>{sortOrder === 'asc' ? '▴' : '▾'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={`${styles.row} ${onRowClick ? styles.clickable : ''} ${rowClassName(row)}`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className={`${styles.td} ${col.align === 'right' ? styles.alignRight : ''}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
