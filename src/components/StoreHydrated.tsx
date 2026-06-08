import { useEffect, useState, type ReactNode } from "react";
import { useMedicineStore } from "@/lib/medicine-store";

/**
 * Renders children only after the persisted Zustand store has been
 * rehydrated from localStorage on the client. Prevents SSR/CSR mismatch.
 */
export function StoreHydrated({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void useMedicineStore.persist.rehydrate()?.then(() => {
      if (!cancelled) setReady(true);
    });
    // If rehydrate returns undefined synchronously, still flip ready.
    setReady((r) => r || useMedicineStore.persist.hasHydrated());
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return <>{fallback}</>;
  return <>{children}</>;
}
