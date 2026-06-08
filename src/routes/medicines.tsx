import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useMedicineStore, statusOf, expiryDate } from "@/lib/medicine-store";
import { MedicineCard } from "@/components/MedicineCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/medicines")({
  head: () => ({ meta: [{ title: "All medicines — TinyDose Vault" }] }),
  component: MedicinesPage,
});

function MedicinesPage() {
  const all = useMedicineStore((s) => s.medicines);
  const [q, setQ] = useState("");

  const filtered = all.filter(
    (m) => m.name.toLowerCase().includes(q.toLowerCase()) ||
           (m.generic ?? "").toLowerCase().includes(q.toLowerCase()),
  );
  const sorted = [...filtered].sort(
    (a, b) => expiryDate(a).getTime() - expiryDate(b).getTime(),
  );

  const buckets = {
    all: sorted.filter((m) => !m.finished),
    soon: sorted.filter((m) => ["soon", "critical"].includes(statusOf(m))),
    expired: sorted.filter((m) => statusOf(m) === "expired"),
    finished: sorted.filter((m) => m.finished),
  };

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Inventory</p>
          <h1 className="font-display text-3xl md:text-4xl font-medium">All medicines</h1>
        </div>
        <Button asChild className="rounded-full"><Link to="/add"><Plus className="h-4 w-4" /> Add</Link></Button>
      </div>

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or generic…"
        className="h-11 rounded-xl bg-card mb-5"
      />

      <Tabs defaultValue="all">
        <TabsList className="bg-secondary/60 rounded-full p-1 h-auto">
          <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-soft px-4">All ({buckets.all.length})</TabsTrigger>
          <TabsTrigger value="soon" className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-soft px-4">Expiring ({buckets.soon.length})</TabsTrigger>
          <TabsTrigger value="expired" className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-soft px-4">Expired ({buckets.expired.length})</TabsTrigger>
          <TabsTrigger value="finished" className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-soft px-4">Finished ({buckets.finished.length})</TabsTrigger>
        </TabsList>
        {(["all", "soon", "expired", "finished"] as const).map((k) => (
          <TabsContent value={k} key={k} className="mt-5">
            {buckets[k].length === 0 ? (
              <div className="soft-card p-10 text-center text-sm text-muted-foreground">Nothing here yet.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {buckets[k].map((m, i) => <MedicineCard key={m.id} m={m} index={i} />)}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </AppShell>
  );
}
