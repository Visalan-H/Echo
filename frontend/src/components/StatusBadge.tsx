import { motion } from "framer-motion";
import type { JobStatus } from "../types/api";

type StatusBadgeProps = {
  status: JobStatus | string;
};

const statusStyles: Record<JobStatus, string> = {
  Applied: "text-blue-500",
  Interviewing: "text-amber-500",
  Offered: "text-emerald-500",
  Rejected: "text-red-500",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const isKnown = status in statusStyles;
  const dotColorClass = isKnown ? statusStyles[status as JobStatus] : "text-[var(--color-muted)]";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]"
    >
      <div className={`w-1.5 h-1.5 rounded-full bg-current ${dotColorClass}`} />
      <span>{status}</span>
    </motion.div>
  );
}
