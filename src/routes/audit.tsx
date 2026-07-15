import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  readMedicineSafetySnapshot,
  refreshMedicineStoreFromStorage,
  restoreMedicineBackupSnapshot,
  useMedicineStore,
  useMedicineStoreHydrated,
} from "@/lib/medicine-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Data Audit — TinyDose Vault" },
      { name: "description", content: "Compare local medicines with the synced Google Sheet." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const hydrated = useMedicineStoreHydrated();
  const local = useMedicineStore((s) => s.medicines);
  const fetchSheet = useServerFn(fetchSheetMedicines);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["sheet-audit"],
    queryFn: () => fetchSheet(),
    staleTime: 30_000,
  });

  const sheetItems = data?.items ?? [];
  const sheetIds = new Set(sheetItems.map((i) => i.id));
  const localIds = new Set(local.map((m) => m.id));
  const missingInSheet = local.filter((m) => !sheetIds.has(m.id));
  const missingInLocal = sheetItems.filter((i) => !localIds.has(i.id));
  const inSync = hydrated && !!data && missingInSheet.length === 0 && missingInLocal.length === 0;

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Data Audit</h1>
          <p className="text-sm text-muted-foreground">Browser vault and local backup snapshots</p>
        </div>
        <button
          onClick={() => {
            refreshMedicineStoreFromStorage();
            toast.success("Checked local backup snapshots");
          }}
          className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/80 disabled:opacity-60"
        >
          <RefreshCw className="h-4 w-4" />
          Check backup
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Local (browser)" value={hydrated ? local.length : "…"} />
        <StatCard label="Backup snapshot" value={hydrated ? safetySnapshot.length : "…"} />
        <StatCard
          label="Status"
          value={!hydrated ? "Checking" : needsRecovery ? "Recoverable" : "Protected"}
          tone={needsRecovery ? "warn" : "ok"}
        />
      </div>

      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <span>
            {needsRecovery
              ? `A backup has ${safetySnapshot.length} medicines and can replace the current ${local.length}.`
              : `${local.length} medicines are protected in this browser.`}
          </span>
        </div>
        {needsRecovery && (
          <button
            onClick={() => {
              if (restoreMedicineBackupSnapshot()) toast.success(`Recovered ${safetySnapshot.length} medicines`);
            }}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Recover backup
          </button>
        )}
      </div>

      <div className="mt-8 text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">← Back to dashboard</Link>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "ok" | "warn" | "critical";
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 font-display text-3xl font-semibold",
          tone === "ok" && "text-primary",
          tone === "warn" && "text-amber-600 dark:text-amber-400",
          tone === "critical" && "text-destructive",
        )}
      >
        {value}
      </div>
    </div>
  );
}
