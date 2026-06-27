"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  agencyId?: string;
  onboardingCompleted?: boolean;
}

const SessionContext = createContext<{ user: SessionUser | null; loading: boolean; refresh: () => Promise<void> }>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function useUserSession() {
  return useContext(SessionContext);
}

function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <SessionContext.Provider value={{ user, loading, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
