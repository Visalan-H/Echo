import { motion } from "framer-motion";
import { ArrowRight, Inbox, Mail, Zap } from "lucide-react";
import { Navigate, useSearchParams } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

type FeatureOption = {
  icon: ReactNode;
  title: string;
  description: string;
};

const featureCards: FeatureOption[] = [
  {
    icon: <Inbox className="w-5 h-5" strokeWidth={1.5} />,
    title: "Autonomous Sync",
    description: "Connect your inbox once. Echo maintains a real-time record of every application status.",
  },
  {
    icon: <Zap className="w-5 h-5" strokeWidth={1.5} />,
    title: "Zero Overhead",
    description: "Built for speed and clarity. No complex configurations. Just the data you need.",
  },
  {
    icon: <Mail className="w-5 h-5" strokeWidth={1.5} />,
    title: "Instant Insights",
    description: "Watch your pipeline update automatically when recruiters reply. Get immediate clarity.",
  },
];

export default function Landing() {
  const { status, isAuthenticated, loginWithGoogle, authError } = useAuth();
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get("error");
  const isCheckingSession = status === "loading";

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-base text-primary flex flex-col items-center justify-center p-6 selection:bg-primary selection:text-base">
      
      <div className="w-full max-w-250 flex flex-col justify-center gap-16 md:gap-24">
        
        {/* Main Presentation Content */}
        <header className="flex flex-col gap-6 md:gap-8 max-w-163">
          {(errorMessage || authError) && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="p-4 border border-border bg-surface text-red-500 font-sans text-sm tracking-tight mb-4"
             >
               {errorMessage ? decodeURIComponent(errorMessage) : authError}
             </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3 text-muted"
          >
            <div className="w-6 h-6 border border-border flex items-center justify-center bg-surface">
              <div className="w-2 h-2 bg-accent" />
            </div>
            <span className="font-mono text-xs uppercase tracking-widest">Echo Search</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-5xl md:text-7xl font-sans font-medium tracking-tight text-primary"
          >
            Your pipeline, automated.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-lg md:text-xl text-muted font-sans leading-relaxed tracking-tight"
          >
            Echo securely scans your inbox and maintains a real-time ledger of your job search. Track applications effortlessly.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="pt-4"
          >
            <button
              onClick={loginWithGoogle}
              disabled={isCheckingSession}
              className="group flex items-center gap-4 bg-primary text-base hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 transition-opacity duration-200 w-fit"
            >
              <span className="font-sans font-medium text-[15px] tracking-wide">
                {isCheckingSession ? "Authenticating..." : "Continue with Google"}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </header>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-border"
        >
          {featureCards.map((card) => (
            <div key={card.title} className="flex flex-col gap-4">
              <div className="w-10 h-10 border border-border bg-surface flex items-center justify-center text-primary">
                {card.icon}
              </div>
              <div>
                <h3 className="font-sans font-medium text-lg mb-2 text-primary">{card.title}</h3>
                <p className="text-muted text-[15px] leading-relaxed tracking-tight">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
