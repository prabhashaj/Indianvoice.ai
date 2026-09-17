import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CalendarClock, Check, Loader2, Sparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { agentsApi, campaignsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/campaigns/new")({
  head: () => ({
    meta: [
      { title: "New campaign — Indianvoice.ai" },
      { name: "description", content: "Create a new AI voice sales campaign." },
    ],
  }),
  component: NewCampaign,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TIMEZONES = [
  "Asia/Kolkata",
  "America/Los_Angeles",
  "America/New_York",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

type Step = 1 | 2 | 3;

const stepLabels: Record<Step, string> = {
  1: "Campaign details",
  2: "Schedule",
  3: "Review & launch",
};

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {([1, 2, 3] as Step[]).map((step) => (
        <div key={step} className="flex items-center gap-2">
          <span
            className={cn(
              "grid size-7 place-items-center rounded-full text-xs font-semibold border transition-colors",
              step < current
                ? "bg-success border-success text-success-foreground"
                : step === current
                  ? "bg-ai border-ai text-ai-foreground"
                  : "bg-card border-border text-muted-foreground",
            )}
          >
            {step < current ? <Check className="size-3.5" /> : step}
          </span>
          <span
            className={cn(
              "text-xs font-medium hidden sm:block",
              step === current ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {stepLabels[step]}
          </span>
          {step < 3 && <div className="h-px w-6 bg-border" />}
        </div>
      ))}
    </div>
  );
}

function NewCampaign() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>(1);

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () => agentsApi.list(),
    staleTime: 60_000,
  });

  // Step 1 state
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [audience, setAudience] = useState("");
  const [agentId, setAgentId] = useState("");

  // Step 2 state
  const [days, setDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  const toggleDay = (day: string) =>
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const createMutation = useMutation({
    mutationFn: () =>
      campaignsApi.create({
        name: name.trim(),
        agent_id: agentId || null,
        audience: audience.trim(),
        objective: objective.trim(),
        status: "Draft",
        schedule: { days, start, end, timezone },
      }),
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign created", {
        description: `"${campaign.name}" is ready. Add leads to get started.`,
      });
      navigate({ to: "/campaigns/$campaignId", params: { campaignId: campaign.id } });
    },
    onError: (err: any) => toast.error("Failed to create campaign", { description: err?.message }),
  });

  const step1Valid = name.trim() && objective.trim() && audience.trim();
  const step2Valid = days.length > 0 && start && end;

  return (
    <>
      <Link
        to="/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All campaigns
      </Link>

      <PageHeader
        title="New campaign"
        subtitle="Configure your AI voice campaign in three steps"
      />

      <div className="mx-auto max-w-2xl">
        <StepIndicator current={step} />

        {step === 1 && (
          <SectionCard
            title="Campaign details"
            description="Name your campaign, set its objective and pick an AI agent"
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="camp-name">Campaign name</Label>
                <Input
                  id="camp-name"
                  className="mt-1.5"
                  placeholder="e.g. Q4 SaaS Outreach"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="camp-audience">Target audience</Label>
                <Input
                  id="camp-audience"
                  className="mt-1.5"
                  placeholder="e.g. B2B SaaS companies, 50–500 employees"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="camp-objective">Objective</Label>
                <Textarea
                  id="camp-objective"
                  className="mt-1.5"
                  rows={3}
                  placeholder="What should the agent achieve on each call? e.g. Book a 20-minute discovery demo."
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="camp-agent">AI agent</Label>
                <Select value={agentId} onValueChange={setAgentId}>
                  <SelectTrigger id="camp-agent" className="mt-1.5">
                    <SelectValue placeholder="Select an agent…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No agent (assign later)</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} — {a.description || a.industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!step1Valid}
                >
                  Next: Schedule <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </SectionCard>
        )}

        {step === 2 && (
          <SectionCard
            title="Calling schedule"
            description="Set the days and hours your campaign dials"
          >
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">Active days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        days.includes(d)
                          ? "border-ai bg-ai-soft text-ai"
                          : "border-border bg-card text-muted-foreground hover:border-ai/40",
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="camp-start">Start time</Label>
                  <Input
                    id="camp-start"
                    type="time"
                    className="mt-1.5"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="camp-end">End time</Label>
                  <Input
                    id="camp-end"
                    type="time"
                    className="mt-1.5"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="camp-tz">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="camp-tz" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="size-4" /> Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!step2Valid}>
                  Next: Review <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </SectionCard>
        )}

        {step === 3 && (
          <SectionCard title="Review & launch" description="Confirm your campaign settings">
            <div className="space-y-4">
              <dl className="divide-y divide-border rounded-xl border border-border text-sm overflow-hidden">
                {[
                  { label: "Name", value: name },
                  { label: "Audience", value: audience },
                  { label: "Objective", value: objective },
                  {
                    label: "Agent",
                    value: agentId
                      ? agents.find((a) => a.id === agentId)?.name ?? agentId
                      : "Not assigned (assign later)",
                  },
                  { label: "Days", value: days.join(", ") },
                  { label: "Hours", value: `${start} – ${end}` },
                  { label: "Timezone", value: timezone },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-4 px-4 py-3">
                    <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
                    <dd className="font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-xs text-warning-foreground flex gap-2">
                <CalendarClock className="size-4 shrink-0 mt-0.5" />
                <span>
                  The campaign will be saved as a <strong>Draft</strong>. Import leads and click Launch to start dialling.
                </span>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="size-4" /> Back
                </Button>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {createMutation.isPending ? "Creating…" : "Create campaign"}
                </Button>
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </>
  );
}
