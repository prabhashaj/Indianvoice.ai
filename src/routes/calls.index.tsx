import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter, Loader2, Phone, Search } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { IntentScore } from "@/components/common/IntentScore";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { callsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calls/")({
  head: () => ({
    meta: [
      { title: "Call Intelligence — VoxSales AI" },
      {
        name: "description",
        content:
          "Browse AI call recordings, transcripts, sentiment, buying intent and structured call analysis for every conversation.",
      },
    ],
  }),
  component: CallsPage,
});

const sentimentColor: Record<string, string> = {
  Positive: "text-success",
  Neutral: "text-muted-foreground",
  Negative: "text-danger",
};

const OUTCOME_OPTIONS = [
  "all",
  "Meeting booked",
  "Qualified",
  "Interested",
  "Follow-up scheduled",
  "Callback requested",
  "Not interested",
  "No answer",
];

function CallsPage() {
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: calls = [], isLoading } = useQuery({
    queryKey: ["calls"],
    queryFn: () => callsApi.list({ limit: 200 }),
    staleTime: 15_000,
  });

  const filtered = calls.filter((call) => {
    const matchSearch =
      !search ||
      (call.lead_id ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (call.summary ?? "").toLowerCase().includes(search.toLowerCase());
    const matchOutcome = outcomeFilter === "all" || call.outcome === outcomeFilter;
    const matchStatus = statusFilter === "all" || call.status === statusFilter;
    return matchSearch && matchOutcome && matchStatus;
  });

  const totalCalls = calls.length;
  const completed = calls.filter((c) => c.status === "Completed").length;
  const inProgress = calls.filter((c) => c.status === "In Progress").length;
  const failed = calls.filter((c) => c.status === "Failed").length;

  return (
    <>
      <PageHeader
        title="Call intelligence"
        subtitle="Every conversation your AI agents have conducted, with full transcripts and analysis"
      />

      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total calls", value: totalCalls },
          { label: "Completed", value: completed },
          { label: "In progress", value: inProgress },
          { label: "Failed", value: failed },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card px-4 py-3 shadow-card"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="num mt-1 text-xl font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="calls-search"
            placeholder="Search by lead or summary…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
          <SelectTrigger className="w-48">
            <Filter className="size-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OUTCOME_OPTIONS.map((o) => (
              <SelectItem key={o} value={o}>
                {o === "all" ? "All outcomes" : o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {calls.length} calls
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-ai" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={Phone}
              title="No calls found"
              description="Try adjusting your search or filters."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-medium">Call ID</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Duration</th>
                  <th className="px-4 py-3 text-left font-medium">Intent</th>
                  <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Sentiment</th>
                  <th className="px-4 py-3 text-left font-medium">Outcome</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((call) => (
                  <tr
                    key={call.id}
                    className="transition-colors hover:bg-surface-muted group"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to="/calls/$callId"
                        params={{ callId: call.id }}
                        className="group-hover:text-ai"
                      >
                        <p className="font-medium text-foreground group-hover:text-ai transition-colors">
                          {call.summary?.slice(0, 40) || `Call ${call.id.slice(0, 8)}…`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {call.livekit_room_name || call.id.slice(0, 16)}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell num text-xs text-foreground">
                      {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <IntentScore score={call.intent_score} />
                    </td>
                    <td className={cn("px-4 py-3 hidden lg:table-cell text-xs font-medium", sentimentColor[call.sentiment] ?? "text-muted-foreground")}>
                      {call.sentiment || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-36 truncate">
                      {call.outcome || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={call.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
