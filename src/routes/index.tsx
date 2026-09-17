import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  CalendarCheck,
  Phone,
  PhoneCall,
  Sparkles,
  Target,
  TrendingUp,
  Radio,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ChartCard } from "@/components/common/ChartCard";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { IntentScore } from "@/components/common/IntentScore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { analyticsApi, leadsApi, callsApi, agentsApi } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — VoxSales AI Voice Sales Command Center" },
      {
        name: "description",
        content:
          "Live view of your AI voice sales team: calls in progress, connect rates, qualified leads and meetings booked today.",
      },
    ],
  }),
  component: Dashboard,
});

// ─── Colour maps ───────────────────────────────────────────────────────────────

const FUNNEL_COLORS = [
  "oklch(0.58 0.22 263)",
  "oklch(0.56 0.22 228)",
  "oklch(0.58 0.18 145)",
  "oklch(0.67 0.19 84)",
  "oklch(0.62 0.22 27)",
  "oklch(0.55 0.25 10)",
];

// ─── Chart Tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const dials = payload.find((p: any) => p.dataKey === "calls")?.value ?? 0;
  const connected = payload.find((p: any) => p.dataKey === "connected")?.value ?? 0;
  const rate = dials > 0 ? Math.round((connected / dials) * 100) : 0;

  return (
    <div className="min-w-[190px] rounded-xl border border-border/80 bg-card/95 p-3.5 shadow-raised backdrop-blur-md text-xs">
      <div className="mb-2.5 flex items-center justify-between border-b border-border/60 pb-2">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="inline-flex items-center rounded-md bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">
          {rate}% Connect
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full bg-[oklch(0.58_0.22_263)]" />
            Dials
          </span>
          <span className="font-bold text-foreground tabular-nums">{dials.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full bg-[oklch(0.62_0.19_145)]" />
            Connected
          </span>
          <span className="font-bold text-foreground tabular-nums">{connected.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Funnel Bar ────────────────────────────────────────────────────────────────

function FunnelItem({
  stage,
  value,
  max,
  color,
  pct,
}: {
  stage: string;
  value: number;
  max: number;
  color: string;
  pct: number;
}) {
  const barWidth = Math.max(6, (value / Math.max(1, max)) * 100);
  return (
    <li className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{stage}</span>
        <div className="flex items-center gap-2">
          <span className="num font-semibold text-foreground">{value.toLocaleString()}</span>
          <span className="w-8 text-right text-[10px] font-medium text-muted-foreground">{pct}%</span>
        </div>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-neutral-soft relative">
        <div
          className="h-full rounded-full transition-all duration-700 shadow-sm"
          style={{ width: `${barWidth}%`, background: color }}
        />
      </div>
    </li>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard() {
  const [timeRange, setTimeRange] = useState<"7d" | "14d" | "30d">("7d");
  const days = timeRange === "7d" ? 7 : timeRange === "14d" ? 14 : 30;

  const { data: summary } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: () => analyticsApi.summary(),
    staleTime: 30_000,
    retry: 1,
  });

  const { data: timeseries = [] } = useQuery({
    queryKey: ["analytics", "timeseries", days],
    queryFn: () => analyticsApi.timeseries(days),
    staleTime: 60_000,
    retry: 1,
  });

  const { data: funnel = [] } = useQuery({
    queryKey: ["analytics", "funnel"],
    queryFn: () => analyticsApi.funnel(),
    staleTime: 60_000,
    retry: 1,
  });

  const { data: agentStats = [] } = useQuery({
    queryKey: ["analytics", "agents"],
    queryFn: () => analyticsApi.agents(),
    staleTime: 60_000,
    retry: 1,
  });

  const { data: hotLeads = [] } = useQuery({
    queryKey: ["leads", "hot"],
    queryFn: () => leadsApi.list({ limit: 6 }),
    staleTime: 30_000,
    retry: 1,
    select: (data) => [...data].sort((a, b) => b.intent_score - a.intent_score).slice(0, 6),
  });

  const { data: liveCalls = [] } = useQuery({
    queryKey: ["calls", "live"],
    queryFn: () => callsApi.list({ status: "In Progress", limit: 5 }),
    staleTime: 10_000,
    refetchInterval: 15_000,
    retry: 1,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () => agentsApi.list(),
    staleTime: 60_000,
    retry: 1,
  });

  // Compute stats
  const totalCalls = summary?.total_calls ?? 0;
  const connectRate = summary ? `${summary.connect_rate}%` : "—";
  const qualifiedLeads = summary?.total_qualified ?? 0;
  const totalMeetings = summary?.total_meetings ?? 0;
  const activeAgents = agents.filter((a) => a.status === "Active").length;

  const chartData = timeseries.map((d) => ({
    day: d.label,
    calls: d.calls,
    connected: d.connected,
    qualified: d.qualified,
  }));

  const rangeDials = chartData.reduce((s, d) => s + d.calls, 0);
  const rangeConnected = chartData.reduce((s, d) => s + d.connected, 0);
  const rangeRate = rangeDials > 0 ? ((rangeConnected / rangeDials) * 100).toFixed(1) : "0";

  const maxFunnel = funnel[0]?.value ?? 1;

  return (
    <>
      <PageHeader
        title="Sales command center"
        subtitle={`${activeAgents} AI agent${activeAgents !== 1 ? "s" : ""} active · Live data`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/playground">Test a voice agent</Link>
            </Button>
            <Button asChild>
              <Link to="/campaigns/new">
                <Sparkles className="size-4" /> Launch campaign
              </Link>
            </Button>
          </>
        }
      />

      {/* ── KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total calls"
          value={totalCalls.toLocaleString()}
          delta="Lifetime"
          trend="up"
          icon={PhoneCall}
        />
        <StatCard
          label="Connect rate"
          value={connectRate}
          delta="Overall"
          trend="up"
          icon={Phone}
        />
        <StatCard
          label="Qualified leads"
          value={qualifiedLeads.toString()}
          delta="In pipeline"
          trend="up"
          icon={Target}
        />
        <StatCard
          label="Meetings booked"
          value={totalMeetings.toString()}
          delta="Total"
          trend="up"
          icon={CalendarCheck}
        />
      </div>

      {/* ── Call activity + Live calls */}
      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard
          title="Call activity"
          description={`Volume & conversion — ${timeRange.toUpperCase()} view`}
          className="xl:col-span-2"
          bodyClassName="p-0 pt-2"
          action={
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card/60 p-0.5">
              {(["7d", "14d", "30d"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold uppercase transition-all",
                    timeRange === r
                      ? "bg-ai text-ai-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          }
        >
          {/* Chart summary strip */}
          <div className="flex flex-wrap items-center gap-4 border-b border-border/60 px-5 py-2.5 bg-surface-muted/30 text-xs">
            <span className="text-muted-foreground">
              Total dials: <strong className="text-foreground">{rangeDials.toLocaleString()}</strong>
            </span>
            <span className="text-muted-foreground">
              Connected: <strong className="text-foreground">{rangeConnected.toLocaleString()}</strong>
            </span>
            <span className="text-muted-foreground">
              Avg Connect: <strong className="text-success">{rangeRate}%</strong>
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              Live data
            </span>
          </div>

          <div className="h-72 w-full p-2">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No call data yet — calls will appear here as they are made
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 16, right: 16, left: -4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g-dials" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.58 0.22 263)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="oklch(0.58 0.22 263)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g-conn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.62 0.19 145)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="oklch(0.62 0.19 145)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} strokeOpacity={0.6} />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} dy={6} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={38}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "oklch(0.58 0.22 263)", strokeWidth: 1.5, strokeDasharray: "4 4" }} />
                  <Area type="monotone" dataKey="calls" name="Dials" stroke="oklch(0.58 0.22 263)" strokeWidth={2.5}
                    fill="url(#g-dials)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "oklch(0.58 0.22 263)", fill: "var(--color-card)" }} />
                  <Area type="monotone" dataKey="connected" name="Connected" stroke="oklch(0.62 0.19 145)" strokeWidth={2.5}
                    fill="url(#g-conn)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "oklch(0.62 0.19 145)", fill: "var(--color-card)" }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex items-center gap-5 border-t border-border px-5 py-3">
            {[
              { label: "Dials", color: "oklch(0.58 0.22 263)" },
              { label: "Connected", color: "oklch(0.62 0.19 145)" },
            ].map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-2.5 rounded-full" style={{ background: color }} />
                {label}
              </span>
            ))}
            <span className="ml-auto text-xs text-muted-foreground">
              Live DB Feed
              <span className="ml-1.5 inline-flex size-1.5 rounded-full bg-success align-middle" />
            </span>
          </div>
        </ChartCard>

        {/* Live calls panel */}
        <SectionCard
          title="Live calls"
          description={`${liveCalls.length} active call${liveCalls.length === 1 ? "" : "s"} right now`}
          padded={false}
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/calls">View all</Link>
            </Button>
          }
        >
          <ul className="divide-y divide-border">
            {liveCalls.length === 0 ? (
              <li className="px-5 py-6 text-center text-sm text-muted-foreground">
                <Radio className="mx-auto size-8 mb-2 text-muted-foreground/30" />
                No active calls right now
              </li>
            ) : (
              liveCalls.map((call) => (
                <li key={call.id}>
                  <Link
                    to="/calls/$callId"
                    params={{ callId: call.id }}
                    className="block px-5 py-4 transition-colors hover:bg-surface-muted"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {call.livekit_room_name || `Call ${call.id.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">{call.summary?.slice(0, 40) || "In progress…"}</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-danger/25 bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger">
                        <span className="size-1.5 animate-pulse rounded-full bg-current" /> Live
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <IntentScore score={call.intent_score} />
                      <span className="num text-xs text-muted-foreground">{call.duration_seconds}s</span>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </SectionCard>
      </div>

      {/* ── Pipeline funnel + Hot leads */}
      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Pipeline funnel" description="Contacts → meetings">
          <ul className="space-y-3.5">
            {funnel.length === 0 ? (
              <li className="text-sm text-muted-foreground text-center py-4">No pipeline data yet</li>
            ) : (
              funnel.map((stage, i) => (
                <FunnelItem
                  key={stage.stage}
                  stage={stage.stage}
                  value={stage.value}
                  max={maxFunnel}
                  color={FUNNEL_COLORS[i % FUNNEL_COLORS.length] ?? "oklch(0.58 0.22 263)"}
                  pct={Math.round((stage.value / Math.max(1, maxFunnel)) * 100)}
                />
              ))
            )}
          </ul>
        </SectionCard>

        {/* Hot leads */}
        <SectionCard
          title="Highest intent leads"
          description="Ranked by AI buying-intent score"
          padded={false}
          className="xl:col-span-2"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/leads">Open CRM</Link>
            </Button>
          }
        >
          <ul className="divide-y divide-border">
            {hotLeads.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">No leads yet — import leads to see scores here</li>
            ) : (
              hotLeads.map((lead) => (
                <li
                  key={lead.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-40">
                    <Link to="/leads/$leadId" params={{ leadId: lead.id }} className="text-sm font-medium text-foreground hover:text-ai">
                      {lead.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {lead.title}{lead.title && lead.company ? " · " : ""}{lead.company}
                    </p>
                  </div>
                  <IntentScore score={lead.intent_score} />
                  <StatusBadge status={lead.status} />
                </li>
              ))
            )}
          </ul>
        </SectionCard>
      </div>

      {/* ── Agent leaderboard */}
      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Agent leaderboard"
          description="Conversion rate — all time"
          padded={false}
          className="xl:col-span-2"
        >
          <ul className="divide-y divide-border">
            {agentStats.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">No agents yet</li>
            ) : (
              agentStats.map((row, index) => (
                <li key={row.agent_id} className="flex items-center gap-4 px-5 py-3">
                  <span className="inline-flex size-6 items-center justify-center rounded-md font-bold text-xs bg-surface-muted text-foreground">
                    #{index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{row.agent_name}</p>
                    <p className="num text-xs text-muted-foreground">
                      {row.calls.toLocaleString()} calls · {row.connected} connected
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden w-20 overflow-hidden rounded-full h-1.5 bg-neutral-soft sm:block">
                      <div
                        className={cn("h-full rounded-full", index === 0 ? "bg-success" : "bg-ai/60")}
                        style={{ width: `${(row.conversion / Math.max(1, agentStats[0]?.conversion || 1)) * 100}%` }}
                      />
                    </div>
                    <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", index === 0 ? "text-success" : "text-muted-foreground")}>
                      <TrendingUp className="size-3.5" />
                      {row.conversion}%
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </SectionCard>

        <SectionCard title="System status" description="Real-time platform health">
          <ul className="space-y-3">
            {[
              { label: "FastAPI Backend", status: "Online", ok: true },
              { label: "Database (SQLite)", status: "Connected", ok: true },
              { label: "LiveKit Voice", status: summary ? "Ready" : "Checking…", ok: !!summary },
              { label: "Active Campaigns", status: `${summary?.active_campaigns ?? 0} running`, ok: true },
              { label: "Total Leads", status: `${summary?.total_leads ?? 0} in CRM`, ok: true },
            ].map((item) => (
              <li key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className={cn("flex items-center gap-1.5 font-medium text-xs", item.ok ? "text-success" : "text-warning")}>
                  <span className={cn("size-2 rounded-full", item.ok ? "bg-success animate-pulse" : "bg-warning")} />
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </>
  );
}
