import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useMedicineStore, useMedicineStoreHydrated } from "@/lib/medicine-store";
import { fetchSheetMedicines } from "@/lib/sheet-sync.functions";
import { cn } from "@/lib/utils";

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
          <p className="text-sm text-muted-foreground">Local storage vs Google Sheets</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/80 disabled:opacity-60"
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Local (browser)" value={hydrated ? local.length : "…"} />
        <StatCard
          label="Google Sheet"
          value={isLoading ? "…" : error ? "!" : (data?.count ?? 0)}
        />
        <StatCard
          label="Status"
          value={
            error ? "Error" : !hydrated || isLoading ? "Checking" : inSync ? "In sync" : "Mismatch"
          }
          tone={error ? "critical" : inSync ? "ok" : "warn"}
        />
      </div>

      {data?.spreadsheetUrl && (
        <a
          href={data.spreadsheetUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          Open Google Sheet <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" />
            Failed to read sheet
          </div>
          <p className="mt-1 text-muted-foreground">{(error as Error).message}</p>
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <DiffList
          title="In local, missing from sheet"
          description="Click Sync in the header to push these."
          items={missingInSheet.map((m) => ({ id: m.id, name: m.name }))}
        />
        <DiffList
          title="In sheet, missing from local"
          description="These rows exist in the sheet but not in this browser."
          items={missingInLocal.map((i) => ({ id: i.id, name: i.name }))}
        />
      </div>

      {inSync && (
        <div className="mt-8 flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          All {local.length} medicines match between local storage and Google Sheets.
        </div>
      )}

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

function DiffList({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: { id: string; name: string }[];
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{title}</h2>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{items.length}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">None.</p>
      ) : (
        <ul className="mt-3 space-y-1.5 text-sm">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 px-3 py-2">
              <span className="truncate">{it.name || "(unnamed)"}</span>
              <span className="truncate font-mono text-[10px] text-muted-foreground">
                {it.id.slice(0, 8)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
