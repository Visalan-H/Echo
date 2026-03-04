import { motion } from "framer-motion";
import StatusBadge from "./StatusBadge";
import EmptyState from "./EmptyState";
import type { JobApplication } from "../types/api";

type JobTableProps = {
  jobs: JobApplication[];
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return dateFormatter.format(date);
}

export default function JobTable({ jobs }: JobTableProps) {
  if (!jobs || jobs.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="w-full text-left border border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Table Header */}
      <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_1fr] p-4 text-xs uppercase tracking-widest font-mono text-[var(--color-muted)] border-b border-[var(--color-border)]">
        <div>Company</div>
        <div>Role</div>
        <div>Status</div>
        <div className="text-right">Date</div>
      </div>
      
      {/* Table Body */}
      <div className="flex flex-col">
        {jobs.map((job) => (
          <motion.div
            key={job._id ?? `${job.companyName}-${job.applicationDate}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="group relative flex flex-col md:grid md:grid-cols-[2fr_2fr_1fr_1fr] p-5 gap-3 md:gap-0 md:p-4 text-sm md:items-center border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-base)] transition-colors duration-[150ms] ease-out"
          >
            {/* Left border accent on hover */}
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-[150ms] ease-out" />
            
            <div className="flex justify-between items-start md:contents">
              <div className="font-medium truncate pr-4 text-[var(--color-primary)] text-lg md:text-sm">{job.companyName}</div>
              <div className="md:hidden text-[var(--color-muted)] font-mono text-xs mt-1">{formatDate(job.applicationDate)}</div>
            </div>
            
            <div className="text-[var(--color-muted)] truncate pr-4 uppercase tracking-widest font-mono text-xs">{job.jobRole}</div>
            
            <div className="mt-1 md:mt-0">
              <StatusBadge status={job.status} />
            </div>
            
            <div className="hidden md:block text-right text-[var(--color-muted)] font-mono text-xs">
              {formatDate(job.applicationDate)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
