import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  CalendarCheck,
  Loader2,
  Phone,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ChartCard } from "@/components/common/ChartCard";
import { SectionCard } from "@/components/common/SectionCard";
import { cn } from "@/lib/utils";
import { analyticsApi } from "@/lib/api";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — VoxSales AI" },
      {
        name: "description",
        content:
          "Platform-wide analytics: call volume, connection rates, agent performance, campaign funnels and outcome breakdown.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const FUNNEL_COLORS = [
  "#7c6bf5",
  "#5c8ef7",
  "#36bfa0",
  "#e5b84a",
  "#e57c4a",
  "#e54a5e",
];

const OUTCOME_COLORS: Record<string, string> = {
  "Meeting booked": "oklch(0.62 0.19 145)",
  Qualified: "oklch(0.55 0.22 228)",
  Interested: "oklch(0.56 0.22 263)",
  "Follow-up scheduled": "oklch(0.62 0.18 65)",
  "Callback requested": "oklch(0.63 0.17 85)",
  "Not interested": "oklch(0.52 0.16 15)",
  "No answer": "oklch(0.48 0.04 250)",
};

function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(7);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: () => analyticsApi.summary(),
    staleTime: 30_000,
    retry: 1,
  });

  const { data: timeseries = [], isLoading: tsLoading } = useQuery({
    queryKey: ["analytics", "timeseries", timeRange],
    queryFn: () => analyticsApi.timeseries(timeRange),
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

  // Chart data
  const chartData = timeseries.map((d) => ({
    day: d.label,
    calls: d.calls,
    connected: d.connected,
  }));

  const pieData = funnel
    .filter((f) => f.value > 0)
    .map((f, i) => ({ name: f.stage, value: f.value, color: FUNNEL_COLORS[i % FUNNEL_COLORS.length] }));

  const totalCalls = summary?.total_calls ?? 0;
  const connectRate = summary?.connect_rate ?? 0;
  const qualifiedLeads = summary?.total_qualified ?? 0;
  const meetings = summary?.total_meetings ?? 0;

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Real-time platform-wide performance powered by live database queries"
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card/60 p-0.5">
            {([7, 14, 30] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                  timeRange === r
                    ? "bg-ai text-ai-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r}d
              </button>
            ))}
          </div>
        }
      />

      {/* KPI strip */}
      {summaryLoading ? (
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-ai" />
          <span className="text-sm text-muted-foreground">Loading analytics…</span>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total calls"
            value={totalCalls.toLocaleString()}
            delta="Lifetime"
            trend="up"
            icon={Phone}
          />
          <StatCard
            label="Connect rate"
            value={`${connectRate}%`}
            delta="Connected / Dialled"
            trend="up"
            icon={TrendingUp}
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
            value={meetings.toString()}
            delta="Total"
            trend="up"
            icon={CalendarCheck}
          />
        </div>
      )}

      {/* Time series */}
      <ChartCard
        title="Call volume & connection"
        description={`Daily breakdown — last ${timeRange} days`}
        bodyClassName="p-0 pt-2"
        action={
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card/60 p-0.5">
            {([7, 14, 30] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
                  timeRange === r
                    ? "bg-ai text-ai-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r}d
              </button>
            ))}
          </div>
        }
      >
        <div className="h-72 w-full p-2">
          {tsLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-6 animate-spin text-ai" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No call data for this period — calls will appear as they happen
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 16, right: 16, left: -4, bottom: 0 }}>
                <defs>
                  <linearGradient id="ga-calls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.58 0.22 263)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.58 0.22 263)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ga-conn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.19 145)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.62 0.19 145)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} strokeOpacity={0.6} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={38} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="calls" name="Dials" stroke="oklch(0.58 0.22 263)" strokeWidth={2.5}
                  fill="url(#ga-calls)" dot={false} />
                <Area type="monotone" dataKey="connected" name="Connected" stroke="oklch(0.62 0.19 145)" strokeWidth={2.5}
                  fill="url(#ga-conn)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartCard>

      {/* Funnel + Agent performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Funnel pie */}
        <ChartCard
          title="Pipeline funnel"
          description="Lead stage distribution"
          bodyClassName="p-0 pt-2"
        >
          <div className="h-64 w-full p-2">
            {pieData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No lead data yet — import leads to see the funnel
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        {/* Agent performance bar */}
        <ChartCard
          title="Agent performance"
          description="Calls handled by agent"
          bodyClassName="p-0 pt-2"
        >
          <div className="h-64 w-full p-2">
            {agentStats.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No agents yet — create an agent to see performance data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={agentStats.map((a) => ({
                    name: a.agent_name.slice(0, 12),
                    calls: a.calls,
                    connected: a.connected,
                    conversion: a.conversion,
                  }))}
                  margin={{ top: 10, right: 10, left: -4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} strokeOpacity={0.6} />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={38} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="calls" name="Total Calls" fill="oklch(0.58 0.22 263)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="connected" name="Connected" fill="oklch(0.62 0.19 145)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Conversion funnel table + Agent stats table */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Funnel table */}
        <SectionCard title="Conversion funnel" description="Stage-by-stage breakdown" padded={false}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-2.5 text-left font-medium">Stage</th>
                <th className="px-4 py-2.5 text-right font-medium">Count</th>
                <th className="px-4 py-2.5 text-right font-medium">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {funnel.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground text-xs">
                    No data yet
                  </td>
                </tr>
              ) : (
                funnel.map((row, i) => {
                  const base = funnel[0]?.value ?? 0;
                  const pct =
                    base > 0
                      ? Math.round((row.value / base) * 100)
                      : 0;
                  return (
                    <tr key={row.stage} className="hover:bg-surface-muted/50">
                      <td className="px-4 py-2.5 font-medium text-foreground">
                        <span
                          className="mr-2 inline-block size-2 rounded-full"
                          style={{ background: FUNNEL_COLORS[i % FUNNEL_COLORS.length] }}
                        />
                        {row.stage}
                      </td>
                      <td className="num px-4 py-2.5 text-right text-foreground">
                        {row.value.toLocaleString()}
                      </td>
                      <td className="num px-4 py-2.5 text-right text-muted-foreground">
                        {pct}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </SectionCard>

        {/* Agent leaderboard */}
        <SectionCard title="Agent leaderboard" description="Conversion rates — lifetime" padded={false}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-2.5 text-left font-medium">Agent</th>
                <th className="px-4 py-2.5 text-right font-medium">Calls</th>
                <th className="px-4 py-2.5 text-right font-medium">Connected</th>
                <th className="px-4 py-2.5 text-right font-medium">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {agentStats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground text-xs">
                    No agents yet
                  </td>
                </tr>
              ) : (
                agentStats.map((agent, i) => (
                  <tr key={agent.agent_id} className="hover:bg-surface-muted/50">
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      <span className="mr-2 inline-flex size-5 items-center justify-center rounded bg-neutral-soft text-[10px] font-bold">
                        #{i + 1}
                      </span>
                      {agent.agent_name}
                    </td>
                    <td className="num px-4 py-2.5 text-right text-foreground">
                      {agent.calls.toLocaleString()}
                    </td>
                    <td className="num px-4 py-2.5 text-right text-foreground">
                      {agent.connected.toLocaleString()}
                    </td>
                    <td className={cn("num px-4 py-2.5 text-right font-semibold", i === 0 ? "text-success" : "text-foreground")}>
                      {agent.conversion}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </SectionCard>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Active campaigns", value: summary.active_campaigns, icon: <Target className="size-5 text-ai" />, color: "text-ai" },
            { label: "Total leads in CRM", value: summary.total_leads, icon: <Users className="size-5 text-success" />, color: "text-success" },
            { label: "Qualify rate", value: `${summary.qualify_rate}%`, icon: <TrendingUp className="size-5 text-warning" />, color: "text-warning" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="grid size-10 place-items-center rounded-xl bg-surface-muted">
                {icon}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn("num text-xl font-bold", color)}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
