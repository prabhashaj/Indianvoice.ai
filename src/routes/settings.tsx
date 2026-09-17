import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, CheckCircle2, Link2, Link2Off, Phone, Shield, Sparkles, Users, Waves, Zap } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/common/StatusBadge";
import { authApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — VoxSales AI" },
      {
        name: "description",
        content: "Manage workspace settings, team members, API integrations and voice configuration.",
      },
    ],
  }),
  component: SettingsPage,
});

type Tab = "workspace" | "team" | "integrations" | "voice";

const TAB_CONFIG: Array<{ id: Tab; label: string; icon: typeof Building2 }> = [
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "team", label: "Team", icon: Users },
  { id: "integrations", label: "Integrations", icon: Zap },
  { id: "voice", label: "Voice & API", icon: Shield },
];

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("workspace");

  const { data: me } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
    staleTime: Infinity,
    retry: false,
  });

  const workspaceName = "My Workspace";
  const [workspaceInput, setWorkspaceInput] = useState(workspaceName);



  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your workspace, team, integrations and API configuration"
      />

      <div className="flex gap-1 rounded-xl border border-border bg-card p-1 w-fit shadow-card">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              activeTab === id
                ? "bg-ai text-ai-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Workspace settings */}
      {activeTab === "workspace" && (
        <div className="max-w-xl space-y-6">
          <SectionCard title="Workspace information" description="Basic details about your account">
            <div className="space-y-4">
              <div>
                <Label htmlFor="ws-name">Workspace name</Label>
                <Input
                  id="ws-name"
                  className="mt-1.5"
                  value={workspaceInput}
                  onChange={(e) => setWorkspaceInput(e.target.value)}
                />
              </div>
              <div>
                <Label>Plan</Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <StatusBadge status="Active" />
                  <span className="text-sm font-medium text-foreground">Pro Plan</span>
                </div>
              </div>
              <div>
                <Label>Usage this month</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Call minutes</span>
                    <span className="num">8,412 / 12,000</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-soft">
                    <div className="h-full w-[70%] rounded-full bg-ai" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">70% used · 3,588 minutes remaining</p>
                </div>
              </div>
              <Button
                onClick={() => toast.success("Workspace settings saved")}
              >
                Save changes
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Danger zone" description="Irreversible actions">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => toast.error("Contact support to delete your workspace.")}
            >
              Delete workspace
            </Button>
          </SectionCard>
        </div>
      )}

      {/* Team settings */}
      {activeTab === "team" && (
        <div className="max-w-2xl space-y-6">
          <SectionCard title="Team members" description="Manage who has access to this workspace" padded={false}>
            <ul className="divide-y divide-border">
              {me ? (
                <li className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-lg bg-ai-soft text-xs font-bold text-ai">
                      {me.full_name.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{me.full_name}</p>
                      <p className="text-xs text-muted-foreground">{me.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status="Active" dot={false} />
                    <span className="text-xs font-medium text-foreground capitalize">{me.role}</span>
                  </div>
                </li>
              ) : (
                <li className="px-5 py-4 text-sm text-muted-foreground">Loading…</li>
              )}
            </ul>
            <div className="border-t border-border px-5 py-4">
              <Button variant="outline" size="sm" onClick={() => toast.info("Invite team members via the owner dashboard.")}>
                <Users className="size-3.5" /> Invite team member
              </Button>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Integrations */}
      {activeTab === "integrations" && (
        <div className="max-w-2xl space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { id: "livekit", name: "LiveKit", category: "Voice", description: "Real-time WebRTC audio for AI calls", connected: true },
              { id: "twilio", name: "Twilio", category: "Telephony", description: "Outbound SIP calling and phone numbers", connected: false },
              { id: "deepgram", name: "Deepgram", category: "STT", description: "Speech-to-text transcription engine", connected: true },
              { id: "cartesia", name: "Cartesia", category: "TTS", description: "Ultra-low latency text-to-speech voices", connected: true },
              { id: "mistral", name: "Mistral AI", category: "LLM", description: "Conversational AI brain for agents", connected: true },
              { id: "n8n", name: "n8n", category: "Automation", description: "Workflow automation and CRM sync", connected: false },
            ].map((integration) => (
              <div
                key={integration.id}
                className={cn(
                  "rounded-xl border bg-card p-4 shadow-card transition-all",
                  integration.connected
                    ? "border-success/30 hover:shadow-raised"
                    : "border-border hover:border-ai/20",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{integration.name}</p>
                      <span className="text-[10px] rounded-md border border-border px-1.5 py-0.5 text-muted-foreground">
                        {integration.category}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {integration.description}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg",
                      integration.connected
                        ? "bg-success-soft text-success"
                        : "bg-neutral-soft text-muted-foreground",
                    )}
                  >
                    {integration.connected ? (
                      <Link2 className="size-4" />
                    ) : (
                      <Link2Off className="size-4" />
                    )}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <StatusBadge
                    status={integration.connected ? "Active" : "Draft"}
                    dot
                  />
                  <Button
                    variant={integration.connected ? "outline" : "default"}
                    size="sm"
                    onClick={() => {
                      toast.info(
                        integration.connected
                          ? `Configure ${integration.name} in .env to disconnect`
                          : `Add ${integration.name} API key to .env to connect`,
                      );
                    }}
                  >
                    {integration.connected ? "Configured" : "Connect"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Voice & API */}
      {activeTab === "voice" && (
        <div className="max-w-2xl space-y-6">
          {/* LiveKit Cloud */}
          <SectionCard
            title="LiveKit Cloud infrastructure"
            description="Real-time WebRTC audio streaming, rooms, and participant sessions"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">LiveKit Cloud Active & Connected</p>
                    <p className="text-[11px] text-muted-foreground">Region: Global Edge · Sub-100ms WebRTC</p>
                  </div>
                </div>
                <StatusBadge status="Active" />
              </div>

              <div>
                <Label htmlFor="lk-url">LiveKit Server URL</Label>
                <Input
                  id="lk-url"
                  type="url"
                  readOnly
                  className="mt-1.5 font-mono text-xs bg-surface-muted cursor-default"
                  defaultValue="wss://voxsales-4u9sv3pw.livekit.cloud"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="lk-key">API Key</Label>
                  <Input
                    id="lk-key"
                    type="text"
                    readOnly
                    className="mt-1.5 font-mono text-xs bg-surface-muted cursor-default"
                    defaultValue="APIPvxPVE5gYDVF"
                  />
                </div>
                <div>
                  <Label htmlFor="lk-secret">API Secret</Label>
                  <Input
                    id="lk-secret"
                    type="password"
                    readOnly
                    className="mt-1.5 font-mono text-xs bg-surface-muted cursor-default"
                    defaultValue="szGaamxGrDczSkHfRDMWEoOPF8icWyduU4GBq53zRsT"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Telephony & PSTN */}
          <SectionCard
            title="Telephony & Phone Numbers"
            description="PSTN calling, Twilio integration, and LiveKit mobile SIP trunking"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/10 px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Phone className="size-4 text-primary" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Twilio PSTN Outbound & Inbound Active</p>
                    <p className="text-[11px] text-muted-foreground">Account: My First Twilio Account · 74 mins remaining</p>
                  </div>
                </div>
                <StatusBadge status="Active" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="tw-phone">Caller ID / Phone Number</Label>
                  <Input
                    id="tw-phone"
                    readOnly
                    className="mt-1.5 font-mono text-xs font-semibold text-foreground bg-surface-muted cursor-default"
                    defaultValue="+1 (737) 250-8034"
                  />
                </div>
                <div>
                  <Label htmlFor="tw-sid">Twilio Account SID</Label>
                  <Input
                    id="tw-sid"
                    readOnly
                    className="mt-1.5 font-mono text-xs bg-surface-muted cursor-default"
                    defaultValue="AC17b8e1...017988"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">LiveKit Mobile / SIP Trunking</span>
                  <span className="text-emerald-500 font-medium">Ready</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Free LiveKit mobile numbers and SIP trunks can be bridged directly to AI voice sessions without carrier charges.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Mistral AI Reasoning */}
          <SectionCard title="LLM Intelligence" description="Mistral AI conversational reasoning engine">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-ai/20 bg-ai/10 px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="size-4 text-ai" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Mistral Large Connected</p>
                    <p className="text-[11px] text-muted-foreground">Low-latency sales state machine execution</p>
                  </div>
                </div>
                <StatusBadge status="Active" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="mistral-key">Mistral API Key</Label>
                  <Input
                    id="mistral-key"
                    type="password"
                    readOnly
                    className="mt-1.5 font-mono text-xs bg-surface-muted cursor-default"
                    defaultValue="ySFMCW5TuVGVZoOiTRHsjegelkOgngf0"
                  />
                </div>
                <div>
                  <Label htmlFor="mistral-model">Model</Label>
                  <Input
                    id="mistral-model"
                    readOnly
                    className="mt-1.5 font-mono text-xs bg-surface-muted cursor-default"
                    defaultValue="mistral-large-latest"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* TTS / STT */}
          <SectionCard title="Voice Synthesis & Recognition" description="Speech-to-text and text-to-speech engines">
            <div className="space-y-3 text-sm text-muted-foreground">
              {[
                {
                  label: "Speech-to-Text (STT)",
                  value: "Deepgram Nova-2 (Key: 65112fb3...)",
                  status: "Active",
                  desc: "Sub-300ms transcription with continuous interim results",
                },
                {
                  label: "Text-to-Speech (TTS)",
                  value: "Cartesia Sonic (Key: sk_car_Rqzqp...)",
                  status: "Active",
                  desc: "Ultra low-latency conversational neural voices (Elise, Layan, Albin)",
                },
                {
                  label: "Voice Activity Detection",
                  value: "Silero VAD (LiveKit built-in)",
                  status: "Active",
                  desc: "Edge-based speech end-of-turn detection",
                },
              ].map(({ label, value, status, desc }) => (
                <div key={label} className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-surface-muted/30 p-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-foreground/80 font-mono">{value}</p>
                    <p className="text-[11px] text-muted-foreground">{desc}</p>
                  </div>
                  <StatusBadge status={status} />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </>
  );
}
