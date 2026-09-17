import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Waves,
  ArrowRight,
  ShieldCheck,
  Lock,
  CheckCircle2,
  User,
  Mail,
  Building2,
} from "lucide-react";
import { authApi, setTokens } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Sign in — Indianvoice.ai Sales Command Center" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register">("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regWorkspace, setRegWorkspace] = useState("");
  const [showRegPw, setShowRegPw] = useState(false);
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const data = await authApi.login(loginEmail, loginPassword);
      setTokens(data.access_token, data.refresh_token);
      toast.success("Welcome back!");
      navigate({ to: "/" });
    } catch (err: any) {
      setLoginError(err.message ?? "Invalid credentials. Please check your email and password.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    if (regPassword.length < 8) {
      setRegError("Password must be at least 8 characters.");
      return;
    }
    setRegLoading(true);
    try {
      const data = await authApi.register({
        full_name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        workspace_name: regWorkspace.trim() || `${regName.split(" ")[0]}'s Workspace`,
      });
      setTokens(data.access_token, data.refresh_token);
      toast.success("Account created! Welcome to Indianvoice.ai.");
      navigate({ to: "/" });
    } catch (err: any) {
      setRegError(err.message ?? "Registration failed. Please try again.");
    } finally {
      setRegLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#080b14] text-white">

      {/* ── Left branding panel (desktop) ──────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[50%] flex-col overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0f1e] via-[#10122a] to-[#0d1225]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[500px] rounded-full bg-violet-600/12 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 size-80 rounded-full bg-blue-600/8 blur-3xl" />

        <div className="relative flex flex-col h-full p-10 xl:p-14">
          {/* Logo */}
          <Link to="/landing" className="flex items-center gap-2.5 group w-fit">
            <span className="flex size-9 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-500/30 transition-all group-hover:bg-violet-500">
              <Waves className="size-4 text-white" />
            </span>
            <div>
              <p className="font-display text-base font-bold text-white">Indianvoice.ai</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Sales Command Center</p>
            </div>
          </Link>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center max-w-md space-y-10">
            <div>
              <h2 className="font-display text-4xl xl:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
                Autonomous AI outbound.{" "}
                <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                  Real results.
                </span>
              </h2>
              <p className="mt-4 text-base text-white/45 leading-relaxed">
                Deploy AI voice agents that call, qualify, and book meetings — 24/7, without burnout.
              </p>
            </div>

            {/* Feature checklist */}
            <ul className="space-y-3">
              {[
                "Sub-100ms AI voice response latency",
                "Autonomous lead qualification & CRM sync",
                "Live calendar booking inside conversations",
                "Real-time call intelligence & sentiment scores",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/60">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "1,200+", label: "Teams active" },
                { value: "4.2M+", label: "Calls made" },
                { value: "58.4%", label: "Connect rate" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-center">
                  <p className="font-display text-xl font-black text-white">{s.value}</p>
                  <p className="text-[11px] text-white/35 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="relative flex items-center gap-6 text-[11px] text-white/25 pt-4 border-t border-white/5">
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-emerald-400/70" /> SOC-2 Type II</span>
            <span className="flex items-center gap-1.5"><Lock className="size-3 text-white/30" /> 256-bit TLS</span>
            <span className="ml-auto">© 2025 Indianvoice.ai Inc.</span>
          </div>
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12 xl:px-16">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <span className="flex size-8 items-center justify-center rounded-xl bg-violet-600">
            <Waves className="size-4 text-white" />
          </span>
          <span className="font-display text-base font-bold text-white">Indianvoice.ai</span>
        </div>

        <div className="w-full max-w-md">
          {/* Back link */}
          <Link to="/landing" className="mb-6 inline-block text-xs text-white/35 hover:text-white/60 transition-colors">
            ← Back to overview
          </Link>

          {/* Tab switcher */}
          <div className="mb-8 flex rounded-2xl border border-white/8 bg-white/[0.03] p-1">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setLoginError(""); setRegError(""); }}
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all",
                  tab === t
                    ? "bg-violet-600 text-white shadow-lg"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                {t === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* ── Login form ── */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-xs font-semibold text-white/45 uppercase tracking-wider">
                  Work email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/25" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/60 focus:bg-violet-500/5 focus:ring-2 focus:ring-violet-500/15"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="block text-xs font-semibold text-white/45 uppercase tracking-wider">
                    Password
                  </label>
                  <a href="#" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/25" />
                  <input
                    id="login-password"
                    type={showLoginPw ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-12 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/60 focus:bg-violet-500/5 focus:ring-2 focus:ring-violet-500/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-white/25 hover:text-white/60 transition-colors"
                    aria-label={showLoginPw ? "Hide password" : "Show password"}
                  >
                    {showLoginPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300 animate-in fade-in slide-in-from-top-1">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-500 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loginLoading ? <><Loader2 className="size-4 animate-spin" /> Signing in…</> : <>Sign in <ArrowRight className="size-4" /></>}
              </button>

              <p className="text-center text-xs text-white/30">
                No account?{" "}
                <button type="button" onClick={() => setTab("register")} className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
                  Create one free →
                </button>
              </p>
            </form>
          )}

          {/* ── Register form ── */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="reg-name" className="block text-xs font-semibold text-white/45 uppercase tracking-wider">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/25" />
                  <input
                    id="reg-name"
                    type="text"
                    autoComplete="name"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/60 focus:bg-violet-500/5 focus:ring-2 focus:ring-violet-500/15"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-email" className="block text-xs font-semibold text-white/45 uppercase tracking-wider">
                  Work email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/25" />
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/60 focus:bg-violet-500/5 focus:ring-2 focus:ring-violet-500/15"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-workspace" className="block text-xs font-semibold text-white/45 uppercase tracking-wider">
                  Workspace name <span className="text-white/20 normal-case font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/25" />
                  <input
                    id="reg-workspace"
                    type="text"
                    value={regWorkspace}
                    onChange={(e) => setRegWorkspace(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/60 focus:bg-violet-500/5 focus:ring-2 focus:ring-violet-500/15"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-password" className="block text-xs font-semibold text-white/45 uppercase tracking-wider">
                  Password <span className="text-white/20 normal-case font-normal">(min 8 chars)</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/25" />
                  <input
                    id="reg-password"
                    type={showRegPw ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-12 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/60 focus:bg-violet-500/5 focus:ring-2 focus:ring-violet-500/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-white/25 hover:text-white/60 transition-colors"
                    aria-label={showRegPw ? "Hide password" : "Show password"}
                  >
                    {showRegPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {regError && (
                <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300 animate-in fade-in slide-in-from-top-1">
                  {regError}
                </div>
              )}

              <button
                type="submit"
                disabled={regLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-500 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {regLoading ? <><Loader2 className="size-4 animate-spin" /> Creating account…</> : <>Create account <ArrowRight className="size-4" /></>}
              </button>

              <p className="text-center text-xs text-white/30">
                Already have an account?{" "}
                <button type="button" onClick={() => setTab("login")} className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
                  Sign in →
                </button>
              </p>
            </form>
          )}

          {/* Trust footer */}
          <div className="mt-8 flex items-center justify-center gap-5 text-[11px] text-white/20">
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-emerald-400/60" /> SOC-2 Certified</span>
            <span className="flex items-center gap-1.5"><Lock className="size-3 text-white/25" /> 256-bit TLS</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3 text-white/25" /> GDPR Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}
