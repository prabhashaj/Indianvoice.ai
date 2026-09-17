import { createFileRoute, Link } from "@tanstack/react-router";
import { CircuitBoard, Mic, Plus, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { agentsApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/agents/")(({
  head: () => ({
    meta: [
      { title: "AI Voice Agents — Indianvoice.ai" },
      {
        name: "description",
        content:
          "Create, configure and monitor AI voice sales agents: voice, language, objective, tone and live conversion performance.",
      },
      { property: "og:title", content: "AI Voice Agents — Indianvoice.ai" },
      {
        property: "og:description",
        content: "Your roster of AI sales reps, each with its own voice, script strategy and results.",
      },
    ],
  }),
  component: AgentsPage,
}));

function AgentSkeleton() {
  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-card animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-neutral-soft" />
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-neutral-soft" />
            <div className="h-3 w-36 rounded bg-neutral-soft" />
          </div>
        </div>
        <div className="h-5 w-16 rounded bg-neutral-soft" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-2.5 w-12 rounded bg-neutral-soft" />
            <div className="h-3 w-20 rounded bg-neutral-soft" />
          </div>
        ))}
      </div>
    </article>
  );
}

function AgentsPage() {
  const queryClient = useQueryClient();

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: () => agentsApi.list(),
    staleTime: 30_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      agentsApi.setStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: () => toast.error("Failed to update agent status"),
  });

  return (
    <>
      <PageHeader
        title="AI agents"
        subtitle="Each agent is a trained sales rep with its own voice, objective and objection playbook"
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/playground">
                <Mic className="size-4" /> Voice playground
              </Link>
            </Button>
            <Button asChild>
              <Link to="/agents/new">
                <Plus className="size-4" /> New agent
              </Link>
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => <AgentSkeleton key={i} />)}
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-20 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-ai-soft text-ai mx-auto mb-4">
            <Mic className="size-6" />
          </span>
          <p className="font-display text-base font-semibold text-foreground">No agents yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create your first AI sales agent to get started.</p>
          <Button className="mt-4" asChild>
            <Link to="/agents/new">
              <Plus className="size-4" /> New agent
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => {
            const initials = agent.name.slice(0, 2).toUpperCase();
            return (
              <article
                key={agent.id}
                className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:border-ai/30 hover:shadow-raised"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-xl bg-ai-soft font-display text-sm font-bold text-ai">
                      {initials}
                    </span>
                    <div>
                      <Link
                        to="/agents/$agentId"
                        params={{ agentId: agent.id }}
                        className="font-display text-base font-semibold text-foreground hover:text-ai"
                      >
                        {agent.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{agent.description}</p>
                    </div>
                  </div>
                  <StatusBadge status={agent.status} />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Voice</dt>
                    <dd className="mt-0.5 font-medium text-foreground truncate">{agent.voice || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Languages</dt>
                    <dd className="mt-0.5 font-medium text-foreground">{agent.languages.join(", ") || "English"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Calls handled</dt>
                    <dd className="num mt-0.5 font-medium text-foreground">{agent.total_calls.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Conversion</dt>
                    <dd className="num mt-0.5 font-medium text-success">{agent.conversion_rate}%</dd>
                  </div>
                </dl>

                <p className="mt-4 rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs text-muted-foreground">
                  <CircuitBoard className="mr-1.5 inline size-3.5" aria-hidden />
                  {agent.objective || "No objective set"}
                </p>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to="/agents/$agentId" params={{ agentId: agent.id }}>
                      Configure
                    </Link>
                  </Button>
                  <Button
                    variant={agent.status === "Active" ? "ghost" : "default"}
                    size="sm"
                    className="flex-1"
                    disabled={statusMutation.isPending}
                    onClick={() =>
                      statusMutation.mutate({
                        id: agent.id,
                        status: agent.status === "Active" ? "Paused" : "Active",
                      })
                    }
                  >
                    {statusMutation.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : agent.status === "Active" ? "Pause" : "Activate"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
