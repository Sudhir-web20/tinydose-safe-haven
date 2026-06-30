import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";
import { useMedicineStore, useMedicineStoreHydrated } from "@/lib/medicine-store";
import { syncMedicinesToSheet } from "@/lib/sheet-sync.functions";
import { cn } from "@/lib/utils";

export function SyncSheetButton() {
  const hydrated = useMedicineStoreHydrated();
  const medicines = useMedicineStore((s) => s.medicines);
  const sync = useServerFn(syncMedicinesToSheet);
  const [status, setStatus] = useState<"idle" | "syncing" | "ok">("idle");
  const lastSyncedRef = useRef<string>("");

  const snapshot = JSON.stringify(
    medicines.map((m) => ({
      id: m.id,
      n: m.name,
      g: m.generic,
      t: m.type,
      em: m.expiryMonth,
      ey: m.expiryYear,
      o: m.openedDate,
      d: m.doctor,
      nt: m.notes,
      i: m.imageUrl,
      f: m.finished,
    })),
  );

  async function run(showToast: boolean) {
    if (status === "syncing") return;
    setStatus("syncing");
    try {
      const res = await sync({
        data: {
          medicines: medicines.map((m) => ({
            id: m.id,
            name: m.name,
            generic: m.generic,
            type: m.type,
            expiryMonth: m.expiryMonth,
            expiryYear: m.expiryYear,
            openedDate: m.openedDate,
            doctor: m.doctor,
            notes: m.notes,
            imageUrl: m.imageUrl,
            finished: m.finished,
            createdAt: m.createdAt,
          })),
        },
      });
      lastSyncedRef.current = snapshot;
      setStatus("ok");
      if (showToast) {
        toast.success(`Synced ${res.synced} medicines to Google Sheets`, {
          action: {
            label: "Open",
            onClick: () => window.open(res.spreadsheetUrl, "_blank"),
          },
        });
      }
      setTimeout(() => setStatus("idle"), 1500);
    } catch (err) {
      console.error(err);
      setStatus("idle");
      toast.error("Sync failed", { description: (err as Error).message });
    }
  }

  // Auto-sync on hydration and on changes (debounced)
  useEffect(() => {
    if (!hydrated) return;
    if (snapshot === lastSyncedRef.current) return;
    const t = setTimeout(() => {
      void run(false);
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, hydrated]);

  return (
    <button
      onClick={() => run(true)}
      disabled={status === "syncing"}
      title="Sync to Google Sheets"
      className={cn(
        "inline-flex items-center justify-center rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
        status === "syncing" && "opacity-60",
      )}
      aria-label="Sync to Google Sheets"
    >
      {status === "ok" ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <RefreshCw className={cn("h-4 w-4", status === "syncing" && "animate-spin")} />
      )}
    </button>
  );
}
