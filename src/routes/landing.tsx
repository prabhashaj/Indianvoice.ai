import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
      { title: "Indianvoice.ai — No-Code Voice AI Platform for India" },
      {
        name: "description",
        content:
          "Build Autonomous Voice Agents without code. Handle customer support, sales, and operations on autopilot via Cloud Telephony.",
      },
    ],
  }),
  component: LandingPage,
});

// ─── Data ─────────────────────────────────────────────────────────────────────



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
    title: "Native Cloud Telephony",
    desc: "Direct PSTN calls via our Cloud Telephony partners. Indian caller IDs (+91), Jio/Airtel/BSNL/Vi routing, and sub-200ms local call latency.",
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
    title: "Connect your Tools or Data",
    desc: "Sync your CRM, calendar, or ticketing systems like Zendesk and HubSpot. Automatic phone validation and timezone-aware scheduling run instantly.",
    icon: Users,
  },
  {
    step: "02",
    title: "Configure Agent & Skills",
    desc: "Pick Hindi, Telugu or English. Define a goal and toggle on Skills like 'Book Meetings', 'Send Emails', or 'Resolve Tickets' in our no-code builder.",
    icon: CircuitBoard,
  },
  {
    step: "03",
    title: "Deploy Automations Instantly",
    desc: "AI agents dial via Cloud Telephony, hold natural conversations, and execute real-world actions like booking calendars and sending follow-ups automatically.",
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
    quote: "Telugu lo matladu tundi - prospects chala surprised avutunnaru. Connect rate 58% ki vachindi. Vapi try chesamu but India lo pani chesedi kadu.",
    name: "Venkata Suresh",
    title: "VP Sales, AgriTech Solutions",
    role: "AgriTech · Vijayawada · Telugu Campaigns",
    initials: "VS",
    stars: 5,
    lang: "తెలుగు",
  },
  {
    quote: "Inbound leads are contacted within 18 seconds of form submission. Our connect-to-meeting rate jumped to 14.8%. Native Telephony integration means massive cost savings.",
    name: "Nisha Kapoor",
    title: "Head of Growth, FinTech Startup",
    role: "Fintech · Mumbai · 3.8x Pipeline Growth",
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
      "5,000 dials/month",
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
      "25,000 dials/month",
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
      { speaker: "AI", text: "Unlike dialers, our AI agents hold the complete Hindi/English qualification conversation and book meetings directly — all via native Cloud Telephony.", duration: 4000, intent: 84 },
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
            Telephony Live
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
            <IndianRupee className="size-3.5 text-orange-400" /> Low Cost Cloud Telephony
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Animated Voice Wave Component ───────────────────────────────────────────
function VoiceWaveBar({ delay = 0, height = 16 }: { delay?: number; height?: number }) {
  return (
    <div
      className="rounded-full bg-orange-400 animate-wave-bar"
      style={{
        width: "4px",
        height: `${height}px`,
        animationDelay: `${delay}s`,
        transformOrigin: "bottom center",
        display: "inline-block",
      }}
    />
  );
}

function AnimatedVoiceWave() {
  const bars = [8, 14, 20, 28, 22, 32, 24, 18, 26, 20, 14, 10, 16, 22, 18, 12];
  return (
    <div className="flex items-center gap-[3px]" style={{ height: "36px" }}>
      {bars.map((h, i) => (
        <VoiceWaveBar key={i} height={h} delay={i * 0.07} />
      ))}
    </div>
  );
}

// ─── Stat (light theme) ───────────────────────────────────────────────────────
function AnimatedStat({ value, label, icon: Icon }: { value: string; label: string; icon: typeof TrendingUp }) {
  return (
    <div className="group flex flex-col gap-1 rounded-2xl border border-orange-100 bg-white px-6 py-5 shadow-sm transition-all hover:border-orange-300 hover:shadow-md">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="size-4 text-orange-500" />
      </div>
      <span className="font-display text-3xl font-extrabold text-gray-900 tracking-tight">{value}</span>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function LandingPage() {

  const languages = [
    { label: "हिंदी" },
    { label: "తెలుగు" },
    { label: "தமிழ்" },
    { label: "বাংলা" },
    { label: "मराठी" },
  ];

  return (
    <div className="min-h-screen bg-[#fffaf6] text-gray-900">

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-orange-100 bg-[#fffaf6]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/landing" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-orange-500 shadow-lg shadow-orange-500/25">
              <Waves className="size-4 text-white" />
            </span>
            <span className="font-display text-base font-bold text-gray-900 tracking-tight">Indianvoice<span className="text-orange-500">.ai</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {["Features", "How it Works", "Pricing"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm text-gray-500 transition-colors hover:text-gray-900 hover:font-medium">
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5">
              Sign in
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-1.5 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-600 active:scale-95"
            >
              Free demo <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#fffaf6]" style={{ minHeight: "calc(100vh - 64px)" }}>
        {/* Large peach/orange blob behind the woman — 10% bigger */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0" style={{ width: "58%", zIndex: 0 }}>
          <div
            className="absolute"
            style={{
              width: "600px",
              height: "600px",
              borderRadius: "50%",
              background: "radial-gradient(circle, #fddbb4 0%, #fbc98a 35%, #fde8ce 65%, transparent 100%)",
              right: "60px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
          {/* secondary soft glow */}
          <div
            className="absolute"
            style={{
              width: "380px",
              height: "380px",
              borderRadius: "50%",
              background: "radial-gradient(circle, #fed7aa 0%, transparent 70%)",
              right: "200px",
              top: "30%",
              transform: "translateY(-30%)",
              opacity: 0.5,
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-14 md:py-20" style={{ zIndex: 1 }}>
          <div className="grid items-center gap-0 lg:grid-cols-[1fr_auto_auto]" style={{ columnGap: '0px' }}>

            {/* ── Left copy ── */}
            <motion.div 
              className="flex flex-col max-w-[580px]"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              {/* Label */}
              <p className="text-[11px] font-bold tracking-[0.25em] text-orange-500 uppercase mb-7">
                No-Code Voice AI Automations
              </p>

              {/* Headline — 10% bigger */}
              <h1 className="font-bold leading-tight text-gray-900" style={{ fontSize: "clamp(2.8rem, 5.5vw, 4.2rem)", lineHeight: 1.08 }}>
                One Voice.<br />
                A <span className="text-orange-500">Billion</span> Possibilities.
              </h1>

              {/* Subtitle */}
              <p className="mt-6 text-gray-500 leading-relaxed" style={{ fontSize: "1.12rem", maxWidth: "460px" }}>
                Build autonomous voice agents without code.<br />
                Schedule meetings, send emails, and resolve support tickets instantly.
              </p>

              {/* Feature icons row */}
              <div className="mt-9 grid grid-cols-4 gap-5" style={{ maxWidth: "500px" }}>
                {[
                  { icon: PhoneCall, title: "Make Calls", desc: "Talk to customers" },
                  { icon: CalendarCheck, title: "Book & Schedule", desc: "Save time" },
                  { icon: Zap, title: "Complete Tasks", desc: "From start to finish" },
                  { icon: Globe2, title: "In Your Language", desc: "For every Indian" },
                ].map((feat) => (
                  <div key={feat.title} className="flex flex-col items-start gap-1.5">
                    <feat.icon className="size-7 text-orange-500 mb-0.5" strokeWidth={1.5} />
                    <span className="text-[13px] font-semibold text-gray-800 leading-tight">{feat.title}</span>
                    <span className="text-[11px] text-gray-400 leading-tight">{feat.desc}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="mt-11 flex flex-row items-center gap-4 flex-nowrap">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full bg-orange-500 px-10 py-4 text-[15px] font-bold text-white shadow-xl shadow-orange-500/35 transition-all hover:bg-orange-600 hover:scale-105 active:scale-100 whitespace-nowrap"
                >
                  Build the Future <ArrowRight className="size-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-gray-800 px-10 py-4 text-[15px] font-bold text-gray-900 transition-all hover:bg-gray-50 hover:scale-105 active:scale-100 whitespace-nowrap"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-gray-900">
                    <Play className="size-3 fill-white text-white" />
                  </span>
                  See How It Works
                </Link>
              </div>

              {/* Bottom tagline */}
              <p className="mt-11 text-[10px] font-bold tracking-[0.22em] text-gray-400 uppercase">
                Built for India. Powered by Voice.
              </p>
            </motion.div>

            {/* ── Center: Woman Image with voice wave ── */}
            <motion.div 
              className="relative flex items-end justify-center" 
              style={{ minWidth: "375px", zIndex: 2, marginLeft: "40px" }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            >

              {/* Speech bubble — positioned top-left of woman */}
              <div
                className="absolute z-10 flex flex-col gap-2 rounded-2xl bg-white px-5 py-3.5 shadow-2xl border border-orange-100"
                style={{ top: "28px", left: "20px", minWidth: "230px" }}
              >
                <span className="text-[15px] font-semibold text-gray-800 leading-snug">
                  Schedule my dental appointment <br />this saturday at 11am.
                </span>
                {/* Animated waveform inside bubble */}
                <div className="flex items-center gap-[3px]" style={{ height: "22px" }}>
                  {[5, 9, 14, 10, 7, 12, 8, 11, 7, 5, 9, 12, 8, 6].map((h, i) => (
                    <div
                      key={i}
                      className="rounded-full bg-orange-400 animate-wave-bar"
                      style={{
                        width: "3px",
                        height: `${h}px`,
                        animationDelay: `${i * 0.08}s`,
                        transformOrigin: "bottom center",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* SVG Voice wave arc from woman's mouth to the speech bubble */}
              <svg
                className="absolute"
                style={{ top: "60px", left: "40px", zIndex: 5, pointerEvents: "none" }}
                width="120"
                height="70"
                viewBox="0 0 120 70"
                fill="none"
              >
                {/* Static faint path */}
                <path
                  d="M 100 55 Q 60 10 10 40"
                  stroke="#fb923c"
                  strokeWidth="2"
                  strokeOpacity="0.18"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray="4 6"
                />
                {/* Animated traveling dot 1 */}
                <circle r="3.5" fill="#f97316" opacity="0.9">
                  <animateMotion
                    dur="1.8s"
                    repeatCount="indefinite"
                    path="M 100 55 Q 60 10 10 40"
                  />
                  <animate attributeName="opacity" values="0;1;1;0" dur="1.8s" repeatCount="indefinite" />
                </circle>
                {/* Animated traveling dot 2 — offset */}
                <circle r="2.5" fill="#fb923c" opacity="0.7">
                  <animateMotion
                    dur="1.8s"
                    begin="0.6s"
                    repeatCount="indefinite"
                    path="M 100 55 Q 60 10 10 40"
                  />
                  <animate attributeName="opacity" values="0;0.8;0.8;0" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
                </circle>
                {/* Animated traveling dot 3 */}
                <circle r="2" fill="#fdba74" opacity="0.6">
                  <animateMotion
                    dur="1.8s"
                    begin="1.2s"
                    repeatCount="indefinite"
                    path="M 100 55 Q 60 10 10 40"
                  />
                  <animate attributeName="opacity" values="0;0.6;0.6;0" dur="1.8s" begin="1.2s" repeatCount="indefinite" />
                </circle>
              </svg>

              {/* Woman photo — full composition */}
              <img
                src="/hero-woman.png"
                alt="Indian woman using voice AI"
                className="relative z-[1]"
                style={{
                  height: "530px",
                  width: "auto",
                  objectFit: "contain",
                  filter: "drop-shadow(0 12px 40px rgba(0,0,0,0.10))",
                }}
              />

              {/* Orange waveform decorative at bottom-right of woman */}
              <div className="absolute z-[3] flex items-end gap-[3px]" style={{ bottom: "70px", right: "0px" }}>
                {[5, 9, 15, 11, 18, 13, 9, 7, 11, 14, 10, 7].map((h, i) => (
                  <div
                    key={i}
                    className="rounded-full bg-orange-400 animate-wave-bar"
                    style={{
                      width: "5px",
                      height: `${h}px`,
                      opacity: 0.65,
                      animationDelay: `${i * 0.09}s`,
                      transformOrigin: "bottom center",
                    }}
                  />
                ))}
              </div>
            </motion.div>

            {/* ── Right: Language bubbles ── */}
            <motion.div
              className="relative hidden lg:flex flex-col items-start gap-3 pl-2"
              style={{ zIndex: 3, minWidth: "170px" }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              {languages.map((lang, i) => (
                <div
                  key={lang.label}
                  className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-lg border border-orange-100 transition-transform hover:scale-105 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.12}s` }}
                >
                  <span className="text-[15px] font-semibold text-gray-800">{lang.label}</span>
                  <div className="flex items-end gap-[2.5px]">
                    {[4, 6, 9, 7, 5, 8, 6].map((h, j) => (
                      <div
                        key={j}
                        className="rounded-full bg-orange-400 animate-wave-bar"
                        style={{
                          width: "2.5px",
                          height: `${h}px`,
                          animationDelay: `${j * 0.1 + i * 0.15}s`,
                          transformOrigin: "bottom center",
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 rounded-2xl bg-white/60 px-5 py-3 shadow-md border border-orange-100 opacity-60">
                <span className="text-[14px] font-semibold text-gray-500">and more...</span>
              </div>
            </motion.div>

          </div>
        </div>
      </section>



      {/* ── Languages Graphic Section ─────────────────────────── */}
      <section className="py-24 px-6 bg-gray-50 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Fluent in <span className="text-orange-500">Every Accent</span>
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Engage your customers naturally in their native tongue. Built specifically for India's linguistic diversity, our AI understands context, accents, and nuances across 10+ regional languages.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
              className="rounded-3xl overflow-hidden"
            >
              <img src="/language-phone.png" alt="One Voice for Every India" className="w-full h-auto object-contain mix-blend-multiply hover:scale-105 transition-transform duration-700" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-3xl overflow-hidden md:mt-24"
            >
              <img src="/language-map.png" alt="Speaks Your Language" className="w-full h-auto object-contain mix-blend-multiply hover:scale-105 transition-transform duration-700" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-[#fffaf6]">
        <div className="mx-auto max-w-7xl">
          <motion.div 
            className="mb-14 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block rounded-full border border-orange-300 bg-orange-50 px-4 py-1 text-xs font-bold text-orange-500 mb-4 tracking-wide uppercase">
              Platform capabilities
            </span>
            <h2 className="font-display text-4xl font-extrabold text-gray-900 md:text-5xl">
              Everything your sales team needs,{" "}
              <span className="text-gray-400">for India.</span>
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              From first dial to booked meeting — in Hindi, Telugu, or English. Fully automated, fully TRAI-compliant.
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group rounded-2xl border border-orange-100 bg-white p-6 transition-all hover:shadow-lg hover:border-orange-200 hover:-translate-y-1"
              >
                <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <f.icon className="size-5" />
                </div>
                <div className="mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">{f.tag}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Turn Conversations Into Opportunities ─────────────────────────── */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[11px] font-bold tracking-[0.25em] text-orange-500 uppercase mb-4">AI Voice Agents for Businesses</p>
              <h2 className="font-bold text-gray-900 mb-6" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.1 }}>
                Turn Conversations<br />Into <span className="text-orange-500">Opportunities</span>
              </h2>
              <p className="text-gray-500 leading-relaxed mb-10 text-lg max-w-md">
                Automate outbound calls, qualify leads, book meetings and follow up — with natural, human-like voice agents that speak India's languages.
              </p>
              <div className="grid grid-cols-2 gap-5 mb-10">
                {[
                  { icon: PhoneCall, title: "Outbound Calling", desc: "Reach 1000s of leads daily" },
                  { icon: Users, title: "Lead Qualification", desc: "Identify high-intent leads" },
                  { icon: CalendarCheck, title: "Book Meetings", desc: "Syncs with your calendar" },
                  { icon: BarChart3, title: "Track & Optimize", desc: "See real results, in real time" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                      <item.icon className="size-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-all hover:scale-105">
                  Get Started <ArrowRight className="size-4" />
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-7 py-3.5 text-sm font-bold text-gray-700 hover:border-orange-300 hover:text-orange-600 transition-all">
                  Book a Demo
                </Link>
              </div>
              <div className="flex items-center gap-5 mt-6">
                {["No credit card required", "Setup in minutes", "Works in 10+ Indian languages"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <CheckCircle2 className="size-3 text-emerald-500" /> {t}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Right: Dashboard mockup */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="absolute inset-0 -z-10 rounded-3xl bg-orange-500/10 blur-3xl scale-110" />
              <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 bg-gray-50 border-b border-gray-100 px-4 py-3">
                  <div className="flex gap-1.5">
                    {["#ef4444","#f59e0b","#22c55e"].map(c => <span key={c} className="size-2.5 rounded-full" style={{ background: c }} />)}
                  </div>
                  <div className="flex-1 mx-3 rounded-md bg-white border border-gray-200 px-3 py-1 text-[11px] text-gray-400 flex items-center gap-2">
                    <Waves className="size-3 text-orange-500" /> app.indianvoice.ai/dashboard
                  </div>
                </div>
                <div className="p-5 bg-[#fafafa]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Campaigns "º Q3 Sales Outreach</p>
                      <h3 className="text-base font-bold text-gray-900">Q3 Sales Outreach</h3>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-600">
                      <span className="relative flex size-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" /></span>
                      Running
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                      { label: "Calls Made", value: "2,480", delta: "+12%" },
                      { label: "Connected", value: "892", delta: "+18%" },
                      { label: "Meetings Booked", value: "276", delta: "+24%" },
                      { label: "Conversion Rate", value: "34%", delta: "+7%" },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl bg-white border border-gray-100 p-3 shadow-sm">
                        <p className="text-[10px] text-gray-400 mb-1">{m.label}</p>
                        <p className="text-lg font-extrabold text-gray-900">{m.value}</p>
                        <p className="text-[10px] font-semibold text-emerald-500">{m.delta}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center px-4 py-3 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <span className="relative flex size-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" /><span className="relative inline-flex size-1.5 rounded-full bg-orange-500" /></span>
                        Live Calls · 12 in progress
                      </span>
                    </div>
                    <table className="w-full text-[11px]">
                      <thead><tr className="bg-gray-50 text-gray-400 text-left">{["Contact","Phone","Status","Duration","Agent","Transcript"].map(h => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
                      <tbody>
                        {[
                          { name: "Ravi Kumar", loc: "Bangalore, KA", phone: "+91 98765 43210", status: "Speaking", statusColor: "bg-orange-100 text-orange-600", duration: "00:01:24", transcript: "\"yes, I'm interested...\"" },
                          { name: "Priya Sharma", loc: "Delhi, DL", phone: "+91 91234 56789", status: "Connected", statusColor: "bg-emerald-100 text-emerald-600", duration: "00:03:12", transcript: "\"Great! I can schedule a demo...\"" },
                          { name: "Arjun Mehta", loc: "Mumbai, MH", phone: "+91 99876 54327", status: "Ringing", statusColor: "bg-amber-100 text-amber-600", duration: "00:00:08", transcript: "—" },
                        ].map((row) => (
                          <tr key={row.name} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2.5"><p className="font-semibold text-gray-800">{row.name}</p><p className="text-gray-400 text-[10px]">{row.loc}</p></td>
                            <td className="px-3 py-2.5 text-gray-500">{row.phone}</td>
                            <td className="px-3 py-2.5"><span className={`rounded-full px-2 py-0.5 font-semibold text-[10px] ${row.statusColor}`}>{row.status}</span></td>
                            <td className="px-3 py-2.5 text-gray-500">{row.duration}</td>
                            <td className="px-3 py-2.5 text-gray-400">AI Agent</td>
                            <td className="px-3 py-2.5 text-gray-400 max-w-[100px] truncate">{row.transcript}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 rounded-2xl bg-white border border-orange-100 shadow-xl px-5 py-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Scale Your Outreach</p>
                <p className="text-2xl font-extrabold text-gray-900">2,480</p>
                <p className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1"><TrendingUp className="size-3" /> 12% this week</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── From Lead to Meeting — Automatically ──────────────────────────────── */}
      <section className="py-24 px-6 bg-[#fffaf6] overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-[320px_1fr] gap-16 items-start">
            <motion.div 
              className="lg:sticky lg:top-24"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="font-bold text-gray-900 mb-4" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", lineHeight: 1.15 }}>
                From Lead to Meeting<br />— <span className="text-orange-500">Automatically</span>
              </h2>
              <p className="text-gray-500 leading-relaxed">Let your AI voice agent handle the entire outreach process, end to end.</p>
            </motion.div>
            <div className="flex items-start gap-3 overflow-x-auto pb-4">
              {[
                { step: "1. New Lead", badge: "New Lead", badgeColor: "bg-blue-100 text-blue-600", icon: Users, iconColor: "text-blue-500", popupText: "Lead synced from HubSpot CRM instantly." },
                { step: "2. Calling", badge: "Calling...", badgeColor: "bg-orange-100 text-orange-600", icon: PhoneCall, iconColor: "text-orange-500", popupText: "Auto-dialing via Cloud Telephony with local presence." },
                { step: "3. Connected", badge: "Connected", badgeColor: "bg-emerald-100 text-emerald-600", icon: CheckCircle2, iconColor: "text-emerald-500", popupText: "Lead answered in < 3 rings. AI introduces itself." },
                { step: "4. Qualified", badge: "High Intent", badgeColor: "bg-amber-100 text-amber-600", icon: Star, iconColor: "text-amber-500", popupText: "Positive sentiment detected. Budget & timeline verified." },
                { step: "5. Meeting Booked", badge: "Meeting Scheduled", badgeColor: "bg-purple-100 text-purple-600", icon: CalendarCheck, iconColor: "text-purple-500", popupText: "Calendar invite sent via WhatsApp & Email." },
              ].map((s, i) => (
                <motion.div 
                  key={s.step} 
                  className="flex items-start gap-2 shrink-0"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div className="w-52 rounded-2xl bg-white border border-orange-100 p-4 shadow-sm hover:shadow-lg transition-all hover:-translate-y-2 group relative cursor-default">
                    {/* Hover Popup */}
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 pointer-events-none z-10">
                      <div className="rounded-xl bg-gray-900 px-3 py-2.5 text-center text-[11px] font-medium text-white shadow-xl leading-tight">
                        {s.popupText}
                      </div>
                      <div className="mx-auto h-2.5 w-2.5 -translate-y-[60%] rotate-45 bg-gray-900 rounded-sm" />
                    </div>

                    <div className="flex items-center gap-2 mb-3 relative z-0">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-gray-50 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                        <s.icon className={`size-3.5 ${s.iconColor}`} />
                      </div>
                      <span className="text-[11px] font-bold text-gray-500">{s.step}</span>
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 mb-3">
                      <p className="text-xs font-bold text-gray-800">Karan Malhotra</p>
                      <p className="text-[10px] text-gray-400">Marketing Manager</p>
                      <p className="text-[10px] text-gray-400">GrowTech Solutions</p>
                      <p className="text-[10px] text-gray-400 mt-1">+91 98765 43210</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${s.badgeColor}`}>
                      <span className="relative flex size-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-current" /><span className="relative inline-flex size-1.5 rounded-full bg-current" /></span>
                      {s.badge}
                    </span>
                  </div>
                  {i < 4 && (
                    <div className="flex items-center mt-16">
                      <ArrowRight className="size-5 text-orange-400 shrink-0" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="mx-auto max-w-5xl">
          <motion.div 
            className="mb-14 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block rounded-full border border-orange-300 bg-orange-50 px-4 py-1 text-xs font-bold text-orange-500 mb-4 tracking-wide uppercase">
              How it works
            </span>
            <h2 className="font-display text-4xl font-extrabold text-gray-900 md:text-5xl">
              Live in 30 minutes.{" "}
              <span className="text-gray-400">Seriously.</span>
            </h2>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div 
                key={step.step} 
                className="rounded-2xl border border-orange-100 bg-[#fffaf6] p-7 hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="font-display text-4xl font-extrabold text-orange-300">{step.step}</span>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100">
                    <step.icon className="size-4 text-orange-500" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>




      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 bg-[#fffaf6]">
        <div className="mx-auto max-w-6xl">
          <motion.div 
            className="mb-14 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block rounded-full border border-orange-300 bg-orange-50 px-4 py-1 text-xs font-bold text-orange-500 mb-4 tracking-wide uppercase">
              India-first pricing
            </span>
            <h2 className="font-display text-4xl font-extrabold text-gray-900 md:text-5xl">
              Priced for Bharat.
            </h2>
            <p className="mt-4 text-gray-500 text-lg">All plans include TRAI compliance + Cloud Telephony routing.</p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className={cn(
                  "relative rounded-2xl border p-7 flex flex-col transition-all hover:shadow-lg",
                  plan.highlight
                    ? "border-orange-400 bg-white shadow-xl shadow-orange-500/15"
                    : "border-orange-100 bg-white"
                )}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3.5 py-1 text-[11px] font-bold text-white shadow-lg">
                    {plan.badge}
                  </span>
                )}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{plan.desc}</p>
                </div>
                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className={cn(
                    "block rounded-xl py-3 text-center text-sm font-bold transition-all hover:scale-105",
                    plan.highlight
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600"
                      : "border-2 border-gray-200 text-gray-700 hover:border-orange-400 hover:text-orange-600"
                  )}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-orange-100 py-10 px-6 bg-[#fffaf6]">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-orange-500">
              <Waves className="size-3.5 text-white" />
            </span>
            <span className="font-display text-sm font-bold text-gray-900">Indianvoice<span className="text-orange-500">.ai</span></span>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Indianvoice.ai. Built for Bharat. TRAI compliant. Powered by Sarvam AI + Cloud Telephony.
          </p>
          <div className="flex gap-4">
            {["Privacy", "Terms", "Contact"].map((link) => (
              <a key={link} href="#" className="text-xs text-gray-400 hover:text-gray-900 transition-colors">{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
