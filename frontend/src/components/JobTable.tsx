import { LazyMotion, domAnimation, m } from "framer-motion";
import { useMemo, useReducer, type FormEvent } from "react";
import StatusBadge from "./StatusBadge";
import EmptyState from "./EmptyState";
import type {
  JobApplication,
  JobApplicationMutationPayload,
  JobStatus,
} from "../types/api";
import { getApiErrorMessage } from "../utils/api";

type JobTableProps = {
  jobs: JobApplication[];
  onCreateJob: (payload: JobApplicationMutationPayload) => Promise<void> | void;
  onUpdateJob: (jobId: string, payload: JobApplicationMutationPayload) => Promise<void> | void;
  onDeleteJob: (jobId: string) => Promise<void> | void;
};

type SortField = "companyName" | "jobRole" | "status" | "applicationDate";
type SortDirection = "asc" | "desc";
type JobFormState = {
  companyName: string;
  jobRole: string;
  status: JobStatus;
  notes: string;
};

type TableState = {
  statusFilter: string;
  sortField: SortField;
  sortDirection: SortDirection;
  isFormOpen: boolean;
  editingJobId: string | null;
  formState: JobFormState;
  formError: string | null;
  isSubmitting: boolean;
  deletingJobId: string | null;
};

type TableAction =
  | { type: "set_status_filter"; value: string }
  | { type: "toggle_sort"; field: SortField }
  | { type: "open_add_form" }
  | { type: "open_edit_form"; job: JobApplication }
  | { type: "close_form" }
  | { type: "set_form_field"; field: keyof JobFormState; value: string }
  | { type: "set_form_error"; value: string | null }
  | { type: "set_submitting"; value: boolean }
  | { type: "set_deleting_job_id"; value: string | null };

const knownStatuses: JobStatus[] = ["Applied", "Interviewing", "Offered", "Rejected"];

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

function getDefaultFormState(): JobFormState {
  return {
    companyName: "",
    jobRole: "",
    status: "Applied",
    notes: "",
  };
}

function normalizeStatus(status: string): JobStatus {
  if (knownStatuses.includes(status as JobStatus)) {
    return status as JobStatus;
  }
  return "Applied";
}

const initialState: TableState = {
  statusFilter: "All",
  sortField: "applicationDate",
  sortDirection: "desc",
  isFormOpen: false,
  editingJobId: null,
  formState: getDefaultFormState(),
  formError: null,
  isSubmitting: false,
  deletingJobId: null,
};

function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case "set_status_filter":
      return { ...state, statusFilter: action.value };
    case "toggle_sort":
      if (state.sortField === action.field) {
        return {
          ...state,
          sortDirection: state.sortDirection === "asc" ? "desc" : "asc",
        };
      }
      return {
        ...state,
        sortField: action.field,
        sortDirection: action.field === "applicationDate" ? "desc" : "asc",
      };
    case "open_add_form":
      return {
        ...state,
        isFormOpen: true,
        editingJobId: null,
        formState: getDefaultFormState(),
        formError: null,
      };
    case "open_edit_form":
      return {
        ...state,
        isFormOpen: true,
        editingJobId: action.job._id,
        formState: {
          companyName: action.job.companyName,
          jobRole: action.job.jobRole,
          status: normalizeStatus(action.job.status),
          notes: action.job.notes ?? "",
        },
        formError: null,
      };
    case "close_form":
      return {
        ...state,
        isFormOpen: false,
        editingJobId: null,
        formState: getDefaultFormState(),
        formError: null,
      };
    case "set_form_field":
      return {
        ...state,
        formState: {
          ...state.formState,
          [action.field]:
            action.field === "status" ? normalizeStatus(action.value) : action.value,
        },
      };
    case "set_form_error":
      return { ...state, formError: action.value };
    case "set_submitting":
      return { ...state, isSubmitting: action.value };
    case "set_deleting_job_id":
      return { ...state, deletingJobId: action.value };
    default:
      return state;
  }
}

type StatusFilterPillsProps = {
  options: string[];
  activeStatus: string;
  onChange: (status: string) => void;
};

function StatusFilterPills({ options, activeStatus, onChange }: StatusFilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((status) => {
        const isActive = activeStatus === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            className={`px-3 py-1.5 border text-xs font-mono uppercase tracking-widest transition-colors rounded-none ${
              isActive
                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-base)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]"
            }`}
          >
            {status}
          </button>
        );
      })}
    </div>
  );
}

type JobFormPanelProps = {
  editingJobId: string | null;
  formState: JobFormState;
  formError: string | null;
  isSubmitting: boolean;
  onFieldChange: (field: keyof JobFormState, value: string) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function JobFormPanel({
  editingJobId,
  formState,
  formError,
  isSubmitting,
  onFieldChange,
  onCancel,
  onSubmit,
}: JobFormPanelProps) {
  return (
    <form onSubmit={onSubmit} className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-3">
      <h3 className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)]">
        {editingJobId ? "Edit Application" : "New Application"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          value={formState.companyName}
          onChange={(event) => onFieldChange("companyName", event.target.value)}
          placeholder="Company Name"
          className="w-full border border-[var(--color-border)] bg-[var(--color-base)] text-sm px-3 py-2 text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          required
        />

        <input
          type="text"
          value={formState.jobRole}
          onChange={(event) => onFieldChange("jobRole", event.target.value)}
          placeholder="Role"
          className="w-full border border-[var(--color-border)] bg-[var(--color-base)] text-sm px-3 py-2 text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-3">
        <select
          value={formState.status}
          onChange={(event) => onFieldChange("status", event.target.value)}
          className="w-full border border-[var(--color-border)] bg-[var(--color-base)] text-sm px-3 py-2 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
        >
          {knownStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={formState.notes}
          onChange={(event) => onFieldChange("notes", event.target.value)}
          placeholder="Notes (optional)"
          className="w-full border border-[var(--color-border)] bg-[var(--color-base)] text-sm px-3 py-2 text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
        />
      </div>

      {formError ? (
        <div className="border border-red-900 bg-red-950/30 px-3 py-2 text-xs text-red-300">
          {formError}
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-3 py-1.5 border border-[var(--color-border)] bg-[var(--color-base)] text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed rounded-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-3 py-1.5 border border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-base)] text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed rounded-none"
        >
          {isSubmitting ? "Saving..." : editingJobId ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}

type SortHeaderButtonProps = {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
  align?: "left" | "right";
  onClick: (field: SortField) => void;
};

function SortHeaderButton({
  label,
  field,
  sortField,
  sortDirection,
  align = "left",
  onClick,
}: SortHeaderButtonProps) {
  const indicator = sortField !== field ? "><" : sortDirection === "asc" ? "^" : "v";
  const wrapperClass = align === "right" ? "text-right" : "";
  const buttonClass = align === "right"
    ? "inline-flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors justify-end whitespace-nowrap"
    : "inline-flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors whitespace-nowrap";

  return (
    <div className={wrapperClass}>
      <button type="button" onClick={() => onClick(field)} className={buttonClass}>
        <span>{label}</span>
        <span>{indicator}</span>
      </button>
    </div>
  );
}

type JobRowProps = {
  job: JobApplication;
  deletingJobId: string | null;
  onEdit: (job: JobApplication) => void;
  onDelete: (job: JobApplication) => void;
};

function JobRow({ job, deletingJobId, onEdit, onDelete }: JobRowProps) {
  return (
    <m.div
      key={job._id ?? `${job.companyName}-${job.applicationDate}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group relative flex flex-col p-4 gap-3 text-sm border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-base)] transition-colors duration-[150ms] ease-out lg:grid lg:grid-cols-[2fr_2fr_1fr_1fr_auto] lg:gap-0 lg:items-center"
    >
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-[150ms] ease-out" />

      <div className="grid grid-cols-[1fr_auto] gap-2 items-start lg:contents">
        <div
          className="font-semibold text-base lg:text-sm leading-tight break-words"
          style={{ color: "var(--primary)" }}
        >
          {job.companyName || "Unknown Company"}
        </div>
        <div className="lg:hidden text-[var(--color-muted)] font-mono text-xs mt-0.5 whitespace-nowrap">
          {formatDate(job.applicationDate)}
        </div>
      </div>

      <div className="text-[var(--color-muted)] break-words pr-4 uppercase tracking-widest font-mono text-xs">
        {job.jobRole}
      </div>

      <div className="mt-1 lg:mt-0">
        <StatusBadge status={job.status} />
      </div>

      <div className="hidden lg:block text-right text-[var(--color-muted)] font-mono text-xs whitespace-nowrap">
        {formatDate(job.applicationDate)}
      </div>

      <div className="flex items-center justify-start lg:justify-end gap-2">
        <button
          type="button"
          onClick={() => onEdit(job)}
          className="px-2.5 py-1 border border-[var(--color-border)] text-[10px] uppercase tracking-widest font-mono text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors rounded-none bg-transparent"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(job)}
          disabled={deletingJobId === job._id}
          className="px-2.5 py-1 border border-red-800 text-[10px] uppercase tracking-widest font-mono text-red-400 hover:text-red-300 hover:border-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed rounded-none bg-transparent"
        >
          {deletingJobId === job._id ? "Deleting..." : "Delete"}
        </button>
      </div>
    </m.div>
  );
}

export default function JobTable({ jobs, onCreateJob, onUpdateJob, onDeleteJob }: JobTableProps) {
  const [state, dispatch] = useReducer(tableReducer, initialState);

  const statusOptions = useMemo(() => {
    const uniqueStatuses = new Set<string>(knownStatuses);
    jobs.forEach((job) => {
      const normalizedStatus = job.status.trim();
      if (normalizedStatus) {
        uniqueStatuses.add(normalizedStatus);
      }
    });
    return ["All", ...Array.from(uniqueStatuses)];
  }, [jobs]);

  const filteredAndSortedJobs = useMemo(() => {
    const filtered = jobs.filter((job) => state.statusFilter === "All" || job.status === state.statusFilter);
    const sorted = [...filtered].sort((left, right) => {
      if (state.sortField === "applicationDate") {
        const leftDate = new Date(left.applicationDate).getTime();
        const rightDate = new Date(right.applicationDate).getTime();
        return leftDate - rightDate;
      }
      const leftValue = String(left[state.sortField] ?? "").toLowerCase();
      const rightValue = String(right[state.sortField] ?? "").toLowerCase();
      return leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: "base" });
    });
    return state.sortDirection === "asc" ? sorted : sorted.reverse();
  }, [jobs, state.statusFilter, state.sortDirection, state.sortField]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const companyName = state.formState.companyName.trim();
    const jobRole = state.formState.jobRole.trim();
    const notes = state.formState.notes.trim();

    if (companyName.length < 2) {
      dispatch({ type: "set_form_error", value: "Company name must be at least 2 characters." });
      return;
    }
    if (jobRole.length < 2) {
      dispatch({ type: "set_form_error", value: "Role must be at least 2 characters." });
      return;
    }

    const payload: JobApplicationMutationPayload = {
      companyName,
      jobRole,
      status: state.formState.status,
      notes: notes || undefined,
    };

    dispatch({ type: "set_form_error", value: null });
    dispatch({ type: "set_submitting", value: true });

    void Promise.resolve()
      .then(() => {
        if (state.editingJobId) {
          return onUpdateJob(state.editingJobId, payload);
        }
        return onCreateJob(payload);
      })
      .then(() => {
        dispatch({ type: "close_form" });
      })
      .catch((errorResponse) => {
        dispatch({
          type: "set_form_error",
          value: getApiErrorMessage(errorResponse, "Failed to save job application."),
        });
      })
      .finally(() => {
        dispatch({ type: "set_submitting", value: false });
      });
  };

  const handleDelete = (job: JobApplication) => {
    if (!job._id) {
      return;
    }
    const confirmed = window.confirm(`Delete ${job.companyName} - ${job.jobRole}?`);
    if (!confirmed) {
      return;
    }

    dispatch({ type: "set_form_error", value: null });
    dispatch({ type: "set_deleting_job_id", value: job._id });

    const currentEditingJobId = state.editingJobId;
    void Promise.resolve()
      .then(() => onDeleteJob(job._id))
      .then(() => {
        if (currentEditingJobId === job._id) {
          dispatch({ type: "close_form" });
        }
      })
      .catch((errorResponse) => {
        dispatch({
          type: "set_form_error",
          value: getApiErrorMessage(errorResponse, "Failed to delete job application."),
        });
      })
      .finally(() => {
        dispatch({ type: "set_deleting_job_id", value: null });
      });
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <StatusFilterPills
          options={statusOptions}
          activeStatus={state.statusFilter}
          onChange={(status) => dispatch({ type: "set_status_filter", value: status })}
        />
        <button
          type="button"
          onClick={() => dispatch({ type: "open_add_form" })}
          className="self-start sm:self-auto px-3 py-1.5 border border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-base)] text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity rounded-none"
        >
          Add Application
        </button>
      </div>

      {state.isFormOpen ? (
        <JobFormPanel
          editingJobId={state.editingJobId}
          formState={state.formState}
          formError={state.formError}
          isSubmitting={state.isSubmitting}
          onFieldChange={(field, value) => dispatch({ type: "set_form_field", field, value })}
          onCancel={() => dispatch({ type: "close_form" })}
          onSubmit={handleSubmit}
        />
      ) : null}

      <div className="flex justify-between items-center text-xs uppercase tracking-widest font-mono text-[var(--color-muted)]">
        <span>{filteredAndSortedJobs.length} matching records</span>
      </div>

      {jobs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="w-full text-left border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          <div className="hidden lg:grid grid-cols-[2fr_2fr_1fr_1fr_auto] p-4 text-xs uppercase tracking-widest font-mono text-[var(--color-muted)] border-b border-[var(--color-border)]">
            <SortHeaderButton
              label="Company"
              field="companyName"
              sortField={state.sortField}
              sortDirection={state.sortDirection}
              onClick={(field) => dispatch({ type: "toggle_sort", field })}
            />
            <SortHeaderButton
              label="Role"
              field="jobRole"
              sortField={state.sortField}
              sortDirection={state.sortDirection}
              onClick={(field) => dispatch({ type: "toggle_sort", field })}
            />
            <SortHeaderButton
              label="Status"
              field="status"
              sortField={state.sortField}
              sortDirection={state.sortDirection}
              onClick={(field) => dispatch({ type: "toggle_sort", field })}
            />
            <SortHeaderButton
              label="Date"
              field="applicationDate"
              sortField={state.sortField}
              sortDirection={state.sortDirection}
              align="right"
              onClick={(field) => dispatch({ type: "toggle_sort", field })}
            />
            <div className="text-right">Actions</div>
          </div>

          <LazyMotion features={domAnimation}>
            <div className="flex flex-col">
              {filteredAndSortedJobs.length === 0 ? (
                <div className="py-16 px-6 text-center">
                  <h3 className="font-mono text-xs tracking-widest uppercase mb-3 text-[var(--color-muted)]">No Matches</h3>
                  <p className="text-[var(--color-primary)] text-lg tracking-tight">
                    No applications match your current filters.
                  </p>
                </div>
              ) : (
                filteredAndSortedJobs.map((job) => (
                  <JobRow
                    key={job._id ?? `${job.companyName}-${job.applicationDate}`}
                    job={job}
                    deletingJobId={state.deletingJobId}
                    onEdit={(selectedJob) => dispatch({ type: "open_edit_form", job: selectedJob })}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </LazyMotion>
        </div>
      )}
    </div>
  );
}
