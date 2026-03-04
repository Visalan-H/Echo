import { useEffect, useState } from "react";
import api from "../utils/api";
import { getApiErrorMessage } from "../utils/api";
import { motion } from "framer-motion";
import StatsRow from "../components/StatsRow";
import JobTable from "../components/JobTable";
import SyncButton from "../components/SyncButton";
import Navbar from "../components/Navbar";
import type {
  JobApplication,
  JobApplicationsResponse,
  SyncResponse,
} from "../types/api";
import { useCallback } from "react";

export default function Dashboard() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    const jobsRes = await api.get<JobApplicationsResponse>("/api/job-applications");
    setJobs(jobsRes.data.data ?? []);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const jobsRes = await api.get<JobApplicationsResponse>("/api/job-applications");
      setJobs(jobsRes.data.data ?? []);
    } catch (errorResponse) {
      setError(getApiErrorMessage(errorResponse, "Failed to load dashboard data."));
      setLoading(false);
      return;
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleSyncComplete = useCallback(async (syncData: SyncResponse) => {
    setSyncMessage(syncData.message);
    try {
      await fetchJobs();
    } catch (errorResponse) {
      setError(getApiErrorMessage(errorResponse, "Sync succeeded but reloading jobs failed."));
    }
  }, [fetchJobs]);

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="w-4 h-4 border-2 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 w-full px-6 md:px-10 xl:px-16 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex flex-col gap-8 w-full"
        >
          {error ? (
            <div className="border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          {syncMessage ? (
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-muted)]">
              {syncMessage}
            </div>
          ) : null}

          <div className="flex flex-row items-end justify-between border-b border-[var(--color-border)] pb-5 mt-4 gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-sans font-bold mb-1 tracking-tight text-[var(--color-primary)]">Pipeline</h1>
              <p className="text-[var(--color-muted)] text-xs font-mono uppercase tracking-widest inline-block mt-1">
                {jobs.length} Active Applications
              </p>
            </div>
            <SyncButton onSyncComplete={handleSyncComplete} />
          </div>

          <StatsRow data={jobs} />

          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)]">Recent Activity</h2>
            <JobTable jobs={jobs} />
          </div>
        </motion.div>
      </main>
    </>
  );
}
