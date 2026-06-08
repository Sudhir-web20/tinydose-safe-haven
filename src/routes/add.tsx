import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
        <MedicineForm
          onSubmit={(data) => {
            add(data);
            toast.success(`${data.name} added to the vault`);
            nav({ to: "/medicines" });
          }}
        />
      </div>
    </AppShell>
  );
}
