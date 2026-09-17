import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, CalendarClock, CheckCircle2, Clock, Loader2, Phone } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { followUpsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/follow-ups")({
  head: () => ({
    meta: [
      { title: "Follow-ups — VoxSales AI" },
      {
        name: "description",
        content: "Work your follow-up queue: complete, reschedule or call back high-intent leads.",
      },
    ],
  }),
  component: FollowUpsPage,
});

type Tab = "Pending" | "Completed" | "Cancelled";

const TAB_LABELS: Record<Tab, string> = {
  Pending: "Pending",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

function FollowUpsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("Pending");

  const { data: followUps = [], isLoading } = useQuery({
    queryKey: ["follow-ups", activeTab],
    queryFn: () => followUpsApi.list(activeTab),
    staleTime: 15_000,
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => followUpsApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      toast.success("Follow-up completed");
    },
    onError: () => toast.error("Failed to complete follow-up"),
  });

  // Count badges require individual queries
  const { data: pendingItems = [] } = useQuery({
    queryKey: ["follow-ups", "Pending"],
    queryFn: () => followUpsApi.list("Pending"),
    staleTime: 30_000,
  });
  const { data: completedItems = [] } = useQuery({
    queryKey: ["follow-ups", "Completed"],
    queryFn: () => followUpsApi.list("Completed"),
    staleTime: 60_000,
  });

  const counts: Record<Tab, number> = {
    Pending: pendingItems.length,
    Completed: completedItems.length,
    Cancelled: 0,
  };

  const sorted = [...followUps].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
  );

  return (
    <>
      <PageHeader
        title="Follow-ups"
        subtitle={
          counts.Pending > 0
            ? `${counts.Pending} follow-up${counts.Pending === 1 ? "" : "s"} pending`
            : "No pending follow-ups"
        }
      />

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-border bg-card p-1 w-fit shadow-card">
        {(["Pending", "Completed", "Cancelled"] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-ai text-ai-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {TAB_LABELS[tab]}
            <span
              className={cn(
                "grid size-5 place-items-center rounded-full text-[11px] font-semibold",
                activeTab === tab
                  ? "bg-ai-foreground/20 text-ai-foreground"
                  : "bg-neutral-soft text-muted-foreground",
              )}
            >
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Follow-up cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-ai" />
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={
            activeTab === "Completed"
              ? "No completed follow-ups"
              : activeTab === "Pending"
                ? "Nothing pending"
                : "No cancelled follow-ups"
          }
          description={
            activeTab === "Pending"
              ? "Great work — your queue is clear."
              : "Follow-ups will appear here."
          }
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((fu) => (
            <div
              key={fu.id}
              className={cn(
                "rounded-xl border bg-card p-4 shadow-card transition-all",
                fu.status === "Pending"
                  ? "border-ai/30 hover:shadow-raised"
                  : fu.status === "Completed"
                    ? "border-border opacity-70"
                    : "border-border hover:border-ai/20 hover:shadow-raised",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-48">
                  <div className="flex items-center gap-2 flex-wrap">
                    {fu.lead_id ? (
                      <Link
                        to="/leads/$leadId"
                        params={{ leadId: fu.lead_id }}
                        className="font-semibold text-foreground hover:text-ai text-sm"
                      >
                        {fu.reason}
                      </Link>
                    ) : (
                      <span className="font-semibold text-foreground text-sm">{fu.reason}</span>
                    )}
                    <StatusBadge status={fu.priority} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{fu.action}</p>
                </div>

                <div className="flex items-center gap-2">
                  {fu.status === "Pending" && (
                    <>
                      {fu.lead_id && (
                        <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
                          <Link to="/leads/$leadId" params={{ leadId: fu.lead_id }}>
                            <Phone className="size-3.5" /> Call
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={completeMutation.isPending}
                        onClick={() => completeMutation.mutate(fu.id)}
                      >
                        {completeMutation.isPending ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        Done
                      </Button>
                    </>
                  )}
                  {fu.status === "Completed" && (
                    <span className="flex items-center gap-1.5 text-xs text-success font-medium">
                      <CheckCircle2 className="size-3.5" /> Completed
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-lg bg-surface-muted px-3 py-2">
                <CalendarClock className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                <p className="text-xs text-foreground leading-relaxed">{fu.action}</p>
              </div>

              {fu.due_at && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3 shrink-0" />
                  <span>
                    {fu.status === "Completed" ? "Was due" : "Due"}:{" "}
                    {new Date(fu.due_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
