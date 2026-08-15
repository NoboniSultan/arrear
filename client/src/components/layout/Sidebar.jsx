import { NavLink, Link, useLocation } from 'react-router-dom';
import { useSummary } from '../../hooks/useSummary';
import { CURRENT_USER } from '../../constants';
import styles from './Sidebar.module.css';

const SAVED_VIEWS = [
  { label: 'New · unassigned', to: '/flagged-items?status=new&assignee=unassigned' },
  { label: 'Assigned to me', to: `/flagged-items?assignee=${encodeURIComponent(CURRENT_USER.name)}` },
  { label: 'Over $1,000', to: '/flagged-items?minValue=1000' },
  { label: 'Deadline under 60 days', to: '/flagged-items?deadlineDays=60' },
];

export function Sidebar() {
  const { summary } = useSummary();
  const location = useLocation();
  const currentQuery = `${location.pathname}${location.search}`;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}>ARREAR</div>
        <div className={styles.org}>Northside Medical Group</div>
      </div>

      <nav className={styles.nav}>
        <NavLink to="/" end className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          Overview
        </NavLink>
        <NavLink to="/flagged-items" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <span>Flagged items</span>
          {summary && <span className="tabular-nums">{summary.flaggedItemsOpen.total}</span>}
        </NavLink>
        <NavLink to="/submissions" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <span>Submissions</span>
          {summary && <span className="tabular-nums">{summary.recoveredPeriodToDate.itemsSubmittedTotal}</span>}
        </NavLink>
        <NavLink to="/programs" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          Programs
        </NavLink>
        <NavLink to="/audit-log" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          Audit log
        </NavLink>
      </nav>

      <div className={styles.savedViews}>
        <div className={`mono-label ${styles.savedViewsLabel}`}>Saved views</div>
        {SAVED_VIEWS.map((view) => (
          <Link
            key={view.label}
            to={view.to}
            className={`${styles.savedView} ${currentQuery === view.to ? styles.activeView : ''}`}
          >
            {view.label}
          </Link>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.syncStatus}>
          <span className={styles.syncDot} />
          <span className="mono-label">Epic sync · not connected</span>
        </div>
        <div className={styles.user}>
          <span className={styles.avatar} />
          <div>
            <div className={styles.userName}>{CURRENT_USER.name}</div>
            <div className={`mono-label ${styles.userRole}`}>{CURRENT_USER.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
