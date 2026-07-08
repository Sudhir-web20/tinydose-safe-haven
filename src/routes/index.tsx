import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useMedicineStore, statusOf, expiryDate, daysUntil } from "@/lib/medicine-store";
import { motion } from "framer-motion";
import { Plus, ShieldCheck, Clock, AlertTriangle, Skull, Sparkles } from "lucide-react";
import { MedicineCard } from "@/components/MedicineCard";
import { SafetyNote } from "@/components/SafetyNote";
import { Button } from "@/components/ui/button";
import { HeroIllustration } from "@/components/HeroIllustration";

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
  const allMedicines = useMedicineStore((s) => s.medicines);
  const activeMedicines = allMedicines.filter((m) => !m.finished);

  const total = allMedicines.length;
  const safe = activeMedicines.filter((m) => statusOf(m) === "safe").length;
  const soon = activeMedicines.filter((m) => statusOf(m) === "soon" || statusOf(m) === "critical").length;
  const expired = activeMedicines.filter((m) => statusOf(m) === "expired").length;

  const sorted = [...allMedicines].sort(
    (a, b) => expiryDate(a).getTime() - expiryDate(b).getTime(),
  );

  const stats = [
    { label: "Total", value: total, icon: Sparkles, tint: "text-foreground", bg: "bg-secondary" },
    { label: "Safe", value: safe, icon: ShieldCheck, tint: "text-primary", bg: "bg-primary/10" },
    { label: "Expiring", value: soon, icon: Clock, tint: "text-warning", bg: "bg-warning/15" },
    { label: "Expired", value: expired, icon: Skull, tint: "text-danger", bg: "bg-danger/12" },
  ];

  return (
    <AppShell>
      {/* Hero */}
      <section className="mb-8 relative">
        {/* Decorative illustration behind text on mobile */}
        <HeroIllustration className="md:hidden pointer-events-none select-none absolute inset-0 mx-auto h-full w-full max-w-sm opacity-40" />
        <div className="md:hidden pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
              Your baby's vault
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-medium leading-tight">
              A quiet, careful watch <br className="hidden md:block" />over every little bottle.
            </h1>
            <Button asChild className="rounded-full h-11 px-5 shadow-soft mt-5 md:mt-6">
              <Link to="/add"><Plus className="h-4 w-4" /> Add medicine</Link>
            </Button>
          </div>
          <div className="hidden md:block md:shrink-0" aria-hidden="true">
            <HeroIllustration className="h-56 w-72" />
          </div>
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

      {/* Full medicine list */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl">All saved medicines</h2>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
            {sorted.length} total
          </span>
        </div>
        {sorted.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {sorted.map((m, i) => (
              <MedicineCard key={m.id} m={m} index={i} />
            ))}
          </div>
        )}
      </section>
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
