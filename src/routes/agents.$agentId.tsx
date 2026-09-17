import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2, Mic, Phone, Sparkles, Target } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { IntentScore } from "@/components/common/IntentScore";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { agentsApi, callsApi, type AgentDTO } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agents/$agentId")({
  head: () => ({
    meta: [
      { title: "Agent configuration — Indianvoice.ai" },
      {
        name: "description",
        content:
          "Tune an AI voice sales agent: opening line, objection handling, qualification criteria and live call performance.",
      },
    ],
  }),
  component: AgentDetail,
});

function AgentDetail() {
  const { agentId } = useParams({ from: "/agents/$agentId" });
  const queryClient = useQueryClient();

  const { data: agent, isLoading } = useQuery({
    queryKey: ["agents", agentId],
    queryFn: () => agentsApi.get(agentId),
  });

  const { data: agentCalls = [] } = useQuery({
    queryKey: ["calls", { agent_id: agentId }],
    queryFn: () => callsApi.list({ limit: 10 }),
    enabled: !!agentId,
  });

  const [objective, setObjective] = useState("");
  const [tone, setTone] = useState("");
  const [openingScript, setOpeningScript] = useState("");
  const [qualificationCriteria, setQualificationCriteria] = useState("");

  const updateMutation = useMutation({
    mutationFn: () => {
      const payload: Partial<AgentDTO> = {};
      const obj = objective || agent?.objective;
      if (obj) payload.objective = obj;
      const t = tone || agent?.tone;
      if (t) payload.tone = t;
      const scr = openingScript || agent?.opening_script;
      if (scr) payload.opening_script = scr;
      const crit = qualificationCriteria || agent?.qualification_criteria;
      if (crit) payload.qualification_criteria = crit;
      return agentsApi.update(agentId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", agentId] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent configuration saved");
    },
    onError: () => toast.error("Failed to save configuration"),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => agentsApi.setStatus(agentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", agentId] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-ai" />
      </div>
    );
  }

  if (!agent) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Agent not found"
        description="This agent may have been deleted or renamed."
        action={
          <Button variant="outline" asChild>
            <Link to="/agents">Back to agents</Link>
          </Button>
        }
      />
    );
  }

  const initials = agent.name.slice(0, 2).toUpperCase();
  const filteredCalls = agentCalls.filter((c) => c.agent_id === agentId);

  return (
    <>
      <Link
        to="/agents"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All agents
      </Link>

      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-ai-soft font-display text-sm font-bold text-ai">
              {initials}
            </span>
            {agent.name}
            <StatusBadge status={agent.status} />
          </span>
        }
        subtitle={agent.description}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/playground">
                <Mic className="size-4" /> Test voice
              </Link>
            </Button>
            <Button
              variant={agent.status === "Active" ? "outline" : "default"}
              disabled={statusMutation.isPending}
              onClick={() =>
                statusMutation.mutate(agent.status === "Active" ? "Paused" : "Active")
              }
            >
              {statusMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : agent.status === "Active" ? (
                "Pause agent"
              ) : (
                "Activate agent"
              )}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Calls handled" value={agent.total_calls.toLocaleString()} delta="Lifetime" icon={Phone} />
        <StatCard label="Conversion rate" value={`${agent.conversion_rate}%`} delta="Overall" icon={Target} />
        <StatCard label="Status" value={agent.status} delta={agent.industry} trend="flat" />
        <StatCard label="Voice" value={agent.voice || "Not set"} delta={agent.tone || "—"} trend="flat" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Conversation strategy" description="Applied to every call this agent runs">
            <div className="space-y-4">
              <div>
                <Label htmlFor="opening">Opening line</Label>
                <Textarea
                  id="opening"
                  className="mt-1.5"
                  defaultValue={agent.opening_script || `Hi {{first_name}}, this is ${agent.name}. I'll be quick — do you have thirty seconds?`}
                  onChange={(e) => setOpeningScript(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="objective">Objective</Label>
                <Input
                  id="objective"
                  className="mt-1.5"
                  defaultValue={agent.objective}
                  onChange={(e) => setObjective(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="tone">Tone</Label>
                  <Input
                    id="tone"
                    className="mt-1.5"
                    defaultValue={agent.tone}
                    onChange={(e) => setTone(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="voice">Voice</Label>
                  <Input id="voice" className="mt-1.5" defaultValue={agent.voice} readOnly />
                </div>
              </div>
              <div>
                <Label htmlFor="qualify">Qualification criteria</Label>
                <Textarea
                  id="qualify"
                  className="mt-1.5"
                  defaultValue={
                    agent.qualification_criteria ||
                    "Qualified when the prospect confirms: (1) they own or influence the budget, (2) the pain is active today, (3) they agree to a 20-minute demo within 14 days."
                  }
                  onChange={(e) => setQualificationCriteria(e.target.value)}
                />
              </div>
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : null}
                Save configuration
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Recent calls" description="Latest conversations by this agent" padded={false}>
            {filteredCalls.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={Phone}
                  title="No calls yet"
                  description="Assign this agent to a campaign to start conversations."
                />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filteredCalls.map((call) => (
                  <li key={call.id}>
                    <Link
                      to="/calls/$callId"
                      params={{ callId: call.id }}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-surface-muted"
                    >
                      <div className="min-w-40">
                        <p className="text-sm font-medium text-foreground">
                          {call.lead_id ?? "Unknown lead"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {call.status} · {call.duration_seconds}s
                        </p>
                      </div>
                      <IntentScore score={call.intent_score} />
                      <StatusBadge status={call.sentiment} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Objection playbook" description="Rebuttals configured for this agent">
            {Object.keys(agent.objection_playbook || {}).length > 0 ? (
              <ul className="space-y-3 text-sm">
                {Object.entries(agent.objection_playbook).map(([objection, response]) => (
                  <li key={objection} className="rounded-lg border border-border bg-surface-muted p-3">
                    <p className="font-medium text-foreground">"{objection}"</p>
                    <p className="mt-1 text-xs text-muted-foreground">{response as string}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No objection playbook configured yet. Update the agent to add rebuttals.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Business context">
            {Object.keys(agent.business_info || {}).length > 0 ? (
              <dl className="space-y-2 text-xs">
                {Object.entries(agent.business_info).map(([k, v]) => (
                  <div key={k} className="flex gap-3">
                    <dt className="w-24 shrink-0 text-muted-foreground capitalize">{k}</dt>
                    <dd className="font-medium text-foreground">{v as string}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-xs text-muted-foreground">No business info configured.</p>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
