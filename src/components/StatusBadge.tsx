import { cn } from "@/lib/utils";
import type { MedicineStatus } from "@/lib/medicine-store";

const MAP: Record<MedicineStatus, { label: string; cls: string; dot: string }> = {
  safe: { label: "Safe", cls: "bg-primary/12 text-primary border-primary/25", dot: "bg-primary" },
  soon: { label: "Expiring Soon", cls: "bg-warning/15 text-warning border-warning/30", dot: "bg-warning" },
  critical: { label: "Critical", cls: "bg-accent/30 text-accent-foreground border-accent/50", dot: "bg-accent" },
  expired: { label: "Expired", cls: "bg-danger/12 text-danger border-danger/30", dot: "bg-danger" },
  finished: { label: "Finished", cls: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
};

export function StatusBadge({ status }: { status: MedicineStatus }) {
  const s = MAP[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium", s.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
