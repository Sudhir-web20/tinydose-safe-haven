import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { searchMedicines, type MedicineSuggestion } from "@/lib/medicines-db";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSelect: (s: MedicineSuggestion) => void;
}

export function MedicineAutocomplete({ value, onChange, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<MedicineSuggestion[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setResults(searchMedicines(value));
  }, [value]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Start typing medicine name… (min 3 letters)"
          className="h-11 pl-10 rounded-xl bg-card"
        />
      </div>
      <AnimatePresence>
        {open && value.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 mt-2 w-full glass-card rounded-2xl overflow-hidden max-h-80 overflow-y-auto"
          >
            {results.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No matches — you can also type a custom name and continue.
              </div>
            ) : (
              <ul className="py-1">
                {results.map((r) => (
                  <li key={r.name}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(r);
                        setOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-secondary/70 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{r.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{r.generic}</div>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                        {r.type}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {value.length > 0 && value.length < 3 && (
        <p className="mt-1.5 text-[11px] text-muted-foreground pl-1">
          Type {3 - value.length} more letter{3 - value.length === 1 ? "" : "s"} to see suggestions.
        </p>
      )}
    </div>
  );
}
