import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
  icon?: LucideIcon;
  hint?: string;
  className?: string;
}

export function StatCard({ label, value, delta, trend = "up", icon: Icon, hint, className }: StatCardProps) {
  const positive = trend === "up";
  return (
    <div
      className={cn(
        "group rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        {Icon && (
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary/70 transition-colors group-hover:bg-primary/20 group-hover:text-primary">
            <Icon className="size-4" aria-hidden />
          </span>
        )}
      </div>
      <p className="num mt-3 font-display text-2xl font-bold text-foreground">{value}</p>
      <div className="mt-1.5 flex items-center gap-2">
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              trend === "flat" ? "text-muted-foreground" : positive ? "text-success" : "text-danger",
            )}
          >
            {trend !== "flat" &&
              (positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />)}
            {delta}
          </span>
        )}
        <span className="text-xs text-muted-foreground">{hint ?? "vs last week"}</span>
      </div>
    </div>
  );
}
