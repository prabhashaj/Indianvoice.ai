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
  MessageCircle,
  Languages,
  IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "Indianvoice.ai — India's #1 AI Voice Sales Platform" },
      {
        name: "description",
        content:
          "Deploy AI voice agents that speak Hindi, Telugu & English natively. Beat targets with TRAI-compliant outbound calling at ₹0.30/min via Exotel. Built for Bharat.",
      },
    ],
  }),
  component: LandingPage,
});

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "10×", label: "More outbound dials", icon: TrendingUp },
  { value: "₹0.30", label: "Per minute via Exotel", icon: IndianRupee },
  { value: "<95ms", label: "AI voice latency", icon: Zap },
  { value: "3", label: "Indian languages natively", icon: Languages },
];

const FEATURES = [
  {
    icon: Languages,
    title: "Hindi, Telugu & English Natively",
    desc: "Powered by Sarvam AI — the only Indian-built voice platform that truly understands Hinglish code-switching, Telugu accents, and Indian English. Not just translation, but true native understanding.",
    tag: "Indian Languages",
    color: "from-orange-500/20 to-amber-500/10",
    border: "border-orange-500/20",
    iconBg: "bg-orange-500/15 text-orange-400",
  },
  {
    icon: PhoneCall,
    title: "Exotel Native Telephony",
    desc: "Direct PSTN calls via Exotel India at ₹0.30/min — 10× cheaper than Twilio. Indian caller IDs (+91), Jio/Airtel/BSNL/Vi routing, and sub-200ms local call latency.",
    tag: "Indian Telephony",
    color: "from-violet-500/20 to-purple-500/10",
    border: "border-violet-500/20",
    iconBg: "bg-violet-500/15 text-violet-400",
  },
  {
    icon: ShieldCheck,
    title: "TRAI & NDNC Compliant",
    desc: "Automatic DND/NDNC registry scrubbing before every call. 9AM–9PM IST calling windows enforced. DPDP Act 2023 data handling. One-click consent management. Stay legal.",
    tag: "TRAI Compliance",
    color: "from-emerald-500/20 to-teal-500/10",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/15 text-emerald-400",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Follow-ups",
    desc: "Automatically send post-call WhatsApp messages to every prospect — call summaries, meeting links, and reminders. 500M+ Indians use WhatsApp daily. Use it.",
    tag: "WhatsApp",
    color: "from-green-500/20 to-emerald-500/10",
    border: "border-green-500/20",
    iconBg: "bg-green-500/15 text-green-400",
  },
  {
    icon: CalendarCheck,
    title: "Live Calendar Booking",
    desc: "When a prospect qualifies, the AI agent checks availability and books calendar slots in real time — right inside the live conversation, in Hindi or English.",
    tag: "Meeting Booking",
    color: "from-amber-500/20 to-orange-500/10",
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/15 text-amber-400",
  },
  {
    icon: BarChart3,
    title: "Deep Call Intelligence",
    desc: "Every second transcribed, categorized, and scored for buying intent. Auto-generates Hindi/English summaries and next-action triggers. Know exactly what was said.",
    tag: "Intelligence",
    color: "from-pink-500/20 to-rose-500/10",
    border: "border-pink-500/20",
    iconBg: "bg-pink-500/15 text-pink-400",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Import Leads or Connect CRM",
    desc: "Upload a CSV of Indian leads or sync from HubSpot/Zoho. Automatic phone validation, DND scrubbing against TRAI NDNC registry, and timezone-aware scheduling run instantly.",
    icon: Users,
  },
  {
    step: "02",
    title: "Configure AI Voice Persona",
    desc: "Pick Hindi, Telugu or English. Choose an Indian-accent voice. Define your pitch, objection playbook, and qualification criteria in plain language — no code needed.",
    icon: CircuitBoard,
  },
  {
    step: "03",
    title: "Launch TRAI-Compliant Campaigns",
    desc: "AI agents dial via Exotel, hold natural conversations in the prospect's preferred language, and automatically book meetings or send WhatsApp follow-ups.",
    icon: Sparkles,
  },
];

const TESTIMONIALS = [
  {
    quote: "Hamari team roz 3,500 calls karti hai bina ek bhi SDR ke. Hindi mein baat karta hai bilkul aadmi jaisa. CAC 72% kam ho gayi.",
    name: "Prabhash Reddy",
    title: "Founder & CEO, Northstar Ventures",
    role: "B2B SaaS · Hyderabad · 14,000+ Dials/Month",
    initials: "PR",
    stars: 5,
    lang: "हिंदी",
  },
  {
    quote: "Telugu lo matladu tundi — prospects chala surprised avutunnaru. Connect rate 58% ki vachindi. Vapi try chesamu but India lo pani chesedi kadu.",
    name: "Venkata Suresh",
    title: "VP Sales, AgriTech Solutions",
    role: "AgriTech · Vijayawada · Telugu Campaigns",
    initials: "VS",
    stars: 5,
    lang: "తెలుగు",
  },
  {
    quote: "Inbound leads are contacted within 18 seconds of form submission. Our connect-to-meeting rate jumped to 14.8%. Exotel integration means ₹0.30/min, not ₹4.",
    name: "Nisha Kapoor",
    title: "Head of Growth, FinTech Startup",
    role: "Fintech · Mumbai · 3.8× Pipeline Growth",
    initials: "NK",
    stars: 5,
    lang: "English",
  },
];

const PRICING = [
  {
    name: "Startup",
    price: "₹9,999",
    period: "/month",
    desc: "For early-stage Indian teams testing AI outbound.",
    features: [
      "3 AI agent personas",
      "5,000 dials/month via Exotel",
      "Hindi + English voice",
      "TRAI DND auto-scrubbing",
      "Call recordings & transcripts",
      "Email support",
    ],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Growth",
    price: "₹29,999",
    period: "/month",
    desc: "For growing Indian teams running high-volume outbound.",
    features: [
      "10 AI agent personas",
      "25,000 dials/month via Exotel",
      "Hindi + Telugu + English",
      "WhatsApp follow-ups",
      "Zoho & HubSpot sync",
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
    desc: "For Indian enterprises requiring dedicated infrastructure.",
    features: [
      "Unlimited agent personas",
      "Unlimited dials",
      "All 3 Indian languages",
      "Custom voice training",
      "Dedicated LiveKit cluster",
      "Salesforce / SAP integration",
      "DPDP Act compliance audit",
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
  const [activeLanguage, setActiveLanguage] = useState<"hindi" | "telugu" | "english">("hindi");
  const scrollRef = useRef<HTMLDivElement>(null);

  const dialogues = {
    hindi: [
      { speaker: "AI", text: "Namaste Rahul ji! Main Priya hun Indianvoice.ai se. Bas 30 seconds chahiye — kya aap apni sales team ke liye kuch better karna chahenge?", duration: 4000, intent: 48 },
      { speaker: "Prospect", text: "Haan, batao. Abhi hamare SDRs manually call karte hain, bahut time waste hota hai.", duration: 3000, intent: 65 },
      { speaker: "AI", text: "Bilkul samajh gaya. Hamare AI agents Hindi mein full qualification conversation karte hain aur meeting book kar dete hain — aapke AE ko bas close karna hota hai.", duration: 4000, intent: 82 },
      { speaker: "Prospect", text: "Yeh interesting hai. Kya ek demo dekh sakte hain is Friday ko?", duration: 3000, intent: 94 },
      { speaker: "AI", text: "Zaroor! Friday 3 baje confirm kar diya. Calendar invite aapke email pe aa jayega. Bahut shukriya Rahul ji!", duration: 3000, intent: 98 },
    ],
    telugu: [
      { speaker: "AI", text: "Namaskaram! Nenu Priya, Indianvoice.ai nunchi. Mee sales team kosam 30 seconds matladatama?", duration: 4000, intent: 48 },
      { speaker: "Prospect", text: "Cheppandi. Maa team chala time manual calls ki waste chestundi.", duration: 3000, intent: 62 },
      { speaker: "AI", text: "Artham chesukunnanu. Maa AI agents Telugu lo matladi leads qualify chesi meetings book chestai — completely automatic ga.", duration: 4000, intent: 84 },
      { speaker: "Prospect", text: "Baagundi. Demo choodaniki interest ga unnanu. Friday avutunda?", duration: 3000, intent: 96 },
      { speaker: "AI", text: "Avunu! Friday 3PM confirm chesamu. Calendar invite mee email ki vastundi. Dhanyavaadamulu!", duration: 3000, intent: 98 },
    ],
    english: [
      { speaker: "AI", text: "Hi Rahul! This is Priya from Indianvoice.ai. Quick question — how many SDRs does your team have for outbound today?", duration: 3500, intent: 48 },
      { speaker: "Prospect", text: "We have 5 SDRs but they spend most of their time just dialing. What makes you different?", duration: 3000, intent: 62 },
      { speaker: "AI", text: "Unlike dialers, our AI agents hold the complete Hindi/English qualification conversation and book meetings directly — all via Exotel at ₹0.30/min.", duration: 4000, intent: 84 },
      { speaker: "Prospect", text: "That's impressive. Can we schedule a demo this Friday at 3 PM?", duration: 3500, intent: 96 },
      { speaker: "AI", text: "Absolutely! Friday 3 PM is confirmed. You'll receive a calendar invite shortly. Looking forward to it!", duration: 3000, intent: 98 },
    ],
  };

  const dialogue = dialogues[activeLanguage];

  useEffect(() => {
    setCurrentTurn(0);
    setIntentScore(42);
    setIsPlaying(false);
  }, [activeLanguage]);

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
  }, [isPlaying, currentTurn, dialogue]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentTurn]);

  const langLabels = { hindi: "हिंदी", telugu: "తెలుగు", english: "English" };

  return (
    <div className="relative w-full max-w-lg">
      {/* Glow behind card */}
      <div className="absolute inset-0 -z-10 rounded-3xl bg-orange-500/15 blur-3xl scale-110" />

      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden">
        {/* Language Selector */}
        <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
          <Languages className="size-3.5 text-white/40 mr-1" />
          {(["hindi", "telugu", "english"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveLanguage(lang)}
              className={cn(
                "rounded-lg px-3 py-1 text-[11px] font-bold transition-all",
                activeLanguage === lang
                  ? "bg-orange-500 text-white shadow"
                  : "text-white/40 hover:text-white hover:bg-white/10"
              )}
            >
              {langLabels[lang]}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Exotel Live
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex size-9 items-center justify-center rounded-xl bg-orange-500 shadow-lg">
              <Waves className="size-4 text-white" />
              {isPlaying && (
                <span className="absolute -top-1 -right-1 flex size-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Live Call Demo</p>
              <p className="text-xs text-white/50">Priya (AI Agent) × Rahul Sharma</p>
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
                  : "bg-orange-500 text-white hover:bg-orange-400"
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
                intentScore > 80 ? "bg-emerald-400" : intentScore > 60 ? "bg-amber-400" : "bg-orange-400"
              )}
              style={{ width: `${intentScore}%` }}
            />
          </div>
          <span className={cn(
            "text-xs font-bold tabular-nums",
            intentScore > 80 ? "text-emerald-400" : intentScore > 60 ? "text-amber-400" : "text-orange-400"
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
                <span className="mt-0.5 shrink-0 rounded-md bg-orange-500/30 px-1.5 py-0.5 text-[10px] font-bold text-orange-300 h-fit">AI</span>
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
              <p className="text-xs text-white/30">Select a language and press Play</p>
            </div>
          )}
        </div>

        {/* Footer badges */}
        <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
          <span className="flex items-center gap-1.5 text-[11px] text-white/40">
            <ShieldCheck className="size-3.5 text-emerald-400" /> TRAI Compliant
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-white/40">
            <IndianRupee className="size-3.5 text-orange-400" /> ₹0.30/min via Exotel
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Counter ─────────────────────────────────────────────────────────────
function AnimatedStat({ value, label, icon: Icon }: { value: string; label: string; icon: typeof TrendingUp }) {
  return (
    <div className="group flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-sm transition-all hover:border-orange-500/30 hover:bg-white/8">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="size-4 text-orange-400" />
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
            <span className="flex size-8 items-center justify-center rounded-xl bg-orange-600 shadow-lg shadow-orange-500/25">
              <Waves className="size-4 text-white" />
            </span>
            <span className="font-display text-base font-bold text-white tracking-tight">Indianvoice<span className="text-orange-400">.ai</span></span>
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
              className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-500 active:scale-95"
            >
              Free demo <ArrowRight className="size-3.5" />
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
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[700px] rounded-full bg-orange-600/12 blur-[120px]" />
          <div className="absolute top-20 -right-40 size-80 rounded-full bg-amber-600/10 blur-3xl" />
          <div className="absolute bottom-0 -left-20 size-60 rounded-full bg-orange-600/8 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          {/* Trust badge */}
          <div className="flex justify-center lg:justify-start mb-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold text-orange-400">
              🇮🇳 Built for Bharat — India's #1 AI Voice Platform
            </span>
          </div>

          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left copy */}
            <div className="text-center lg:text-left">
              <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl xl:text-7xl">
                AI Calls India.{" "}
                <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
                  In Hindi.
                </span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-white/55 md:text-xl max-w-xl mx-auto lg:mx-0">
                Deploy AI voice agents that speak <strong className="text-white/80">Hindi, Telugu & English</strong> natively. TRAI-compliant outbound calling at ₹0.30/min via Exotel. No code needed.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 justify-center lg:justify-start">
                {["TRAI Compliant", "Exotel India", "Sarvam AI"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/60">
                    <CheckCircle2 className="size-3 text-emerald-400" /> {item}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4 justify-center lg:justify-start">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-orange-500/30 transition-all hover:bg-orange-500 hover:shadow-orange-500/40 hover:scale-105 active:scale-100"
                >
                  शुरू करें — Free <ArrowRight className="size-4" />
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
            <span className="inline-block rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold text-orange-400 mb-4">
              Platform capabilities
            </span>
            <h2 className="font-display text-4xl font-extrabold text-white md:text-5xl">
              Everything your sales team needs,{" "}
              <span className="text-white/40">for India.</span>
            </h2>
            <p className="mt-4 text-lg text-white/45 max-w-2xl mx-auto">
              From first dial to booked meeting — in Hindi, Telugu, or English. Fully automated, fully TRAI-compliant.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={cn(
                  "group rounded-2xl border bg-gradient-to-br p-6 transition-all hover:shadow-lg",
                  f.color,
                  f.border
                )}
              >
                <div className={cn("mb-4 inline-flex size-11 items-center justify-center rounded-xl", f.iconBg)}>
                  <f.icon className="size-5" />
                </div>
                <div className="mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{f.tag}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <span className="inline-block rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold text-orange-400 mb-4">
              How it works
            </span>
            <h2 className="font-display text-4xl font-extrabold text-white md:text-5xl">
              Live in 30 minutes.{" "}
              <span className="text-white/40">Seriously.</span>
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="rounded-2xl border border-white/8 bg-white/3 p-7">
                <div className="mb-5 flex items-center gap-3">
                  <span className="font-display text-4xl font-extrabold text-orange-500/30">{step.step}</span>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10">
                    <step.icon className="size-4 text-orange-400" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRAI Compliance Banner ─────────────────────────────────────────── */}
      <section className="py-12 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
            <ShieldCheck className="size-10 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">100% TRAI & DPDP Act Compliant</h3>
            <p className="text-white/50 max-w-xl mx-auto mb-6">
              Automatic NDNC/DND registry scrubbing. Strict 9AM–9PM IST calling windows. DPDP Act 2023 data handling. One-click opt-out management. Never get fined again.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {["TRAI NDNC Scrubbing", "9AM–9PM IST Enforced", "DPDP Act 2023", "Auto Opt-out", "Call Frequency Limits"].map((item) => (
                <span key={item} className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                  <CheckCircle2 className="size-3" /> {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials / Case Studies ───────────────────────────────────── */}
      <section id="case-studies" className="py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-14 text-center">
            <span className="inline-block rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold text-orange-400 mb-4">
              Customer stories
            </span>
            <h2 className="font-display text-4xl font-extrabold text-white md:text-5xl">
              Indian teams love it.
            </h2>
          </div>

          {/* Testimonial tabs */}
          <div className="flex justify-center gap-2 mb-8">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveTestimonial(i)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-bold transition-all",
                  activeTestimonial === i
                    ? "bg-orange-500 text-white"
                    : "border border-white/10 text-white/40 hover:text-white"
                )}
              >
                {t.lang}
              </button>
            ))}
          </div>

          {/* Active testimonial */}
          {(() => {
            const t = TESTIMONIALS[activeTestimonial];
            return (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 md:p-10 text-center">
                <div className="flex justify-center gap-0.5 mb-6">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-lg md:text-xl text-white/80 leading-relaxed font-medium mb-8">
                  "{t.quote}"
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-orange-500/20 text-sm font-bold text-orange-300">
                    {t.initials}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-white/40">{t.title}</p>
                    <p className="text-xs text-orange-400/70">{t.role}</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <span className="inline-block rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold text-orange-400 mb-4">
              India-first pricing
            </span>
            <h2 className="font-display text-4xl font-extrabold text-white md:text-5xl">
              Priced for Bharat.
            </h2>
            <p className="mt-4 text-white/45 text-lg">All plans include TRAI compliance + Exotel India telephony.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl border p-7 flex flex-col",
                  plan.highlight
                    ? "border-orange-500/50 bg-gradient-to-b from-orange-500/10 to-transparent shadow-xl shadow-orange-500/10"
                    : "border-white/10 bg-white/3"
                )}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3.5 py-1 text-[11px] font-bold text-white shadow-lg">
                    {plan.badge}
                  </span>
                )}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-white/40">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/40">{plan.desc}</p>
                </div>
                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className={cn(
                    "block rounded-xl py-2.5 text-center text-sm font-bold transition-all hover:scale-105",
                    plan.highlight
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-400"
                      : "border border-white/15 text-white/70 hover:border-white/30 hover:text-white"
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="rounded-3xl border border-orange-500/20 bg-gradient-to-b from-orange-500/10 to-transparent p-12 md:p-16">
            <span className="text-4xl mb-4 block">🇮🇳</span>
            <h2 className="font-display text-4xl font-extrabold text-white md:text-5xl mb-4">
              India ka AI Sales Platform.
            </h2>
            <p className="text-lg text-white/50 mb-8 max-w-xl mx-auto">
              Deploy your first Hindi AI calling campaign in 30 minutes. No code, no credit card.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-orange-500/30 transition-all hover:bg-orange-400 hover:scale-105"
            >
              अभी शुरू करें — Free <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-orange-600">
              <Waves className="size-3.5 text-white" />
            </span>
            <span className="font-display text-sm font-bold text-white">Indianvoice<span className="text-orange-400">.ai</span></span>
          </div>
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} Indianvoice.ai. Built for Bharat. TRAI compliant. Powered by Sarvam AI + Exotel.
          </p>
          <div className="flex gap-4">
            {["Privacy", "Terms", "Contact"].map((link) => (
              <a key={link} href="#" className="text-xs text-white/30 hover:text-white transition-colors">{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
