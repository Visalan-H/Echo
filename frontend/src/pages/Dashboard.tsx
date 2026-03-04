import { useEffect, useReducer } from "react";
import api from "../utils/api";
import { getApiErrorMessage } from "../utils/api";
import { LazyMotion, domAnimation, m } from "framer-motion";
import StatsRow from "../components/StatsRow";
import JobTable from "../components/JobTable";
import SyncButton from "../components/SyncButton";
import Navbar from "../components/Navbar";
import type {
  JobApplication,
  JobApplicationMutationPayload,
  JobApplicationMutationResponse,
  JobApplicationsResponse,
  SyncResponse,
} from "../types/api";
import { useCallback } from "react";

type DeleteJobResponse = {
  success: boolean;
  message: string;
};

type DashboardState = {
  jobs: JobApplication[];
  loading: boolean;
  error: string | null;
  notice: string | null;
};

type DashboardAction =
  | { type: "load_success"; jobs: JobApplication[] }
  | { type: "load_error"; error: string }
  | { type: "set_jobs"; jobs: JobApplication[] }
  | { type: "set_error"; error: string | null }
  | { type: "set_notice"; notice: string | null };

const initialState: DashboardState = {
  jobs: [],
  loading: true,
  error: null,
  notice: null,
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "load_success":
      return { ...state, jobs: action.jobs, error: null, loading: false };
    case "load_error":
      return { ...state, error: action.error, loading: false };
    case "set_jobs":
      return { ...state, jobs: action.jobs };
    case "set_error":
      return { ...state, error: action.error };
    case "set_notice":
      return { ...state, notice: action.notice };
    default:
      return state;
  }
}

export default function Dashboard() {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  const fetchJobs = useCallback(() => {
    return api.get<JobApplicationsResponse>("/api/job-applications").then((jobsRes) => {
      dispatch({ type: "set_jobs", jobs: jobsRes.data.data ?? [] });
    });
  }, []);

  useEffect(() => {
    let active = true;

    void api.get<JobApplicationsResponse>("/api/job-applications")
      .then((jobsRes) => {
        if (!active) {
          return;
        }
        dispatch({ type: "load_success", jobs: jobsRes.data.data ?? [] });
      })
      .catch((errorResponse) => {
        if (!active) {
          return;
        }
        dispatch({
          type: "load_error",
          error: getApiErrorMessage(errorResponse, "Failed to load dashboard data."),
        });
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSyncComplete = useCallback((syncData: SyncResponse) => {
    dispatch({ type: "set_notice", notice: syncData.message });
    return fetchJobs().catch((errorResponse) => {
      dispatch({
        type: "set_error",
        error: getApiErrorMessage(errorResponse, "Sync succeeded but reloading jobs failed."),
      });
    });
  }, [fetchJobs]);

  const handleCreateJob = useCallback(async (payload: JobApplicationMutationPayload) => {
    dispatch({ type: "set_error", error: null });
    const { data } = await api.post<JobApplicationMutationResponse>("/api/job-applications", payload);
    dispatch({ type: "set_notice", notice: data.message ?? "Job application created successfully." });
    await fetchJobs();
  }, [fetchJobs]);

  const handleUpdateJob = useCallback(async (jobId: string, payload: JobApplicationMutationPayload) => {
    dispatch({ type: "set_error", error: null });
    const { data } = await api.put<JobApplicationMutationResponse>(`/api/job-applications/${jobId}`, payload);
    dispatch({ type: "set_notice", notice: data.message ?? "Job application updated successfully." });
    await fetchJobs();
  }, [fetchJobs]);

  const handleDeleteJob = useCallback(async (jobId: string) => {
    dispatch({ type: "set_error", error: null });
    const { data } = await api.delete<DeleteJobResponse>(`/api/job-applications/${jobId}`);
    dispatch({ type: "set_notice", notice: data.message ?? "Job application deleted successfully." });
    await fetchJobs();
  }, [fetchJobs]);

  if (state.loading) {
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
        <LazyMotion features={domAnimation}>
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col gap-8 w-full"
          >
            {state.error ? (
              <div className="border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                {state.error}
              </div>
            ) : null}

            {state.notice ? (
              <div className="border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-muted)]">
                {state.notice}
              </div>
            ) : null}

            <div className="flex flex-row items-end justify-between border-b border-[var(--color-border)] pb-5 mt-4 gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-sans font-bold mb-1 tracking-tight text-[var(--color-primary)]">Pipeline</h1>
                <p className="text-[var(--color-muted)] text-xs font-mono uppercase tracking-widest inline-block mt-1">
                  {state.jobs.length} Active Applications
                </p>
              </div>
              <SyncButton onSyncComplete={handleSyncComplete} />
            </div>

            <StatsRow data={state.jobs} />

            <div className="flex flex-col gap-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)]">Recent Activity</h2>
              <JobTable
                jobs={state.jobs}
                onCreateJob={handleCreateJob}
                onUpdateJob={handleUpdateJob}
                onDeleteJob={handleDeleteJob}
              />
            </div>
          </m.div>
        </LazyMotion>
      </main>
    </>
  );
}
