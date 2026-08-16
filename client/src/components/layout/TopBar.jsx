import { useSidebar } from '../../context/SidebarContext';
import styles from './TopBar.module.css';

export function TopBar({ breadcrumb = [], children }) {
  const { toggle } = useSidebar();

  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        <button type="button" className={styles.hamburger} onClick={toggle} aria-label="Toggle menu">☰</button>
        <div className={`mono-label ${styles.breadcrumb}`}>
          {breadcrumb.map((part, i) => (
            <span key={part} className={i === breadcrumb.length - 1 ? styles.current : styles.part}>
              {i > 0 && <span className={styles.separator}>/</span>}
              {part}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.right}>{children}</div>
    </header>
  );
}
