import { useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useSummary } from '../../hooks/useSummary';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import styles from './Sidebar.module.css';

function savedViews(currentUserName) {
  return [
    { label: 'New · unassigned', to: '/flagged-items?status=new&assignee=unassigned' },
    { label: 'Assigned to me', to: `/flagged-items?assignee=${encodeURIComponent(currentUserName || '')}` },
    { label: 'Over $1,000', to: '/flagged-items?minValue=1000' },
    { label: 'Deadline under 60 days', to: '/flagged-items?deadlineDays=60' },
  ];
}

export function Sidebar() {
  const { summary } = useSummary();
  const { user, logout } = useAuth();
  const { isOpen, close } = useSidebar();
  const location = useLocation();
  const currentQuery = `${location.pathname}${location.search}`;

  // Only visibly matters on narrow screens (off-canvas overlay) — on wide
  // screens the sidebar is always shown regardless of isOpen, so closing on
  // every route change is harmless there and just keeps this one effect
  // simple rather than needing to detect viewport width in JS.
  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      {isOpen && <div className={styles.scrim} onClick={close} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <button type="button" className={styles.closeButton} onClick={close} aria-label="Close menu">✕</button>

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
          {savedViews(user?.full_name).map((view) => (
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
          {user && (
            <button type="button" className={styles.user} onClick={logout} title="Log out">
              <span className={styles.avatar} />
              <div className={styles.userText}>
                <div className={styles.userName}>{user.full_name}</div>
                <div className={`mono-label ${styles.userRole}`}>{user.role === 'owner' ? 'Owner' : 'Analyst'}</div>
              </div>
              <span className={styles.logoutLabel}>Log out</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
