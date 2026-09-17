import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, Loader2, Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { campaignsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/campaigns/")({
  head: () => ({
    meta: [
      { title: "Campaigns — VoxSales AI" },
      {
        name: "description",
        content:
          "Create and manage AI voice sales campaigns: configure objectives, assign agents, schedule calling windows and track live funnel performance.",
      },
      { property: "og:title", content: "Campaigns — VoxSales AI" },
    ],
  }),
  component: CampaignsPage,
});

const funnelStages = [
  { key: "completed" as const, label: "Dialled", color: "bg-muted-foreground" },
  { key: "connected" as const, label: "Connected", color: "bg-ai" },
  { key: "interested" as const, label: "Interested", color: "bg-success" },
  { key: "qualified" as const, label: "Qualified", color: "bg-chart-2" },
  { key: "meetings" as const, label: "Meetings", color: "bg-warning" },
] as const;

type CampaignStatus = "Draft" | "Scheduled" | "Running" | "Paused" | "Completed" | "Failed";

const nextAction: Record<CampaignStatus, { label: string; variant: "default" | "outline" | "ghost" | "destructive" }> = {
  Running: { label: "Pause", variant: "outline" },
  Paused: { label: "Resume", variant: "default" },
  Scheduled: { label: "Launch now", variant: "default" },
  Draft: { label: "Launch", variant: "default" },
  Completed: { label: "Duplicate", variant: "ghost" },
  Failed: { label: "Retry", variant: "outline" },
};

function CampaignsPage() {
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => campaignsApi.list(),
    staleTime: 30_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      campaignsApi.setStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: () => toast.error("Failed to update campaign status"),
  });

  const launchMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.launch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign launched!");
    },
    onError: (err: any) => toast.error("Failed to launch campaign", { description: err?.message }),
  });

  return (
    <>
      <PageHeader
        title="Campaigns"
        subtitle="Each campaign is an autonomous AI calling program targeting a specific audience"
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/analytics">
                <Activity className="size-4" /> Performance
              </Link>
            </Button>
            <Button asChild>
              <Link to="/campaigns/new">
                <Plus className="size-4" /> New campaign
              </Link>
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-ai" />
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const pct = (n: number) =>
              campaign.total_leads > 0 ? Math.round((n / campaign.total_leads) * 100) : 0;
            const action = nextAction[campaign.status as CampaignStatus] ?? { label: "View", variant: "ghost" as const };

            const values = {
              completed: campaign.completed,
              connected: campaign.connected,
              interested: campaign.interested,
              qualified: campaign.qualified,
              meetings: campaign.meetings,
            };

            return (
              <article
                key={campaign.id}
                className="rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:border-ai/30 hover:shadow-raised"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-56">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Link
                        to="/campaigns/$campaignId"
                        params={{ campaignId: campaign.id }}
                        className="font-display text-base font-semibold text-foreground hover:text-ai"
                      >
                        {campaign.name}
                      </Link>
                      <StatusBadge status={campaign.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {campaign.audience}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {campaign.schedule?.days?.join(", ")}{" "}
                      {campaign.schedule?.start}–{campaign.schedule?.end}{" "}
                      <span className="text-muted-foreground/70">
                        ({campaign.schedule?.timezone ?? "UTC"})
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/campaigns/$campaignId" params={{ campaignId: campaign.id }}>
                        Details
                      </Link>
                    </Button>
                    {campaign.status !== "Completed" && (
                      <Button
                        variant={action.variant}
                        size="sm"
                        disabled={statusMutation.isPending || launchMutation.isPending}
                        onClick={() => {
                          if (campaign.status === "Draft" || campaign.status === "Scheduled") {
                            launchMutation.mutate(campaign.id);
                          } else {
                            const map: Partial<Record<CampaignStatus, CampaignStatus>> = {
                              Running: "Paused",
                              Paused: "Running",
                            };
                            const next = map[campaign.status as CampaignStatus];
                            if (next) statusMutation.mutate({ id: campaign.id, status: next });
                          }
                        }}
                      >
                        {(statusMutation.isPending || launchMutation.isPending) ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : action.label}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Funnel progress bars */}
                <div className="mt-5 grid gap-2 sm:grid-cols-5">
                  {funnelStages.map((stage) => {
                    const value = values[stage.key] ?? 0;
                    const percent = pct(value);
                    return (
                      <div key={stage.key}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{stage.label}</span>
                          <span className="num font-medium text-foreground">
                            {value.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-soft">
                          <div
                            className={cn("h-full rounded-full transition-all", stage.color)}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <p className="num mt-0.5 text-[10px] text-muted-foreground">{percent}%</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
                  <span>
                    <span className="num font-medium text-foreground">{campaign.total_leads.toLocaleString()}</span> total leads
                  </span>
                  <span>
                    <span className="num font-medium text-foreground">{campaign.total_calls.toLocaleString()}</span> calls made
                  </span>
                  <span>
                    <span className="num font-medium text-foreground">{campaign.meetings}</span> meetings
                  </span>
                </div>
              </article>
            );
          })}

          {campaigns.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-20 text-center">
              <span className="grid size-12 place-items-center rounded-xl bg-ai-soft text-ai mx-auto mb-4">
                <Sparkles className="size-6" />
              </span>
              <p className="font-display text-base font-semibold text-foreground">No campaigns yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first campaign to start calling leads.</p>
              <Button className="mt-4" asChild>
                <Link to="/campaigns/new">
                  <Plus className="size-4" /> New campaign
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
