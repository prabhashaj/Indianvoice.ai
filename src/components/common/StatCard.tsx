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
        "group rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:border-ai/30 hover:shadow-raised",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        {Icon && (
          <span className="grid size-8 place-items-center rounded-lg bg-surface-muted text-muted-foreground transition-colors group-hover:bg-ai-soft group-hover:text-ai">
            <Icon className="size-4" aria-hidden />
          </span>
        )}
      </div>
      <p className="num mt-3 text-2xl font-semibold text-foreground">{value}</p>
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
