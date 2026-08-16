import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { SidebarProvider } from '../../context/SidebarContext';
import styles from './AppLayout.module.css';

export function AppLayout() {
  return (
    <SidebarProvider>
      <div>
        <Sidebar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
