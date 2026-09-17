import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  CircuitBoard,
  Globe2,
  Mic,
  PhoneCall,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Waves,
  Zap,
  Star,
  Lock,
  Clock,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "VoxSales AI — Autonomous AI Voice Sales Platform" },
      {
        name: "description",
        content:
          "Deploy human-grade AI voice sales agents that cold call, handle objections, qualify leads and book meetings 24/7. 10× your outbound without hiring.",
      },
    ],
  }),
  component: LandingPage,
});

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "10×", label: "More outbound dials", icon: TrendingUp },
  { value: "58.4%", label: "Average connect rate", icon: PhoneCall },
  { value: "<95ms", label: "AI voice response latency", icon: Zap },
  { value: "24/7", label: "Global outbound coverage", icon: Globe2 },
];

const FEATURES = [
  {
    icon: Mic,
    title: "Ultra-Low Latency Voice",
    desc: "Sub-100ms real-time WebRTC audio via LiveKit, Deepgram Nova-2 speech recognition, and Cartesia neural voices. Conversations feel genuinely human.",
    tag: "Voice Engine",
    color: "from-violet-500/20 to-purple-500/10",
    border: "border-violet-500/20",
    iconBg: "bg-violet-500/15 text-violet-400",
  },
  {
    icon: CircuitBoard,
    title: "Mistral AI Sales Intelligence",
    desc: "Powered by Mistral Large with dynamic finite-state sales machines. Handles pricing, timing, and competitor objections without a single hallucination.",
    tag: "Sales Intelligence",
    color: "from-blue-500/20 to-cyan-500/10",
    border: "border-blue-500/20",
    iconBg: "bg-blue-500/15 text-blue-400",
  },
  {
    icon: Users,
    title: "Autonomous CRM Sync",
    desc: "Import CSV leads, run DNC scrubbing, deduplicate contacts, and log all call outcomes instantly to HubSpot, Salesforce, or Zoho.",
    tag: "CRM Automation",
    color: "from-emerald-500/20 to-teal-500/10",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/15 text-emerald-400",
  },
  {
    icon: CalendarCheck,
    title: "Live Calendar Booking",
    desc: "When a prospect qualifies, the AI agent checks AE availability and books calendar slots in real time — right inside the live conversation.",
    tag: "Meeting Booking",
    color: "from-amber-500/20 to-orange-500/10",
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/15 text-amber-400",
  },
  {
    icon: BarChart3,
    title: "Deep Call Intelligence",
    desc: "Every second transcribed, categorized, and scored for buying intent. Auto-generates executive summaries and next-action triggers in real time.",
    tag: "Intelligence",
    color: "from-pink-500/20 to-rose-500/10",
    border: "border-pink-500/20",
    iconBg: "bg-pink-500/15 text-pink-400",
  },
  {
    icon: Globe2,
    title: "Multi-Market Campaigns",
    desc: "Run unified campaigns across North America, Europe, and Asia with native English, Spanish, Hindi, and German AI personas with localized tone.",
    tag: "Global Sales",
    color: "from-indigo-500/20 to-blue-500/10",
    border: "border-indigo-500/20",
    iconBg: "bg-indigo-500/15 text-indigo-400",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Import Leads or Connect CRM",
    desc: "Upload a CSV list or sync HubSpot/Salesforce leads. Automatic phone validation and National DNC compliance checks run instantly.",
    icon: Users,
  },
  {
    step: "02",
    title: "Configure AI Voice Persona",
    desc: "Select a voice, define value propositions, set qualification criteria (BANT), and upload your objection playbooks in plain English.",
    icon: CircuitBoard,
  },
  {
    step: "03",
    title: "Launch Autonomous Campaigns",
    desc: "AI agents dial concurrently, hold human-like conversations, score buying intent in real time, and automatically book meetings.",
    icon: Sparkles,
  },
];

const TESTIMONIALS = [
  {
    quote: "We scaled from 250 dials/day to 3,500 daily dials. Our AE calendars are packed with qualified demos while our CAC dropped by 72%.",
    name: "Prabhash Jain",
    title: "Founder & CEO, Northstar Enterprise",
    role: "B2B SaaS · 14,000+ Dials Monthly",
    initials: "PJ",
    stars: 5,
  },
  {
    quote: "The objection handling is astonishing. When prospects say 'we're happy with our vendor', VoxSales pivots with targeted ROI metrics that consistently earn meetings.",
    name: "Elena Rostova",
    title: "VP Revenue Operations, ScaleFlow Global",
    role: "Fintech · 28 AEs Supported",
    initials: "ER",
    stars: 5,
  },
  {
    quote: "Inbound leads are now contacted within 18 seconds of form submission. Our connect-to-meeting rate jumped to 14.8%.",
    name: "Marcus Sterling",
    title: "Head of Growth, Apex Cloud Systems",
    role: "Cloud Infrastructure · 3.8× Pipeline Growth",
    initials: "MS",
    stars: 5,
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "$399",
    period: "/month",
    desc: "For early-stage teams testing AI outbound.",
    features: [
      "3 AI agent personas",
      "5,000 dials/month",
      "Basic CRM sync (CSV)",
      "Call recordings & transcripts",
      "Email support",
    ],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Scale",
    price: "$899",
    period: "/month",
    desc: "For growing teams running high-volume outbound.",
    features: [
      "10 AI agent personas",
      "25,000 dials/month",
      "HubSpot & Salesforce sync",
      "Live calendar booking",
      "Sentiment & intent scoring",
      "Priority support",
    ],
    cta: "Start free trial",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For sales-led orgs requiring dedicated infrastructure.",
    features: [
      "Unlimited agent personas",
      "Unlimited dials",
      "All CRM integrations",
      "Dedicated LiveKit cluster",
      "Custom voice training",
      "SLA + dedicated CSM",
    ],
    cta: "Book a demo",
    highlight: false,
  },
];

// ─── Interactive Hero Call Widget ─────────────────────────────────────────────

function LiveCallWidget() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [intentScore, setIntentScore] = useState(42);
  const scrollRef = useRef<HTMLDivElement>(null);

  const dialogue = [
    { speaker: "AI", text: "Hi Rahul, this is Alex from VoxSales. I noticed your team is scaling outbound — do you have 30 seconds?", duration: 3500, intent: 48 },
    { speaker: "Prospect", text: "Hey Alex, we do have SDRs, but what makes this different from a standard dialer?", duration: 3000, intent: 62 },
    { speaker: "AI", text: "Great question. Unlike dialers, our agents hold the complete qualification conversation and book meetings directly to your AE's calendar.", duration: 4000, intent: 84 },
    { speaker: "Prospect", text: "Interesting — so the AI fully qualifies them? Can we see a demo this Friday at 3 PM?", duration: 3500, intent: 96 },
    { speaker: "AI", text: "Absolutely! I've placed Friday 3 PM on your calendar and sent a confirmation to your email. Looking forward to it!", duration: 3000, intent: 98 },
  ];

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      const step = dialogue[currentTurn];
      if (step) {
        setIntentScore(step.intent);
        timer = setTimeout(() => {
          if (currentTurn < dialogue.length - 1) {
            setCurrentTurn((p) => p + 1);
          } else {
            setIsPlaying(false);
          }
        }, step.duration);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentTurn]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentTurn]);

  return (
    <div className="relative w-full max-w-lg">
      {/* Glow behind card */}
      <div className="absolute inset-0 -z-10 rounded-3xl bg-violet-500/20 blur-3xl scale-110" />

      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex size-9 items-center justify-center rounded-xl bg-violet-500 shadow-lg">
              <Waves className="size-4 text-white" />
              {isPlaying && (
                <span className="absolute -top-1 -right-1 flex size-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Live Call Simulation</p>
              <p className="text-xs text-white/50">Alex (AI SDR) × Rahul Sharma (VP Sales)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setIsPlaying(false); setCurrentTurn(0); setIntentScore(42); }}
              className="rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
            >
              <RotateCcw className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentTurn >= dialogue.length - 1 && !isPlaying) setCurrentTurn(0);
                setIsPlaying((p) => !p);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-lg transition-all active:scale-95",
                isPlaying
                  ? "bg-white/10 text-white/70 hover:bg-white/20"
                  : "bg-violet-500 text-white hover:bg-violet-400"
              )}
            >
              {isPlaying ? <><Pause className="size-3 fill-current" />Pause</> : <><Play className="size-3 fill-current" />Play demo</>}
            </button>
          </div>
        </div>

        {/* Intent Bar */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-2.5">
          <span className="text-[11px] text-white/40 font-medium">Buying Intent</span>
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                intentScore > 80 ? "bg-emerald-400" : intentScore > 60 ? "bg-amber-400" : "bg-violet-400"
              )}
              style={{ width: `${intentScore}%` }}
            />
          </div>
          <span className={cn(
            "text-xs font-bold tabular-nums",
            intentScore > 80 ? "text-emerald-400" : intentScore > 60 ? "text-amber-400" : "text-violet-400"
          )}>{intentScore}/100</span>
        </div>

        {/* Transcript */}
        <div ref={scrollRef} className="h-52 overflow-y-auto space-y-3 px-5 py-4 scroll-smooth">
          {dialogue.slice(0, currentTurn + 1).map((turn, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2 text-xs animate-in fade-in slide-in-from-bottom-2 duration-300",
                turn.speaker === "Prospect" ? "justify-end" : "justify-start"
              )}
            >
              {turn.speaker === "AI" && (
                <span className="mt-0.5 shrink-0 rounded-md bg-violet-500/30 px-1.5 py-0.5 text-[10px] font-bold text-violet-300 h-fit">AI</span>
              )}
              <p className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed",
                turn.speaker === "AI"
                  ? "rounded-tl-sm bg-white/10 text-white/90"
                  : "rounded-tr-sm border border-emerald-500/30 bg-emerald-500/15 text-emerald-100"
              )}>
                {turn.text}
              </p>
              {turn.speaker === "Prospect" && (
                <span className="mt-0.5 shrink-0 rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 h-fit">Lead</span>
              )}
            </div>
          ))}
          {!isPlaying && currentTurn === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="text-xs text-white/30">Press Play to run the AI call demo</p>
            </div>
          )}
        </div>

        {/* Footer badges */}
        <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
          <span className="flex items-center gap-1.5 text-[11px] text-white/40">
            <CheckCircle2 className="size-3.5 text-emerald-400" /> Calendar synced
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-white/40">
            <Zap className="size-3.5 text-violet-400" /> Sub-100ms LiveKit WebRTC
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Counter ─────────────────────────────────────────────────────────────
function AnimatedStat({ value, label, icon: Icon }: { value: string; label: string; icon: typeof TrendingUp }) {
  return (
    <div className="group flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-sm transition-all hover:border-violet-500/30 hover:bg-white/8">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="size-4 text-violet-400" />
      </div>
      <span className="font-display text-3xl font-extrabold text-white tracking-tight">{value}</span>
      <span className="text-sm text-white/50">{label}</span>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

function LandingPage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <div className="min-h-screen bg-[#080b14] text-white">

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#080b14]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/landing" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-500/25">
              <Waves className="size-4 text-white" />
            </span>
            <span className="font-display text-base font-bold text-white tracking-tight">VoxSales AI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {["Features", "How it Works", "Pricing", "Case Studies"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm text-white/60 transition-colors hover:text-white">
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-1.5">
              Sign in
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-500 active:scale-95"
            >
              Get free demo <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        {/* Background elements */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[700px] rounded-full bg-violet-600/15 blur-[120px]" />
          <div className="absolute top-20 -right-40 size-80 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute bottom-0 -left-20 size-60 rounded-full bg-indigo-600/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl">

          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left copy */}
            <div className="text-center lg:text-left">
              <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl xl:text-7xl">
                AI That Sells.{" "}
                <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  24/7.
                </span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-white/55 md:text-xl max-w-xl mx-auto lg:mx-0">
                Deploy human-grade AI voice agents that cold call, handle objections, qualify leads, and book meetings — entirely autonomously.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 justify-center lg:justify-start">
                {["No hiring", "No training", "No burnout"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/60">
                    <CheckCircle2 className="size-3 text-emerald-400" /> {item}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4 justify-center lg:justify-start">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-violet-500/30 transition-all hover:bg-violet-500 hover:shadow-violet-500/40 hover:scale-105 active:scale-100"
                >
                  Get started free <ArrowRight className="size-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-7 py-3.5 text-base font-semibold text-white/80 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  Sign in
                </Link>
              </div>
            </div>

            {/* Right widget */}
            <div className="flex justify-center lg:justify-end">
              <LiveCallWidget />
            </div>
          </div>
        </div>
      </section>



      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STATS.map((s) => <AnimatedStat key={s.value} {...s} />)}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <span className="inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold text-violet-400 mb-4">
              Platform capabilities
            </span>
            <h2 className="font-display text-4xl font-extrabold text-white md:text-5xl">
              Everything your sales team needs,{" "}
              <span className="text-white/40">handled by AI.</span>
            </h2>
            <p className="mt-4 text-lg text-white/45 max-w-2xl mx-auto">
              From first dial to booked meeting — the entire outbound motion, fully automated.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={cn(
                  "group rounded-2xl border p-6 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-black/30",
                  f.border,
                  `bg-gradient-to-br ${f.color}`
                )}
              >
                <div className={cn("mb-4 inline-flex size-10 items-center justify-center rounded-xl", f.iconBg)}>
                  <f.icon className="size-5" />
                </div>
                <span className="mb-2 inline-block rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                  {f.tag}
                </span>
                <h3 className="mb-2 text-base font-bold text-white">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 md:p-16">
            <div className="mb-14 text-center">
              <span className="inline-block rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400 mb-4">
                Setup in &lt;15 minutes
              </span>
              <h2 className="font-display text-4xl font-extrabold text-white md:text-5xl">
                From zero to first booked meeting
              </h2>
            </div>

            <div className="relative grid gap-8 md:grid-cols-3">
              {/* Connector line */}
              <div className="absolute top-8 left-1/4 right-1/4 hidden h-px bg-gradient-to-r from-violet-500/50 via-blue-500/50 to-emerald-500/50 md:block" style={{ width: "50%", left: "25%" }} />

              {HOW_IT_WORKS.map((step, i) => (
                <div key={step.step} className="relative text-center">
                  <div className={cn(
                    "mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl border shadow-lg",
                    i === 0 ? "bg-violet-500/15 border-violet-500/30 text-violet-400" :
                    i === 1 ? "bg-blue-500/15 border-blue-500/30 text-blue-400" :
                    "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  )}>
                    <step.icon className="size-7" />
                  </div>
                  <div className={cn(
                    "mb-3 inline-block font-display text-5xl font-black opacity-10",
                    i === 0 ? "text-violet-400" : i === 1 ? "text-blue-400" : "text-emerald-400"
                  )}>
                    {step.step}
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">{step.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section id="case-studies" className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-4">
              Customer stories
            </span>
            <h2 className="font-display text-4xl font-extrabold text-white md:text-5xl">
              Real results. Real revenue.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                onClick={() => setActiveTestimonial(i)}
                className={cn(
                  "group cursor-pointer rounded-2xl border p-7 transition-all hover:scale-[1.02]",
                  activeTestimonial === i
                    ? "border-violet-500/40 bg-violet-500/10"
                    : "border-white/8 bg-white/[0.03] hover:border-white/15"
                )}
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="size-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="mb-5 text-sm text-white/70 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3 border-t border-white/8 pt-4">
                  <div className="flex size-9 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <span className="inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-400 mb-4">
              Pricing
            </span>
            <h2 className="font-display text-4xl font-extrabold text-white md:text-5xl">
              Simple, usage-based pricing
            </h2>
            <p className="mt-4 text-lg text-white/45">No setup fees. No per-seat charges. Cancel anytime.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl border p-8 transition-all",
                  plan.highlight
                    ? "border-violet-500/50 bg-gradient-to-b from-violet-500/15 to-violet-500/5 shadow-2xl shadow-violet-500/20 scale-[1.02]"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-violet-500 px-4 py-1 text-xs font-bold text-white shadow-lg">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-1">{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl font-black text-white">{plan.price}</span>
                    {plan.period && <span className="text-sm text-white/40">{plan.period}</span>}
                  </div>
                  <p className="mt-2 text-sm text-white/45">{plan.desc}</p>
                </div>

                <ul className="mb-8 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-sm text-white/70">
                      <CheckCircle2 className={cn("size-4 shrink-0", plan.highlight ? "text-violet-400" : "text-white/30")} />
                      {feat}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/login"
                  className={cn(
                    "block w-full rounded-xl py-3 text-center text-sm font-bold transition-all hover:scale-105 active:scale-100",
                    plan.highlight
                      ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30 hover:bg-violet-400"
                      : "border border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-600/20 via-purple-600/15 to-blue-600/10 p-12 md:p-16 text-center">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 size-80 rounded-full bg-violet-500/20 blur-3xl" />
            </div>

            <div className="relative">
              <Sparkles className="mx-auto mb-6 size-10 text-violet-400" />
              <h2 className="font-display text-4xl font-extrabold text-white md:text-5xl mb-4">
                Ready to 10× your outbound?
              </h2>
              <p className="mb-8 text-lg text-white/50 max-w-xl mx-auto">
                Join 1,200+ sales teams running autonomous AI voice outbound. First 14 days free.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-violet-500/30 transition-all hover:bg-violet-500 hover:shadow-violet-500/40 hover:scale-105"
                >
                  Start free trial <ArrowRight className="size-4" />
                </Link>
                <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white">
                  <CalendarCheck className="size-4" /> Book a live demo
                </button>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/30">
                <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-400" /> SOC-2 Type II</span>
                <span className="flex items-center gap-2"><Lock className="size-4 text-white/30" /> 256-bit TLS</span>
                <span className="flex items-center gap-2"><Award className="size-4 text-amber-400" /> G2 Leader 2024</span>
                <span className="flex items-center gap-2"><Clock className="size-4 text-white/30" /> 99.97% Uptime SLA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="flex size-7 items-center justify-center rounded-lg bg-violet-600">
                  <Waves className="size-3.5 text-white" />
                </span>
                <span className="font-display text-sm font-bold text-white">VoxSales AI</span>
              </div>
              <p className="text-xs text-white/35 leading-relaxed max-w-xs">
                The autonomous AI voice sales platform trusted by 1,200+ teams worldwide.
              </p>
            </div>
            {[
              { heading: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
              { heading: "Company", links: ["About", "Blog", "Careers", "Press"] },
              { heading: "Legal", links: ["Privacy", "Terms", "Security", "DNC Compliance"] },
            ].map((col) => (
              <div key={col.heading}>
                <p className="mb-3 text-xs font-semibold text-white/40 uppercase tracking-widest">{col.heading}</p>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-white/35 hover:text-white/70 transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/25">© 2025 VoxSales AI Inc. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-white/25">
              <a href="#" className="hover:text-white/50 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white/50 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white/50 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
