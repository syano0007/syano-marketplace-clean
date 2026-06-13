// @refresh reset
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";

const BASE = import.meta.env.BASE_URL ?? "/";

interface WishlistContextValue {
  ids: number[];
  isInWishlist: (productId: number) => boolean;
  toggle: (productId: number) => Promise<boolean>;
  count: number;
  refetch: () => void;
}

const WishlistContext = createContext<WishlistContextValue>({
  ids: [],
  isInWishlist: () => false,
  toggle: async () => false,
  count: 0,
  refetch: () => {},
});

export const useWishlist = () => useContext(WishlistContext);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [ids, setIds] = useState<number[]>([]);

  const fetchIds = useCallback(() => {
    if (!isAuthenticated) { setIds([]); return; }
    fetch(`${BASE}api/wishlist/ids`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: number[]) => setIds(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => { fetchIds(); }, [fetchIds]);

  const isInWishlist = useCallback((productId: number) => ids.includes(productId), [ids]);

  const toggle = useCallback(async (productId: number): Promise<boolean> => {
    if (!isAuthenticated) return false;
    const inList = ids.includes(productId);
    // Optimistic update
    setIds((prev) => inList ? prev.filter((id) => id !== productId) : [...prev, productId]);
    try {
      if (inList) {
        await fetch(`${BASE}api/wishlist/${productId}`, { method: "DELETE", credentials: "include" });
      } else {
        await fetch(`${BASE}api/wishlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ productId }),
        });
      }
      return !inList;
    } catch {
      // Revert on error
      setIds((prev) => inList ? [...prev, productId] : prev.filter((id) => id !== productId));
      return inList;
    }
  }, [isAuthenticated, ids]);

  const value = useMemo(
    () => ({ ids, isInWishlist, toggle, count: ids.length, refetch: fetchIds }),
    [ids, isInWishlist, toggle, fetchIds]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
