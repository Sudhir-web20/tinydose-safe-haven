import { ShieldAlert } from "lucide-react";

export function SafetyNote() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-accent/15 px-4 py-3">
      <ShieldAlert className="h-4 w-4 mt-0.5 text-accent-foreground/80 shrink-0" />
      <p className="text-[12.5px] leading-relaxed text-foreground/80">
        This app tracks expiry dates only. Always consult your pediatrician before giving medicine to your baby.
      </p>
    </div>
  );
}
