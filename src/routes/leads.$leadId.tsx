import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Phone,
  PhoneCall,
  Sparkles,
  Tag,
  TrendingUp,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { IntentScore } from "@/components/common/IntentScore";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { leadsApi, callsApi, telephonyApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leads/$leadId")({
  head: () => ({
    meta: [
      { title: "Lead profile — Indianvoice.ai" },
      {
        name: "description",
        content: "View intent score, call history, pain points and qualification status for this lead.",
      },
    ],
  }),
  component: LeadDetail,
});

function LeadDetail() {
  const { leadId } = useParams({ from: "/leads/$leadId" });
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");

  const { data: lead, isLoading } = useQuery({
    queryKey: ["leads", leadId],
    queryFn: () => leadsApi.get(leadId),
  });

  const { data: calls = [] } = useQuery({
    queryKey: ["calls", { lead_id: leadId }],
    queryFn: () => callsApi.list({ lead_id: leadId, limit: 20 }),
    enabled: !!leadId,
  });

  const [calling, setCalling] = useState(false);

  async function handleCallLead() {
    if (!lead?.phone) {
      toast.error("Lead does not have a phone number.");
      return;
    }
    setCalling(true);
    try {
      const res = await telephonyApi.outboundCall(lead.phone, lead.id, lead.agent_id ?? undefined);
      toast.success(`Outbound call placed to ${lead.phone}`, {
        description: `Via LiveKit · Room active · ID: ${res.call_sid?.slice(0, 12) ?? res.call_id?.slice(0, 12) ?? "N/A"}`,
      });
    } catch (err: any) {
      const msg = err.message || "";
      const status = err.status ?? err.statusCode ?? 0;
      if (status === 503 || msg.includes("not configured")) {
        toast.info(`LiveKit telephony not configured. Phone: ${lead.phone}`, {
          description: "Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_PHONE_NUMBER in .env.",
        });
      } else {
        toast.error(`Call failed: ${lead.phone}`, { description: msg });
      }
    } finally {
      setCalling(false);
    }
  }

  const updateMutation = useMutation({
    mutationFn: (patch: Parameters<typeof leadsApi.update>[1]) =>
      leadsApi.update(leadId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", leadId] });
      toast.success("Lead updated");
    },
    onError: () => toast.error("Failed to update lead"),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-ai" />
      </div>
    );
  }

  if (!lead) {
    return (
      <EmptyState
        icon={Phone}
        title="Lead not found"
        description="This lead may have been deleted."
        action={
          <Button variant="outline" asChild>
            <Link to="/leads">Back to CRM</Link>
          </Button>
        }
      />
    );
  }

  const sentimentColor: Record<string, string> = {
    Positive: "text-success",
    Neutral: "text-muted-foreground",
    Negative: "text-danger",
  };

  return (
    <>
      <Link
        to="/leads"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Leads CRM
      </Link>

      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-ai-soft font-display text-sm font-bold text-ai">
              {lead.name.slice(0, 2).toUpperCase()}
            </span>
            {lead.name}
            <StatusBadge status={lead.status} />
          </span>
        }
        subtitle={`${lead.title}${lead.title && lead.company ? " · " : ""}${lead.company}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={calling || !lead.phone}
              onClick={handleCallLead}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 font-medium"
            >
              {calling ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <PhoneCall className="size-3.5" />
              )}
              {calling ? "Calling…" : `Call ${lead.phone || "Lead"}`}
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            {(["Interested", "Qualified", "Meeting", "Not Interested"] as const).map((s) => (
              <Button
                key={s}
                variant={lead.status === s ? "default" : "outline"}
                size="sm"
                onClick={() => updateMutation.mutate({ status: s })}
                disabled={updateMutation.isPending}
              >
                {s}
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Intent score"
          value={`${lead.intent_score}/100`}
          delta={lead.intent_score >= 70 ? "High intent" : lead.intent_score >= 40 ? "Medium" : "Low"}
          trend={lead.intent_score >= 50 ? "up" : "down"}
          icon={TrendingUp}
        />
        <StatCard
          label="Lead score"
          value={`${lead.lead_score}/100`}
          delta={lead.lead_score >= 70 ? "Hot lead" : "Needs nurturing"}
          trend={lead.lead_score >= 50 ? "up" : "down"}
          icon={Tag}
        />
        <StatCard
          label="Sentiment"
          value={lead.sentiment || "Unknown"}
          delta={lead.status}
          trend={lead.sentiment === "Positive" ? "up" : "flat"}
          icon={MessageSquare}
        />
        <StatCard
          label="Calls"
          value={calls.length.toString()}
          delta="Total conversations"
          icon={Phone}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Call history */}
          <SectionCard title="Call history" description="All AI conversations with this lead" padded={false}>
            {calls.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={Phone}
                  title="No calls yet"
                  description="This lead hasn't been called yet."
                />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {calls.map((call) => (
                  <li key={call.id}>
                    <Link
                      to="/calls/$callId"
                      params={{ callId: call.id }}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-surface-muted transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{call.outcome || call.status}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" />
                          {call.duration_seconds}s duration · {call.summary?.slice(0, 60) || "No summary"}…
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <IntentScore score={call.intent_score} />
                        <span className={cn("text-xs font-medium", sentimentColor[call.sentiment] ?? "text-muted-foreground")}>
                          {call.sentiment}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Notes */}
          <SectionCard title="Notes">
            <Textarea
              rows={4}
              placeholder="Add notes about this lead…"
              defaultValue={lead.notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button
              className="mt-3"
              size="sm"
              onClick={() => updateMutation.mutate({ notes: notes || lead.notes })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Save notes
            </Button>
          </SectionCard>
        </div>

        <div className="space-y-6">
          {/* Contact info */}
          <SectionCard title="Contact details">
            <dl className="space-y-2 text-xs">
              {[
                { label: "Phone", value: lead.phone },
                { label: "Email", value: lead.email },
                { label: "Location", value: lead.location },
                { label: "Industry", value: lead.industry },
                { label: "Owner", value: lead.owner },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3">
                  <dt className="w-20 shrink-0 text-muted-foreground">{label}</dt>
                  <dd className="font-medium text-foreground">{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>

          {/* Pain points */}
          {lead.pain_points?.length > 0 && (
            <SectionCard title="Pain points">
              <ul className="space-y-1.5">
                {lead.pain_points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-xs">
                    <Sparkles className="size-3.5 shrink-0 mt-0.5 text-ai" />
                    <span className="text-foreground">{p}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* Objections */}
          {lead.objections?.length > 0 && (
            <SectionCard title="Objections raised">
              <div className="flex flex-wrap gap-2">
                {lead.objections.map((o) => (
                  <span
                    key={o}
                    className="rounded-md border border-warning/30 bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning-foreground"
                  >
                    {o}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Summary */}
          {lead.summary && (
            <SectionCard title="AI summary">
              <p className="text-xs leading-relaxed text-foreground">{lead.summary}</p>
              {lead.next_action && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-ai/20 bg-ai-soft px-3 py-2">
                  <Sparkles className="size-3.5 shrink-0 text-ai" />
                  <p className="text-xs font-medium text-ai">Next: {lead.next_action}</p>
                </div>
              )}
            </SectionCard>
          )}
        </div>
      </div>
    </>
  );
}
