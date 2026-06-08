import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Props {
  month: number | null;
  year: number | null;
  onChange: (month: number, year: number) => void;
}

export function MonthYearPicker({ month, year, onChange }: Props) {
  const currentYear = new Date().getFullYear();
  const [viewYear, setViewYear] = useState(year ?? currentYear);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-11 rounded-xl bg-card",
            !month && "text-muted-foreground",
          )}
        >
          <CalendarClock className="mr-2 h-4 w-4" />
          {month && year ? `${MONTHS[month - 1]} ${year}` : "Pick expiry month"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-4 rounded-2xl" align="start">
        <div className="flex items-center justify-between mb-3">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full"
            onClick={() => setViewYear((y) => y - 1)}
          >
            ‹
          </Button>
          <div className="font-display text-lg">{viewYear}</div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full"
            onClick={() => setViewYear((y) => y + 1)}
          >
            ›
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((m, i) => {
            const selected = month === i + 1 && year === viewYear;
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  onChange(i + 1, viewYear);
                  setOpen(false);
                }}
                className={cn(
                  "rounded-xl py-2.5 text-sm transition-all",
                  selected
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "hover:bg-secondary text-foreground",
                )}
              >
                {m.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
