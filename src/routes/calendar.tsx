import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useMedicineStore, expiryDate, statusOf } from "@/lib/medicine-store";
import { Calendar } from "@/components/ui/calendar";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Calendar — TinyDose Vault" }] }),
  component: CalendarPage,
});

function CalendarPage() {
  const medicines = useMedicineStore((s) => s.medicines).filter((m) => !m.finished);
  const [month, setMonth] = useState<Date>(new Date());

  const byDate = useMemo(() => {
    const map = new Map<string, typeof medicines>();
    for (const m of medicines) {
      const d = expiryDate(m);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return map;
  }, [medicines]);

  const expiryDays = Array.from(byDate.keys()).map((k) => {
    const [y, m, d] = k.split("-").map(Number);
    return new Date(y, m, d);
  });

  const visible = medicines
    .filter((m) => {
      const d = expiryDate(m);
      return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
    })
    .sort((a, b) => expiryDate(a).getTime() - expiryDate(b).getTime());

  return (
    <AppShell>
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Timeline</p>
        <h1 className="font-display text-3xl md:text-4xl font-medium">Expiry calendar</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Highlighted days are when a medicine reaches its end of shelf life.
        </p>
      </header>

      <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
        <div className="soft-card p-4 pointer-events-auto">
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            modifiers={{ expiry: expiryDays }}
            modifiersClassNames={{
              expiry: "relative !text-foreground after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-accent",
            }}
            className={cn("rounded-xl")}
          />
        </div>

        <div>
          <h2 className="font-display text-lg mb-3">
            {month.toLocaleString("en", { month: "long", year: "numeric" })}
          </h2>
          {visible.length === 0 ? (
            <div className="soft-card p-8 text-center text-sm text-muted-foreground">
              No medicines expire in this month.
            </div>
          ) : (
            <ul className="space-y-2">
              {visible.map((m) => {
                const d = expiryDate(m);
                return (
                  <li key={m.id} className="soft-card p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Expires {d.toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <StatusBadge status={statusOf(m)} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
