import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useMedicineStore, statusOf, expiryDate, daysUntil } from "@/lib/medicine-store";
import { motion } from "framer-motion";
import { Plus, ShieldCheck, Clock, AlertTriangle, Skull, Sparkles } from "lucide-react";
import { MedicineCard } from "@/components/MedicineCard";
import { SafetyNote } from "@/components/SafetyNote";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — TinyDose Vault" },
      { name: "description", content: "Overview of all your baby's medicines, what's safe and what's expiring." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const medicines = useMedicineStore((s) => s.medicines).filter((m) => !m.finished);

  const total = medicines.length;
  const safe = medicines.filter((m) => statusOf(m) === "safe").length;
  const soon = medicines.filter((m) => statusOf(m) === "soon" || statusOf(m) === "critical").length;
  const expired = medicines.filter((m) => statusOf(m) === "expired").length;

  const sorted = [...medicines].sort(
    (a, b) => expiryDate(a).getTime() - expiryDate(b).getTime(),
  );
  const upcoming = sorted.filter((m) => daysUntil(expiryDate(m)) >= 0).slice(0, 4);
  const expiredList = sorted.filter((m) => daysUntil(expiryDate(m)) < 0).slice(0, 3);

  const stats = [
    { label: "Total", value: total, icon: Sparkles, tint: "text-foreground", bg: "bg-secondary" },
    { label: "Safe", value: safe, icon: ShieldCheck, tint: "text-primary", bg: "bg-primary/10" },
    { label: "Expiring", value: soon, icon: Clock, tint: "text-warning", bg: "bg-warning/15" },
    { label: "Expired", value: expired, icon: Skull, tint: "text-danger", bg: "bg-danger/12" },
  ];

  return (
    <AppShell>
      {/* Hero */}
      <section className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
              Your baby's vault
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-medium leading-tight">
              A quiet, careful watch <br className="hidden md:block" />over every little bottle.
            </h1>
          </div>
          <Button asChild className="rounded-full h-11 px-5 shadow-soft">
            <Link to="/add"><Plus className="h-4 w-4" /> Add medicine</Link>
          </Button>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="soft-card p-4"
            >
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.bg} ${s.tint}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="mt-3 font-display text-3xl">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </motion.div>
          );
        })}
      </section>

      <SafetyNote />

      {/* Reminders / Upcoming */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl">Coming up</h2>
          <Link to="/medicines" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            View all →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {upcoming.map((m, i) => (
              <MedicineCard key={m.id} m={m} index={i} />
            ))}
          </div>
        )}
      </section>

      {expiredList.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <h2 className="font-display text-xl">Past expiry — safely discard</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {expiredList.map((m, i) => (
              <MedicineCard key={m.id} m={m} index={i} />
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

function EmptyState() {
  return (
    <div className="soft-card p-10 text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="font-display text-lg mt-4">Your vault is empty</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        Add your first medicine to begin tracking expiry dates and reminders.
      </p>
      <Button asChild className="rounded-full mt-5">
        <Link to="/add"><Plus className="h-4 w-4" /> Add medicine</Link>
      </Button>
    </div>
  );
}
