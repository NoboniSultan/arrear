import { createContext, useCallback, useContext, useState } from 'react';

const SidebarContext = createContext(null);

// isOpen only has any visual effect below the tablet breakpoint (see
// Sidebar.module.css) — above it the sidebar is always shown regardless of
// this state, so defaulting to false is safe and correct at every width.
export function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close, open }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
