import { cn } from "@/lib/utils";

export function intentTone(score: number) {
  if (score >= 75) return { label: "High intent", bar: "bg-success", text: "text-success" };
  if (score >= 50) return { label: "Medium intent", bar: "bg-ai", text: "text-ai" };
  if (score >= 25) return { label: "Low intent", bar: "bg-warning", text: "text-warning" };
  return { label: "Cold", bar: "bg-muted-foreground/50", text: "text-muted-foreground" };
}

export function IntentScore({
  score,
  className,
  showLabel = false,
  width = "w-24",
}: {
  score: number;
  className?: string;
  showLabel?: boolean;
  width?: string;
}) {
  const tone = intentTone(score);
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn("h-1.5 overflow-hidden rounded-full bg-neutral-soft", width)}
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Buying intent score"
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", tone.bar)}
          style={{ width: `${Math.max(score, 2)}%` }}
        />
      </div>
      <span className={cn("num text-xs font-semibold", tone.text)}>{score}</span>
      {showLabel && <span className="text-xs text-muted-foreground">{tone.label}</span>}
    </div>
  );
}
