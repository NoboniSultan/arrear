import styles from './TopBar.module.css';

export function TopBar({ breadcrumb = [], children }) {
  return (
    <header className={styles.topBar}>
      <div className={`mono-label ${styles.breadcrumb}`}>
        {breadcrumb.map((part, i) => (
          <span key={part} className={i === breadcrumb.length - 1 ? styles.current : styles.part}>
            {i > 0 && <span className={styles.separator}>/</span>}
            {part}
          </span>
        ))}
      </div>
      <div className={styles.right}>{children}</div>
    </header>
  );
}
