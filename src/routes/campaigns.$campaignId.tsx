import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarCheck,
  Loader2,
  Phone,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { IntentScore } from "@/components/common/IntentScore";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { campaignsApi, leadsApi, callsApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/campaigns/$campaignId")({
  head: () => ({
    meta: [
      { title: "Campaign detail — VoxSales AI" },
      {
        name: "description",
        content: "Campaign performance, lead funnel, calling schedule and assigned agent.",
      },
    ],
  }),
  component: CampaignDetail,
});

function CampaignDetail() {
  const { campaignId } = useParams({ from: "/campaigns/$campaignId" });
  const queryClient = useQueryClient();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaigns", campaignId],
    queryFn: () => campaignsApi.get(campaignId),
  });

  const { data: campaignLeads = [] } = useQuery({
    queryKey: ["leads", { campaign_id: campaignId }],
    queryFn: () => leadsApi.list({ campaign_id: campaignId, limit: 100 }),
    enabled: !!campaignId,
  });

  const { data: campaignCalls = [] } = useQuery({
    queryKey: ["calls", { campaign_id: campaignId }],
    queryFn: () => callsApi.list({ campaign_id: campaignId, limit: 10 }),
    enabled: !!campaignId,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => campaignsApi.setStatus(campaignId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: () => toast.error("Failed to update campaign status"),
  });

  const launchMutation = useMutation({
    mutationFn: () => campaignsApi.launch(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign launched!");
    },
    onError: (err: any) => toast.error("Launch failed", { description: err?.message }),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-ai" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Campaign not found"
        description="This campaign may have been deleted or renamed."
        action={
          <Button variant="outline" asChild>
            <Link to="/campaigns">Back to campaigns</Link>
          </Button>
        }
      />
    );
  }

  const connRate =
    campaign.completed > 0
      ? ((campaign.connected / campaign.completed) * 100).toFixed(1)
      : "0.0";

  const meetRate =
    campaign.completed > 0
      ? ((campaign.meetings / campaign.completed) * 100).toFixed(1)
      : "0.0";

  const schedDays = campaign.schedule?.days?.join(", ") ?? "—";
  const schedTime = campaign.schedule?.start && campaign.schedule?.end
    ? `${campaign.schedule.start}–${campaign.schedule.end}`
    : "—";

  return (
    <>
      <Link
        to="/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Campaigns
      </Link>

      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {campaign.name}
            <StatusBadge status={campaign.status} />
          </span>
        }
        subtitle={campaign.audience}
        actions={
          <>
            {(campaign.status === "Draft" || campaign.status === "Scheduled") && (
              <Button onClick={() => launchMutation.mutate()} disabled={launchMutation.isPending}>
                {launchMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Launch campaign
              </Button>
            )}
            {campaign.status === "Running" && (
              <Button variant="outline" onClick={() => statusMutation.mutate("Paused")} disabled={statusMutation.isPending}>
                {statusMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Pause campaign
              </Button>
            )}
            {campaign.status === "Paused" && (
              <Button onClick={() => statusMutation.mutate("Running")} disabled={statusMutation.isPending}>
                {statusMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Resume campaign
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total leads" value={campaign.total_leads.toLocaleString()} delta="Imported" icon={Users} />
        <StatCard label="Calls dialled" value={campaign.total_calls.toLocaleString()} delta="Total" icon={Phone} />
        <StatCard label="Connect rate" value={`${connRate}%`} delta="Connected" trend="up" icon={Target} />
        <StatCard label="Meetings" value={campaign.meetings.toString()} delta={`${meetRate}% rate`} trend="up" icon={CalendarCheck} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Funnel */}
          <SectionCard title="Funnel breakdown" description="Conversion at each stage">
            {[
              { label: "Total leads", value: campaign.total_leads, color: "bg-muted-foreground" },
              { label: "Dialled", value: campaign.completed, color: "bg-ai" },
              { label: "Connected", value: campaign.connected, color: "bg-success" },
              { label: "Interested", value: campaign.interested, color: "bg-chart-2" },
              { label: "Qualified", value: campaign.qualified, color: "bg-warning" },
              { label: "Meetings", value: campaign.meetings, color: "bg-danger" },
            ].map(({ label, value, color }) => {
              const pct =
                campaign.total_leads > 0
                  ? Math.round((value / campaign.total_leads) * 100)
                  : 0;
              return (
                <div key={label} className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="num font-medium text-foreground">
                      {value.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-soft">
                    <div
                      className={`h-full rounded-full transition-all ${color}`}
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </SectionCard>

          {/* Recent calls */}
          <SectionCard title="Recent calls" description="Latest calls in this campaign" padded={false}>
            {campaignCalls.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={Phone} title="No calls yet" description="Launch the campaign to start calling leads." />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {campaignCalls.map((call) => (
                  <li key={call.id}>
                    <Link
                      to="/calls/$callId"
                      params={{ callId: call.id }}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-muted transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {call.summary?.slice(0, 40) || `Call ${call.id.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">{call.outcome || call.status}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <IntentScore score={call.intent_score} />
                        <StatusBadge status={call.sentiment} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          {/* Campaign info */}
          <SectionCard title="Campaign details">
            <dl className="space-y-3 text-sm">
              {[
                { label: "Status", value: campaign.status },
                { label: "Audience", value: campaign.audience || "—" },
                { label: "Schedule", value: `${schedDays} · ${schedTime}` },
                { label: "Timezone", value: campaign.schedule?.timezone ?? "UTC" },
                { label: "Agent ID", value: campaign.agent_id ? `${campaign.agent_id.slice(0, 8)}…` : "Not assigned" },
                { label: "Objective", value: campaign.objective || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3">
                  <dt className="w-24 shrink-0 text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-xs font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>

          {/* Lead sample */}
          <SectionCard title="Sample leads" description={`${campaignLeads.length} total in this campaign`} padded={false}>
            {campaignLeads.length === 0 ? (
              <p className="px-5 py-4 text-xs text-muted-foreground">No leads imported yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {campaignLeads.slice(0, 8).map((lead) => (
                  <li key={lead.id}>
                    <Link
                      to="/leads/$leadId"
                      params={{ leadId: lead.id }}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-surface-muted transition-colors"
                    >
                      <div>
                        <p className="text-xs font-medium text-foreground">{lead.name}</p>
                        <p className="text-[10px] text-muted-foreground">{lead.company}</p>
                      </div>
                      <StatusBadge status={lead.status} />
                    </Link>
                  </li>
                ))}
                {campaignLeads.length > 8 && (
                  <li className="px-4 py-2 text-center text-xs text-muted-foreground">
                    +{campaignLeads.length - 8} more leads
                  </li>
                )}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
