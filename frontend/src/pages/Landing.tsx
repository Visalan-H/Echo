import { motion } from "framer-motion";
import { ArrowRight, Sun, Moon, RotateCcw } from "lucide-react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const statusItems = [
  { company: "Stripe", role: "SWE Intern", status: "Applied", dot: "bg-blue-500" },
  { company: "Vercel", role: "Frontend Eng", status: "Interviewing", dot: "bg-yellow-400" },
  { company: "Linear", role: "Product Eng", status: "Offered", dot: "bg-green-500" },
  { company: "Meta", role: "SWE", status: "Rejected", dot: "bg-red-500" },
  { company: "Figma", role: "Design Eng", status: "Interviewing", dot: "bg-yellow-400" },
];

export default function Landing() {
  const { status, isAuthenticated, loginWithGoogle, authError } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get("error");
  const isCheckingSession = status === "loading";

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-[100dvh] bg-base text-primary flex flex-col selection:bg-primary selection:text-base">

      {/* ── Navbar ── */}
      <nav className="border-b border-border bg-base shrink-0">
        <div className="w-full px-4 sm:px-6 md:px-10 xl:px-16 h-16 flex items-center justify-between">
          <span className="font-serif text-lg tracking-tight font-medium">Echo</span>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center border border-transparent hover:border-border hover:bg-surface text-muted hover:text-primary transition-all duration-150"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={loginWithGoogle}
              disabled={isCheckingSession}
              className="flex items-center gap-2 border border-border bg-surface px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted hover:text-primary hover:border-primary transition-colors disabled:opacity-50"
            >
              Sign in
            </button>
          </div>
        </div>
      </nav>

      {/* ── Body ── */}
      <main className="flex-1 flex flex-col items-center justify-center pt-12 md:pt-20 pb-12 gap-16 md:gap-24 px-4 sm:px-6 md:px-10 xl:px-16">

        {/* Top — headline + sub + cta */}
        <div className="w-full flex flex-col items-center text-center gap-6 md:gap-7">


          {/* headline */}
          <div className="overflow-hidden flex flex-col items-center pb-2">
            {["Job hunting is hard.", "Tracking shouldn't be."].map((line, i) => (
              <motion.h1
                key={i}
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.65, delay: 0.08 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="font-serif font-medium leading-[1.15] tracking-tight"
                style={{ fontSize: "clamp(2.8rem, 7vw, 6.5rem)" }}
              >
                {i === 1 ? (
                  <em className="not-italic text-accent">{line}</em>
                ) : (
                  <span className="text-primary">{line}</span>
                )}
              </motion.h1>
            ))}
          </div>

          {/* sub */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="text-muted font-sans leading-relaxed max-w-md"
            style={{ fontSize: "clamp(0.875rem, 1.3vw, 1rem)" }}
          >
            We connect to your Gmail and automatically surface every application you've sent, every interview you've booked, every offer you've earned.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.42 }}
            className="flex flex-col items-center gap-2"
          >
            {(errorMessage || authError) && (
              <p className="font-mono text-xs text-red-500 border border-red-900/40 bg-red-950/10 px-3 py-2 mb-1">
                {errorMessage ? decodeURIComponent(errorMessage) : authError}
              </p>
            )}
            <button
              onClick={loginWithGoogle}
              disabled={isCheckingSession}
              className="group flex items-center gap-3 bg-primary text-base px-7 py-3.5 font-sans font-semibold text-sm hover:opacity-75 disabled:opacity-50 transition-opacity"
            >
              {isCheckingSession ? "Authenticating..." : "Continue with Google"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>

        {/* Bottom — pipeline preview table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-3xl border border-border bg-surface overflow-x-auto"
        >
          <div className="min-w-[600px]">
          {/* table titlebar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-base">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            </div>
            <span className="ml-2 font-mono text-[10px] text-muted uppercase tracking-widest">Pipeline</span>
            <div className="ml-auto flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-accent">
                <RotateCcw className="w-2.5 h-2.5" />
                Synced
              </span>
              <span className="font-mono text-[10px] text-muted">{statusItems.length} records</span>
            </div>
          </div>

          {/* col headers */}
          <div className="grid grid-cols-[1fr_1fr_120px] px-4 py-2 border-b border-border">
            {["Company", "Role", "Status"].map((h) => (
              <span key={h} className="font-mono text-[10px] uppercase tracking-widest text-muted">{h}</span>
            ))}
          </div>

          {/* rows */}
          <div className="divide-y divide-border">
            {statusItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.6 + i * 0.07 }}
                className="grid grid-cols-[1fr_1fr_120px] px-4 py-3 items-center hover:bg-base transition-colors"
              >
                <span className="font-sans font-semibold text-sm text-primary truncate">{item.company}</span>
                <span className="font-mono text-[11px] uppercase tracking-widest text-muted truncate">{item.role}</span>
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dot}`} />
                  <span className="font-mono text-[11px] uppercase tracking-widest text-primary">{item.status}</span>
                </span>
              </motion.div>
            ))}
          </div>
          </div>
        </motion.div>

      </main>
    </div>
  );
}