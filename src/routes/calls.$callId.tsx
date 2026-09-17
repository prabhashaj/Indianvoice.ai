import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Clock,
  Loader2,
  MessageSquare,
  Phone,
  Sparkles,
  Tag,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { IntentScore } from "@/components/common/IntentScore";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { callsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calls/$callId")({
  head: () => ({
    meta: [
      { title: "Call detail — Indianvoice.ai" },
      {
        name: "description",
        content: "Full call transcript, AI analysis, intent score, sentiment and structured conversation intelligence.",
      },
    ],
  }),
  component: CallDetail,
});

function CallDetail() {
  const { callId } = useParams({ from: "/calls/$callId" });

  const { data: call, isLoading } = useQuery({
    queryKey: ["calls", callId],
    queryFn: () => callsApi.get(callId),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-ai" />
      </div>
    );
  }

  if (!call) {
    return (
      <EmptyState
        icon={Phone}
        title="Call not found"
        description="This call record may have been deleted."
        action={
          <Button variant="outline" asChild>
            <Link to="/calls">Back to calls</Link>
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

  const durationFmt = call.duration_seconds
    ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s`
    : "—";

  return (
    <>
      <Link
        to="/calls"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Call intelligence
      </Link>

      <PageHeader
        title={
          <span className="flex items-center gap-3 flex-wrap">
            {call.summary?.slice(0, 40) || `Call ${call.id.slice(0, 8)}`}
            <StatusBadge status={call.status} />
            {call.sentiment && <StatusBadge status={call.sentiment} />}
          </span>
        }
        subtitle={`Room: ${call.livekit_room_name || call.id}`}
        actions={
          call.lead_id && (
            <Button variant="outline" asChild>
              <Link to="/leads/$leadId" params={{ leadId: call.lead_id }}>
                View lead profile
              </Link>
            </Button>
          )
        }
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Duration" value={durationFmt} delta={`${call.duration_seconds ?? 0}s total`} trend="flat" icon={Clock} />
        <StatCard
          label="Intent score"
          value={`${call.intent_score}/100`}
          delta={call.intent_score >= 70 ? "High intent" : call.intent_score >= 40 ? "Medium" : "Low intent"}
          trend={call.intent_score >= 50 ? "up" : "down"}
          icon={TrendingUp}
        />
        <StatCard
          label="Lead score"
          value={`${call.lead_score}/100`}
          delta={call.lead_score >= 70 ? "Qualified" : "Needs nurturing"}
          trend={call.lead_score >= 50 ? "up" : "down"}
          icon={Tag}
        />
        <StatCard
          label="Sentiment"
          value={call.sentiment || "—"}
          delta={call.outcome || "—"}
          trend={call.sentiment === "Positive" ? "up" : call.sentiment === "Negative" ? "down" : "flat"}
          icon={MessageSquare}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Transcript */}
          <SectionCard
            title="Conversation transcript"
            description="Full verbatim transcript with highlighted buying signals"
            padded={false}
          >
            {!call.transcript || call.transcript.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={MessageSquare}
                  title="No transcript available"
                  description="The call did not connect or audio was not captured."
                />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {call.transcript.map((line, i) => (
                  <li
                    key={line.id ?? i}
                    className={cn(
                      "flex gap-4 px-5 py-3 text-sm",
                      line.is_highlight && "bg-ai-soft/50",
                    )}
                  >
                    <span className="num shrink-0 text-xs text-muted-foreground w-10 pt-0.5">
                      {line.offset_seconds ? `${line.offset_seconds}s` : `${i}`}
                    </span>
                    <div className="flex-1">
                      <span
                        className={cn(
                          "mb-1 block text-[10px] font-semibold uppercase tracking-wide",
                          line.speaker === "AI" ? "text-ai" : "text-muted-foreground",
                        )}
                      >
                        {line.speaker === "AI" ? "AI Agent" : "Customer"}
                      </span>
                      <p className={cn("leading-relaxed text-foreground", line.is_highlight && "font-medium")}>
                        {line.text}
                      </p>
                    </div>
                    {line.is_highlight && (
                      <span className="shrink-0 mt-1">
                        <Sparkles className="size-3.5 text-ai" />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* AI Analysis */}
          {call.analysis && call.analysis.length > 0 && (
            <SectionCard
              title="AI analysis"
              description="Key insights generated from this conversation"
            >
              <ul className="space-y-3">
                {call.analysis.map((insight, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <Sparkles className="size-4 shrink-0 mt-0.5 text-ai" />
                    <span className="text-foreground leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>

        <div className="space-y-6">
          {/* Call summary */}
          <SectionCard title="Call summary">
            <p className="text-sm leading-relaxed text-foreground">{call.summary || "No summary available."}</p>
            {call.next_action && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-ai/20 bg-ai-soft px-3 py-2">
                <Sparkles className="size-4 shrink-0 text-ai" />
                <p className="text-xs font-medium text-ai">Next: {call.next_action}</p>
              </div>
            )}
          </SectionCard>

          {/* Topics */}
          {call.topics && call.topics.length > 0 && (
            <SectionCard title="Topics discussed">
              <div className="flex flex-wrap gap-2">
                {call.topics.map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-border bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Objections */}
          {call.objections && call.objections.length > 0 && (
            <SectionCard title="Objections raised">
              <div className="flex flex-wrap gap-2">
                {call.objections.map((o) => (
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

          {/* Call metadata */}
          <SectionCard title="Details">
            <dl className="space-y-2 text-xs">
              {[
                { label: "Lead ID", value: call.lead_id ?? "—" },
                { label: "Agent ID", value: call.agent_id ? call.agent_id.slice(0, 8) + "…" : "—" },
                { label: "Campaign", value: call.campaign_id ? call.campaign_id.slice(0, 8) + "…" : "—" },
                { label: "Call ID", value: call.id.slice(0, 16) + "…" },
                { label: "Room", value: call.livekit_room_name || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3">
                  <dt className="w-20 shrink-0 text-muted-foreground">{label}</dt>
                  <dd className="font-mono font-medium text-foreground truncate">{value}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
