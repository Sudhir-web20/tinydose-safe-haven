import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { MedicineForm } from "@/components/MedicineForm";
import { useMedicineStore } from "@/lib/medicine-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/edit/$id")({
  head: () => ({ meta: [{ title: "Edit medicine — TinyDose Vault" }] }),
  component: EditPage,
});

function EditPage() {
  const { id } = Route.useParams();
  const med = useMedicineStore((s) => s.medicines.find((m) => m.id === id));
  const update = useMedicineStore((s) => s.update);
  const nav = useNavigate();

  if (!med) {
    return (
      <AppShell>
        <div className="soft-card p-8 text-center max-w-md mx-auto">
          <h2 className="font-display text-xl">Medicine not found</h2>
          <p className="text-sm text-muted-foreground mt-2">It may have been deleted.</p>
          <Button asChild className="rounded-full mt-4"><Link to="/medicines">Back to medicines</Link></Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Edit</p>
          <h1 className="font-display text-3xl md:text-4xl font-medium">{med.name}</h1>
        </header>
        <MedicineForm
          initial={med}
          submitLabel="Save changes"
          onSubmit={(data) => {
            update(med.id, data);
            toast.success("Saved");
            nav({ to: "/medicines" });
          }}
        />
      </div>
    </AppShell>
  );
}
