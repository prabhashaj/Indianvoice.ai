import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Waves,
  Sparkles,
  ShieldCheck,
  Lock,
  ArrowRight,
} from "lucide-react";
import { authApi, setTokens } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [{ title: "Create Workspace — Indianvoice.ai Sales Command Center" }],
  }),
  component: RegisterPage,
});

const BENEFITS = [
  "14-day unrestricted trial with 2 live AI voice agents",
  "Sub-100ms real-time WebRTC audio pipeline",
  "Instant CSV lead import & automated DNC compliance",
  "Two-way CRM integration (HubSpot, Salesforce, n8n)",
  "No credit card required to start",
];

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ["bg-danger", "bg-warning", "bg-chart-2", "bg-success"];
  const labels = ["Too weak", "Weak", "Good", "Strong"];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {colors.map((c, i) => (
          <div
            key={i}
            className={cn("h-1 flex-1 rounded-full transition-all", i < score ? c : "bg-border")}
          />
        ))}
      </div>
      <p className={cn("mt-1 text-[10px]", score === 4 ? "text-success" : "text-muted-foreground")}>
        {labels[score - 1] ?? "Enter password"}
      </p>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    workspace_name: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.register({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        workspace_name: form.workspace_name || `${form.full_name.split(" ")[0]}'s Workspace`,
      });
      setTokens(data.access_token, data.refresh_token);
      toast.success("Workspace created successfully! Welcome to Indianvoice.ai.");
      navigate({ to: "/" });
    } catch (err: any) {
      if (err.name === "TypeError" || err.message === "Failed to fetch") {
        // Graceful local demo creation if backend offline
        setTokens("mock_jwt_token_registered", "mock_refresh_token_registered");
        toast.success("Workspace activated! (Offline Mode)");
        navigate({ to: "/" });
      } else {
        setError(err.message ?? "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleQuickDemoTrial() {
    setTokens("mock_jwt_token_demo", "mock_refresh_token_demo");
    toast.success("Trial workspace activated! Redirecting to dashboard...");
    setTimeout(() => {
      navigate({ to: "/" });
    }, 400);
  }

  return (
    <div className="flex min-h-screen bg-[#fffaf6] text-gray-900 selection:bg-orange-100 selection:text-orange-900">
      {/* ── Left: Benefits Panel ───────────────────────────────────────────── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-white border-r border-orange-100 p-12 lg:flex lg:w-[46%]">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-white to-[#fffaf6]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            maskImage: "radial-gradient(ellipse at center, black, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black, transparent 80%)",
          }}
        />
        <div className="pointer-events-none absolute -bottom-24 -right-24 size-80 rounded-full bg-amber-500/5 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/25">
            <Waves className="size-5 text-white" />
          </span>
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold text-gray-900 tracking-tight">Indianvoice.ai</span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Enterprise Outbound Platform</span>
          </div>
        </div>

        <div className="relative space-y-8 my-auto">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600 mb-3 border border-orange-100">
              <Sparkles className="size-3.5" /> Start 14-Day Free Trial
            </div>
            <h2 className="font-display text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl">
              Deploy Your First Autonomous Voice Agent Today
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 max-w-md">
              Set up in under 5 minutes. Import your prospect list, define qualification criteria, and watch booked meetings populate your calendar.
            </p>
          </div>

          <ul className="space-y-3.5">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <span className="text-xs md:text-sm font-medium text-gray-600">{b}</span>
              </li>
            ))}
          </ul>

          {/* Metrics preview */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { val: "2,400+", label: "Dials / Day / Agent" },
              { val: "< 95ms", label: "Real-time Voice Latency" },
              { val: "58.4%", label: "Average Connect Rate" },
              { val: "100%", label: "DNC & TCPA Compliant" },
            ].map(({ val, label }) => (
              <div key={label} className="rounded-2xl border border-orange-100 bg-white p-3.5 shadow-sm">
                <p className="font-display text-xl font-bold text-gray-900">{val}</p>
                <p className="mt-0.5 text-[10px] text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between border-t border-gray-100 pt-4 text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-emerald-500" /> SOC-2 Type II Certified
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="size-3.5 text-gray-400" /> 256-Bit Encrypted
          </span>
        </div>
      </div>

      {/* ── Right: Form Panel ──────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md space-y-7">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Link to="/landing" className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-900 transition-colors">
                ← Back to overview
              </Link>
              <span className="rounded-full bg-orange-50 border border-orange-100 px-2.5 py-0.5 text-[10px] font-bold text-orange-500">
                No Credit Card
              </span>
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-gray-900">
              Create Your Free Account
            </h1>
            <p className="text-sm text-gray-500">
              Get immediate access to your sales command center.
            </p>
          </div>

          {/* 1-Click Fast Trial Button */}
          <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-orange-500" /> Instant Sandbox Access:
              </span>
              <span className="text-[10px] text-gray-400">Zero setup</span>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoTrial}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-orange-600 active:scale-95 transition-all"
            >
              🚀 Launch Pre-Configured Demo Workspace
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider" htmlFor="full_name">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="full_name"
                  type="text"
                  required
                  value={form.full_name}
                  onChange={set("full_name")}
                  placeholder="Alex Morgan"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider" htmlFor="reg-phone">
                Phone Number
              </label>
              <div className="relative">
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider" htmlFor="reg-email">
                Work Email
              </label>
              <div className="relative">
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={set("email")}
                  placeholder="alex@company.com"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider" htmlFor="workspace_name">
                Company / Workspace Name
              </label>
              <div className="relative">
                <input
                  id="workspace_name"
                  type="text"
                  value={form.workspace_name}
                  onChange={set("workspace_name")}
                  placeholder="Northstar Revenue Inc."
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={set("password")}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-11 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              {loading ? "Creating workspace..." : "Get Started Free"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-orange-500 hover:text-orange-600 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
