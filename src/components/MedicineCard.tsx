import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { CalendarClock, Pencil, Trash2, Check } from "lucide-react";
import {
  type Medicine,
  expiryDate,
  daysUntil,
  statusOf,
  useMedicineStore,
} from "@/lib/medicine-store";
import { medicineIllustration } from "@/lib/medicine-illustration";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function MedicineCard({ m, index = 0 }: { m: Medicine; index?: number }) {
  const status = statusOf(m);
  const days = daysUntil(expiryDate(m));
  const remove = useMedicineStore((s) => s.remove);
  const markFinished = useMedicineStore((s) => s.markFinished);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="group soft-card p-4 flex gap-4 hover:-translate-y-0.5 hover:shadow-card transition-all"
    >
      <div className="shrink-0 h-24 w-24 rounded-2xl overflow-hidden bg-secondary/60 ring-1 ring-border">
        <img src={medicineIllustration(m.name, m.type)} alt={m.name} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-medium truncate">{m.name}</h3>
            {m.generic && (
              <p className="text-xs text-muted-foreground truncate">{m.generic}</p>
            )}
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-0.5 rounded-full bg-secondary text-foreground/80">{m.type}</span>
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                {MONTHS[m.expiryMonth - 1]} {m.expiryYear}
              </span>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="text-[11px] text-muted-foreground">
            {status === "expired" ? (
              <span className="text-danger font-medium">Expired {Math.abs(days)}d ago</span>
            ) : status === "finished" ? (
              <span>Marked as finished</span>
            ) : (
              <span>
                <span className="font-medium text-foreground">{days}</span> days left
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
            {!m.finished && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full"
                onClick={() => {
                  markFinished(m.id);
                  toast.success("Marked as finished");
                }}
                title="Mark as finished"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button asChild size="icon" variant="ghost" className="h-8 w-8 rounded-full">
              <Link to="/edit/$id" params={{ id: m.id }}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-danger hover:text-danger">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this medicine?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove {m.name} from your vault. This can't be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      remove(m.id);
                      toast.success("Removed");
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
