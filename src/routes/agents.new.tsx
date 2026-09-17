import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2, Mic, Plus, Sparkles } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { agentsApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/agents/new")({
  head: () => ({
    meta: [
      { title: "New AI Agent — Indianvoice.ai" },
      { name: "description", content: "Create a new AI voice sales representative for Hindi, Telugu or English." },
    ],
  }),
  component: NewAgent,
});

const VOICE_OPTIONS = [
  // Indian voices (Sarvam AI)
  { id: "priya", name: "Priya — Hindi Female (Sarvam AI)", provider: "Sarvam AI", lang: "Hindi" },
  { id: "arjun", name: "Arjun — Hindi Male (Sarvam AI)", provider: "Sarvam AI", lang: "Hindi" },
  { id: "ananya", name: "Ananya — Telugu Female (Sarvam AI)", provider: "Sarvam AI", lang: "Telugu" },
  { id: "krishna", name: "Krishna — Telugu Male (Sarvam AI)", provider: "Sarvam AI", lang: "Telugu" },
  { id: "kavya", name: "Kavya — Indian English Female (Sarvam AI)", provider: "Sarvam AI", lang: "English" },
  { id: "aarav", name: "Aarav — Indian English Male (Sarvam AI)", provider: "Sarvam AI", lang: "English" },
  // Fallback voices (ElevenLabs/Cartesia)
  { id: "meera", name: "Meera — Warm Female (ElevenLabs)", provider: "ElevenLabs", lang: "Any" },
  { id: "atlas", name: "Atlas — Calm Male (Cartesia)", provider: "Cartesia", lang: "Any" },
];

const INDUSTRIES = [
  "B2B SaaS",
  "SMB Automation",
  "Real Estate",
  "Healthcare",
  "E-commerce",
  "Fintech",
  "Logistics",
  "Professional Services",
  "Mobility",
  "Other",
];

const LANGUAGES = [
  { value: "hindi", label: "हिंदी (Hindi)", flag: "🇮🇳" },
  { value: "english", label: "English (India)", flag: "🇮🇳" },
  { value: "telugu", label: "తెలుగు (Telugu)", flag: "🇮🇳" },
  { value: "hinglish", label: "Hinglish (Hindi + English)", flag: "🇮🇳" },
  { value: "tamil", label: "தமிழ் (Tamil)", flag: "🇮🇳" },
  { value: "kannada", label: "ಕನ್ನಡ (Kannada)", flag: "🇮🇳" },
  { value: "bengali", label: "বাংলা (Bengali)", flag: "🇮🇳" },
  { value: "marathi", label: "मराठी (Marathi)", flag: "🇮🇳" },
  { value: "gujarati", label: "ગુજરાતી (Gujarati)", flag: "🇮🇳" },
];

const TONES = [
  "Professional, consultative",
  "Friendly, conversational",
  "Assertive, concise",
  "Empathetic, precise",
  "Casual, upbeat",
  "Formal, technical",
];

function NewAgent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [voice, setVoice] = useState("");
  const [industry, setIndustry] = useState("");
  const [objective, setObjective] = useState("");
  const [tone, setTone] = useState("");
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [openingLine, setOpeningLine] = useState("");
  const [qualifyCriteria, setQualifyCriteria] = useState(
    "Qualified when the prospect confirms: (1) they own or influence the budget, (2) the pain is active today, (3) they agree to a demo within 14 days.",
  );

  const createMutation = useMutation({
    mutationFn: () =>
      agentsApi.create({
        name: name.trim(),
        description: description.trim(),
        voice,
        languages,
        industry,
        objective: objective.trim(),
        tone,
        opening_script: openingLine.trim(),
        qualification_criteria: qualifyCriteria.trim(),
      }),
    onSuccess: (agent) => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent created", {
        description: `"${agent.name}" is ready to configure and test.`,
      });
      navigate({ to: "/agents/$agentId", params: { agentId: agent.id } });
    },
    onError: (err: any) => {
      toast.error("Failed to create agent", { description: err?.message });
    },
  });

  const toggleLang = (lang: string) =>
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );

  const isValid =
    name.trim() && description.trim() && voice && industry && objective.trim() && tone;

  return (
    <>
      <Link
        to="/agents"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All agents
      </Link>

      <PageHeader
        title="New AI agent"
        subtitle="Configure voice, objective and personality for your new AI sales representative"
      />

      <div className="mx-auto max-w-2xl space-y-6">
        <SectionCard title="Identity" description="How this agent presents itself on calls">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ag-name">Agent name</Label>
                <Input
                  id="ag-name"
                  className="mt-1.5"
                  placeholder="e.g. Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ag-industry">Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger id="ag-industry" className="mt-1.5">
                    <SelectValue placeholder="Select industry…" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="ag-desc">Role description</Label>
              <Input
                id="ag-desc"
                className="mt-1.5"
                placeholder="e.g. Outbound B2B Sales Representative"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ag-voice">Voice</Label>
                <Select value={voice} onValueChange={setVoice}>
                  <SelectTrigger id="ag-voice" className="mt-1.5">
                    <SelectValue placeholder="Select voice…" />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICE_OPTIONS.map((v) => (
                      <SelectItem key={v.id} value={v.name}>
                        {v.name}
                        <span className="ml-1 text-muted-foreground text-xs">
                          ({v.provider})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ag-tone">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger id="ag-tone" className="mt-1.5">
                    <SelectValue placeholder="Select tone…" />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Languages</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLang(lang)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      languages.includes(lang)
                        ? "border-ai bg-ai-soft text-ai"
                        : "border-border bg-card text-muted-foreground hover:border-ai/40"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Sales strategy" description="The agent's objective and conversation approach">
          <div className="space-y-4">
            <div>
              <Label htmlFor="ag-objective">Objective</Label>
              <Input
                id="ag-objective"
                className="mt-1.5"
                placeholder="e.g. Book qualified discovery calls"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ag-opening">Opening line template</Label>
              <Textarea
                id="ag-opening"
                className="mt-1.5"
                rows={2}
                placeholder={`Hi {{first_name}}, this is ${name || "Alex"} calling. I'll be quick — do you have thirty seconds?`}
                value={openingLine}
                onChange={(e) => setOpeningLine(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Use <code className="bg-neutral-soft px-1 py-0.5 rounded text-xs">{"{{first_name}}"}</code> as a variable.
              </p>
            </div>
            <div>
              <Label htmlFor="ag-qualify">Qualification criteria</Label>
              <Textarea
                id="ag-qualify"
                className="mt-1.5"
                rows={3}
                value={qualifyCriteria}
                onChange={(e) => setQualifyCriteria(e.target.value)}
              />
            </div>
          </div>
        </SectionCard>

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" asChild>
            <Link to="/playground">
              <Mic className="size-4" /> Test a voice first
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/agents">Cancel</Link>
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!isValid || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {createMutation.isPending ? "Creating…" : "Create agent"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
