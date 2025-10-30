'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface DeveloperModeContextType {
  isDeveloperMode: boolean;
  toggleDeveloperMode: () => void;
  canUseDeveloperMode: boolean;
}

const DeveloperModeContext = createContext<DeveloperModeContextType>({
  isDeveloperMode: false,
  toggleDeveloperMode: () => {},
  canUseDeveloperMode: false,
});

export function DeveloperModeProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  const userRole = (session?.user as any)?.role;
  const canUseDeveloperMode = userRole === 'DEVELOPER' || userRole === 'ADMIN';

  const toggleDeveloperMode = () => {
    if (canUseDeveloperMode) {
      setIsDeveloperMode((prev) => !prev);
    }
  };

  return (
    <DeveloperModeContext.Provider
      value={{
        isDeveloperMode,
        toggleDeveloperMode,
        canUseDeveloperMode,
      }}
    >
      {children}
    </DeveloperModeContext.Provider>
  );
}

export function useDeveloperMode() {
  const context = useContext(DeveloperModeContext);
  if (!context) {
    throw new Error('useDeveloperMode must be used within DeveloperModeProvider');
  }
  return context;
}

