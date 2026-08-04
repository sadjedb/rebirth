"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { PublicUser } from "@/lib/users";

type UserContextValue = {
  user: PublicUser | null;
  loading: boolean;
};

const UserContext = createContext<UserContextValue>({ user: null, loading: true });

/**
 * Refetches on pathname change rather than holding session state in the
 * root layout. Keeps every marketing/product page statically prerenderable
 * (reading cookies() in the layout would force the entire app to dynamic
 * rendering). Trade-off: a brief flash before the nav reflects login state
 * on first paint — same trade-off already accepted for the cart badge.
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/session")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return <UserContext.Provider value={{ user, loading }}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
