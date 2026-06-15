import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LayoutDashboard, Plus, CalendarDays, Pill } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InstallButton } from "@/components/InstallButton";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/medicines", label: "Medicines", icon: Pill },
  { to: "/add", label: "Add", icon: Plus },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen clinic-bg">
      {/* Subtle ambient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[24rem] w-[24rem] rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-secondary/60 blur-3xl" />
      </div>

      {/* Top bar (desktop) / header (mobile) */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border/60">
        <div className="mx-auto max-w-5xl px-5 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-soft">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 7v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-5Z"/><path d="m9 12 2 2 4-4"/></svg>
            </span>
            <div className="leading-tight">
              <div className="font-display text-[17px] font-medium tracking-tight">TinyDose Vault</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">Calm medicine tracking</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map((n) => {
                const Icon = n.icon;
                const active = pathname === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={cn(
                      "relative px-3.5 py-2 rounded-full text-sm transition-colors flex items-center gap-2",
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-secondary"
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      />
                    )}
                    <Icon className="relative h-4 w-4" />
                    <span className="relative">{n.label}</span>
                  </Link>
                );
              })}
            </nav>
            <InstallButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-28 pt-6 md:pt-10">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
        <div className="glass-card rounded-full px-2 py-2 flex items-center gap-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full text-[11px]",
                  active ? "text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="mnav-pill"
                    className="absolute inset-0 rounded-full bg-primary shadow-soft"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <Icon className="relative h-[18px] w-[18px]" />
                <span className="relative">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
