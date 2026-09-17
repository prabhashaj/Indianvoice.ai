/**
 * VoxSales AI — App Store
 * Minimal context for UI-only state that doesn't need to be persisted.
 * All entity data (agents, campaigns, leads, calls) is fetched from the
 * real FastAPI backend via TanStack Query — see src/lib/api.ts.
 */
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface AppStore {
  /** Currently selected sidebar item (UI only) */
  activeSidebarItem: string;
  setActiveSidebarItem: (item: string) => void;

  /** Whether the mobile nav is open */
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
}

const AppStoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [activeSidebarItem, setActiveSidebarItem] = useState("/");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <AppStoreContext.Provider
      value={{
        activeSidebarItem,
        setActiveSidebarItem,
        mobileNavOpen,
        setMobileNavOpen,
      }}
    >
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used inside AppStoreProvider");
  return ctx;
}
