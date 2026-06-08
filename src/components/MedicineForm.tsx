import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MedicineAutocomplete } from "./MedicineAutocomplete";
import { MonthYearPicker } from "./MonthYearPicker";
import { medicineIllustration } from "@/lib/medicine-illustration";
import { streamImage } from "@/lib/streamImage";
import type { MedicineSuggestion, MedicineType } from "@/lib/medicines-db";
import type { Medicine } from "@/lib/medicine-store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SafetyNote } from "./SafetyNote";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Sparkles, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TYPES: MedicineType[] = ["Syrup", "Drops", "Tablet", "Cream", "Ointment", "Inhaler", "Other"];

export type MedicineFormData = Omit<Medicine, "id" | "createdAt" | "finished">;

interface Props {
  initial?: Medicine;
  submitLabel?: string;
  onSubmit: (data: MedicineFormData) => void;
}

export function MedicineForm({ initial, submitLabel = "Add to vault", onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [generic, setGeneric] = useState(initial?.generic ?? "");
  const [type, setType] = useState<MedicineType>(initial?.type ?? "Syrup");
  const [month, setMonth] = useState<number | null>(initial?.expiryMonth ?? null);
  const [year, setYear] = useState<number | null>(initial?.expiryYear ?? null);
  const [openedDate, setOpenedDate] = useState<Date | undefined>(
    initial?.openedDate ? new Date(initial.openedDate) : undefined,
  );
  const [doctor, setDoctor] = useState(initial?.doctor ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [reminders, setReminders] = useState(
    initial?.reminders ?? { d60: true, d30: true, d7: true, d0: true },
  );
  const [error, setError] = useState<string | null>(null);
  const [aiImage, setAiImage] = useState<string | null>(initial?.imageUrl ?? null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFinal, setAiFinal] = useState(!!initial?.imageUrl);

  const svgIllustration = useMemo(
    () => (name.trim() ? medicineIllustration(name, type) : null),
    [name, type],
  );
  const illustration = aiImage ?? svgIllustration;

  const generateAi = async () => {
    if (!name.trim()) {
      toast.error("Enter a medicine name first");
      return;
    }
    setAiLoading(true);
    setAiFinal(false);
    setAiImage(null);
    try {
      const prompt = `A premium, soft, minimal product photograph of a baby medicine ${type.toLowerCase()} named "${name.trim()}", on a warm cream background (#FAF7F2), soft natural lighting, calm European pharmacy aesthetic, no text, square composition.`;
      await streamImage("/api/generate-image", prompt, (url, isFinal) => {
        setAiImage(url);
        if (isFinal) setAiFinal(true);
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate image");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => setError(null), [name, month, year]);

  const handleSelect = (s: MedicineSuggestion) => {
    setName(s.name);
    setGeneric(s.generic);
    setType(s.type);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Please enter a medicine name.");
    if (!month || !year) return setError("Please pick an expiry month and year.");
    onSubmit({
      name: name.trim(),
      generic: generic.trim() || undefined,
      type,
      expiryMonth: month,
      expiryYear: year,
      openedDate: openedDate ? openedDate.toISOString() : undefined,
      doctor: doctor.trim() || undefined,
      notes: notes.trim() || undefined,
      reminders,
      imageUrl: aiImage && aiFinal ? aiImage : undefined,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <SafetyNote />

      <div className="soft-card p-5 md:p-6 space-y-5">
        <Field label="Medicine name" htmlFor="med-name">
          <MedicineAutocomplete value={name} onChange={setName} onSelect={handleSelect} />
        </Field>

        {illustration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-border bg-secondary/40 p-4 flex items-center gap-4"
          >
            <div className="h-24 w-24 rounded-xl overflow-hidden bg-card ring-1 ring-border shrink-0">
              <img
                src={illustration}
                alt={name}
                className={cn(
                  "h-full w-full object-cover transition-[filter] duration-500",
                  aiImage && !aiFinal && "blur-md",
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-base truncate">{name}</div>
              {generic && <div className="text-xs text-muted-foreground truncate">{generic}</div>}
              <div className="text-[11px] text-muted-foreground mt-1">
                {aiImage ? (aiFinal ? "AI-generated preview." : "Generating…") : "Illustrative image only."}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateAi}
                disabled={aiLoading}
                className="mt-2 rounded-full h-8 px-3 text-xs"
              >
                {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {aiImage ? "Regenerate" : "Generate AI preview"}
              </Button>
            </div>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Generic name (optional)">
            <Input
              value={generic}
              onChange={(e) => setGeneric(e.target.value)}
              placeholder="e.g. Paracetamol"
              className="h-11 rounded-xl bg-card"
            />
          </Field>
          <Field label="Type">
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MedicineType)}
                className="flex h-11 w-full appearance-none items-center rounded-xl border border-input bg-card px-3 pr-10 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                ▾
              </span>
            </div>
          </Field>
        </div>
      </div>

      <div className="soft-card p-5 md:p-6 space-y-5">
        <h3 className="font-display text-base">Expiry & opening</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Expires (month & year)">
            <MonthYearPicker
              month={month}
              year={year}
              onChange={(m, y) => { setMonth(m); setYear(y); }}
            />
          </Field>
          <Field label="Opened on (optional)">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11 rounded-xl bg-card",
                    !openedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {openedDate ? format(openedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                <Calendar
                  mode="single"
                  selected={openedDate}
                  onSelect={setOpenedDate}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </Field>
        </div>
      </div>

      <div className="soft-card p-5 md:p-6 space-y-5">
        <h3 className="font-display text-base">Care details</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Doctor (optional)">
            <Input
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              placeholder="Dr. Mehta"
              className="h-11 rounded-xl bg-card"
            />
          </Field>
        </div>
        <Field label="Notes (optional)">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Dosage, instructions, where it's stored…"
            className="min-h-24 rounded-xl bg-card"
          />
        </Field>
      </div>

      <div className="soft-card p-5 md:p-6 space-y-3">
        <h3 className="font-display text-base">Reminders</h3>
        <p className="text-xs text-muted-foreground -mt-2">In-app gentle reminders, no notifications.</p>
        {[
          { key: "d60", label: "60 days before expiry" },
          { key: "d30", label: "30 days before expiry" },
          { key: "d7", label: "7 days before expiry" },
          { key: "d0", label: "On the day of expiry" },
        ].map((r) => (
          <div key={r.key} className="flex items-center justify-between py-1">
            <Label className="text-sm font-normal">{r.label}</Label>
            <Switch
              checked={reminders[r.key as keyof typeof reminders]}
              onCheckedChange={(v) => setReminders({ ...reminders, [r.key]: v })}
            />
          </div>
        ))}
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/25 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 sticky bottom-20 md:bottom-0 md:static md:pb-0">
        <Button type="submit" className="rounded-full h-11 px-6 shadow-soft">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}
