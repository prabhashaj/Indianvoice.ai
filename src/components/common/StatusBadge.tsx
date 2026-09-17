import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "ai" | "neutral" | "info";

const toneClass: Record<Tone, string> = {
  success: "bg-success-soft text-success border-success/25",
  warning: "bg-warning-soft text-warning border-warning/30",
  danger: "bg-danger-soft text-danger border-danger/25",
  ai: "bg-ai-soft text-ai border-ai/25",
  info: "bg-accent text-accent-foreground border-border",
  neutral: "bg-neutral-soft text-muted-foreground border-border",
};

const statusTone: Record<string, Tone> = {
  Running: "success",
  Active: "success",
  Completed: "info",
  Qualified: "success",
  Interested: "ai",
  Meeting: "ai",
  Positive: "success",
  Paused: "warning",
  Scheduled: "warning",
  Pending: "warning",
  Neutral: "neutral",
  Draft: "neutral",
  New: "neutral",
  Contacted: "info",
  "In Progress": "ai",
  Failed: "danger",
  Negative: "danger",
  "Not Interested": "neutral",
  "Do Not Contact": "danger",
  High: "danger",
  Medium: "warning",
  Low: "neutral",
};

export function StatusBadge({
  status,
  tone,
  dot = true,
  className,
}: {
  status: string;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  const resolved = tone ?? statusTone[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClass[resolved],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {status}
    </span>
  );
}
