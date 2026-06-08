import { ClientOnly, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { MedicineForm } from "@/components/MedicineForm";
import { useMedicineStore } from "@/lib/medicine-store";
import { toast } from "sonner";

export const Route = createFileRoute("/add")({
  head: () => ({
    meta: [
      { title: "Add Medicine — TinyDose Vault" },
      { name: "description", content: "Add a baby medicine with autocomplete and expiry tracking." },
    ],
  }),
  component: AddPage,
});

function AddPage() {
  const add = useMedicineStore((s) => s.add);
  const nav = useNavigate();

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">New entry</p>
          <h1 className="font-display text-3xl md:text-4xl font-medium">Add a medicine</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Just the essentials. You can always edit details later.
          </p>
        </header>
        <ClientOnly fallback={<MedicineFormFallback />}>
          <MedicineForm
            onSubmit={(data) => {
              add(data);
              toast.success(`${data.name} added to the vault`);
              nav({ to: "/medicines" });
            }}
          />
        </ClientOnly>
      </div>
    </AppShell>
  );
}

function MedicineFormFallback() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-accent/15 px-4 py-3">
        <div className="mt-0.5 h-4 w-4 rounded-full bg-accent/40" />
        <div className="h-10 flex-1 rounded-xl bg-card/70" />
      </div>
      <div className="soft-card p-5 md:p-6 space-y-5">
        <div className="h-4 w-28 rounded bg-secondary/70" />
        <div className="h-11 rounded-xl bg-card" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-11 rounded-xl bg-card" />
          <div className="h-11 rounded-xl bg-card" />
        </div>
      </div>
      <div className="soft-card p-5 md:p-6 space-y-5">
        <div className="h-6 w-40 rounded bg-secondary/70" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-11 rounded-xl bg-card" />
          <div className="h-11 rounded-xl bg-card" />
        </div>
      </div>
      <div className="soft-card p-5 md:p-6">
        <div className="h-11 w-36 rounded-full bg-primary/20" />
      </div>
    </div>
  );
}
