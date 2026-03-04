import { useCallback, useEffect, useState } from "react";
import { m } from "framer-motion";
import api, { getApiErrorMessage } from "../utils/api";
import StatsRow from "../components/StatsRow";
import JobTable from "../components/JobTable";
import SyncButton from "../components/SyncButton";
import Navbar from "../components/Navbar";
import type {
  DeleteJobResponse,
  JobApplication,
  JobApplicationMutationPayload,
  JobApplicationMutationResponse,
  JobApplicationsResponse,
  SyncResponse,
} from "../types/api";

function DashboardSkeleton() {
  return (
    <>
      <Navbar />
      <main className="flex-1 w-full px-4 sm:px-6 md:px-10 xl:px-16 py-6 sm:py-8">
        <div className="flex flex-col gap-8 w-full">
          {/* Header */}
          <div className="flex flex-row items-end justify-between border-b border-border pb-5 mt-4 gap-3">
            <div className="flex flex-col gap-2.5">
              <div className="h-7 w-20 bg-border animate-pulse" />
              <div className="h-2.5 w-36 bg-border animate-pulse" />
            </div>
            <div className="h-9 w-28 bg-border animate-pulse shrink-0" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={`stat-${i}`} className="p-5 border border-border bg-surface flex flex-col gap-3">
                <div className="h-2 w-24 bg-border animate-pulse" />
                <div className="h-7 w-10 bg-border animate-pulse" />
              </div>
            ))}
          </div>

          {/* Job list */}
          <div className="flex flex-col gap-4">
            <div className="h-2.5 w-32 bg-border animate-pulse" />
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-10 bg-surface border border-border animate-pulse" />
                <div className="h-10 w-16 bg-border animate-pulse shrink-0" />
              </div>
              <div className="flex gap-2 overflow-hidden">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={`pill-${i}`} className="h-9 w-20 shrink-0 bg-border animate-pulse" />
                ))}
              </div>
            </div>
            <div className="border border-border bg-surface">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={`row-${i}`} className="p-4 border-b border-border last:border-b-0 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="h-4 w-28 bg-border animate-pulse" />
                      <div className="h-2.5 w-20 bg-border animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-14 bg-border animate-pulse" />
                      <div className="h-3 w-16 bg-border animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Auto-dismiss notices after 5 seconds
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const fetchJobs = useCallback(async () => {
    const { data } = await api.get<JobApplicationsResponse>("/api/job-applications");
    setJobs(data.data ?? []);
    setError(null);
  }, []);

  // Initial load — inline to avoid react-hooks/set-state-in-effect
  useEffect(() => {
    let active = true;
    api.get<JobApplicationsResponse>("/api/job-applications")
      .then(({ data }) => {
        if (active) {
          setJobs(data.data ?? []);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(getApiErrorMessage(err, "Failed to load dashboard data."));
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  const handleSyncComplete = useCallback(
    async (syncData: SyncResponse) => {
      setNotice(syncData.message);
      try {
        await fetchJobs();
      } catch (err) {
        setError(getApiErrorMessage(err, "Sync succeeded but reloading jobs failed."));
      }
    },
    [fetchJobs],
  );

  const handleCreateJob = useCallback(
    async (payload: JobApplicationMutationPayload) => {
      setError(null);
      const { data } = await api.post<JobApplicationMutationResponse>("/api/job-applications", payload);
      setNotice(data.message ?? "Job application created successfully.");
      await fetchJobs();
    },
    [fetchJobs],
  );

  const handleUpdateJob = useCallback(
    async (jobId: string, payload: JobApplicationMutationPayload) => {
      setError(null);
      const { data } = await api.put<JobApplicationMutationResponse>(`/api/job-applications/${jobId}`, payload);
      setNotice(data.message ?? "Job application updated successfully.");
      await fetchJobs();
    },
    [fetchJobs],
  );

  const handleDeleteJob = useCallback(
    async (jobId: string) => {
      setError(null);
      const { data } = await api.delete<DeleteJobResponse>(`/api/job-applications/${jobId}`);
      setNotice(data.message ?? "Job application deleted successfully.");
      await fetchJobs();
    },
    [fetchJobs],
  );

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 w-full px-4 sm:px-6 md:px-10 xl:px-16 py-6 sm:py-8">
          <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex flex-col gap-8 w-full"
        >
          {error ? (
            <div className="border border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 px-4 py-3 text-sm">{error}</div>
          ) : null}

          {notice ? (
            <div className="border border-border bg-surface px-4 py-3 text-sm text-muted">
              {notice}
            </div>
          ) : null}

          <div className="flex flex-row items-end justify-between border-b border-border pb-5 mt-4 gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-sans font-bold mb-1 tracking-tight text-primary">
                Pipeline
              </h1>
              <p className="text-muted text-xs font-mono uppercase tracking-widest inline-block mt-1">
                {jobs.length} Active Applications
              </p>
            </div>
            <SyncButton onSyncComplete={handleSyncComplete} />
          </div>

          <StatsRow data={jobs} />

          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted">Recent Activity</h2>
            <JobTable
              jobs={jobs}
              onCreateJob={handleCreateJob}
              onUpdateJob={handleUpdateJob}
              onDeleteJob={handleDeleteJob}
            />
          </div>
        </m.div>
      </main>
    </>
  );
}
