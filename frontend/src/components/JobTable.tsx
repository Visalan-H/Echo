import { m } from "framer-motion";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
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
  userEmail: string;
};

type SortField = "companyName" | "jobRole" | "status" | "applicationDate";
type SortDirection = "asc" | "desc";

type JobFormState = {
  companyName: string;
  jobRole: string;
  status: JobStatus;
  notes: string;
};

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
  return { companyName: "", jobRole: "", status: "Applied", notes: "" };
}

function normalizeStatus(status: string): JobStatus {
  if (knownStatuses.includes(status as JobStatus)) {
    return status as JobStatus;
  }
  return "Applied";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type StatusFilterPillsProps = {
  options: string[];
  activeStatus: string;
  onChange: (status: string) => void;
};

function StatusFilterPills({ options, activeStatus, onChange }: StatusFilterPillsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-0.5">
      {options.map((status) => {
        const isActive = activeStatus === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            className={`shrink-0 px-4 py-2.5 border text-xs font-mono uppercase tracking-widest transition-colors rounded-none ${
              isActive
                ? "border-primary bg-primary text-base"
                : "border-border bg-surface text-muted hover:text-primary hover:border-primary"
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
    <form onSubmit={onSubmit} className="border border-border bg-surface p-4 flex flex-col gap-3">
      <h3 className="text-xs font-mono uppercase tracking-widest text-muted">
        {editingJobId ? "Edit Application" : "New Application"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          value={formState.companyName}
          onChange={(e) => onFieldChange("companyName", e.target.value)}
          placeholder="Company Name"
          className="w-full border border-border bg-base text-[16px] px-3 py-2.5 text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
          required
        />
        <input
          type="text"
          value={formState.jobRole}
          onChange={(e) => onFieldChange("jobRole", e.target.value)}
          placeholder="Role"
          className="w-full border border-border bg-base text-[16px] px-3 py-2.5 text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-3">
        <select
          value={formState.status}
          onChange={(e) => onFieldChange("status", e.target.value)}
          className="w-full border border-border bg-base text-[16px] px-3 py-2.5 text-primary focus:outline-none focus:border-accent transition-colors"
        >
          {knownStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={formState.notes}
          onChange={(e) => onFieldChange("notes", e.target.value)}
          placeholder="Notes (optional)"
          className="w-full border border-border bg-base text-[16px] px-3 py-2.5 text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      {formError ? (
        <div className="border border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 px-3 py-2 text-xs">{formError}</div>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-3 py-1.5 border border-border bg-base text-xs font-mono uppercase tracking-widest text-muted hover:text-primary transition-colors disabled:opacity-70 disabled:cursor-not-allowed rounded-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-3 py-1.5 border border-primary bg-primary text-base text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed rounded-none"
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
  onClick: (field: SortField) => void;
};

function SortHeaderButton({ label, field, sortField, sortDirection, onClick }: SortHeaderButtonProps) {
  const isActive = sortField === field;
  const Icon = !isActive ? ChevronsUpDown : sortDirection === "asc" ? ChevronUp : ChevronDown;

  return (
    <button
      type="button"
      onClick={() => onClick(field)}
      className="inline-flex items-center gap-1.5 hover:text-primary transition-colors whitespace-nowrap"
    >
      <span>{label}</span>
      <Icon className="w-3 h-3" />
    </button>
  );
}

type JobRowProps = {
  job: JobApplication;
  userEmail: string;
  deletingJobId: string | null;
  confirmingDeleteId: string | null;
  editingJobId: string | null;
  formState: JobFormState;
  formError: string | null;
  isSubmitting: boolean;
  onEdit: (job: JobApplication) => void;
  onDelete: (job: JobApplication) => void;
  onConfirmDelete: (job: JobApplication) => void;
  onCancelDelete: () => void;
  onFieldChange: (field: keyof JobFormState, value: string) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (event: FormEvent<HTMLFormElement>) => void;
};

function JobRow({ job, userEmail, deletingJobId, confirmingDeleteId, editingJobId, formState, formError, isSubmitting, onEdit, onDelete, onConfirmDelete, onCancelDelete, onFieldChange, onCancelEdit, onSubmitEdit }: JobRowProps) {
  const isConfirming = confirmingDeleteId === job._id;
  const isDeleting = deletingJobId === job._id;
  const isEditing = editingJobId === job._id;

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`group relative flex flex-col p-4 gap-3 border-b border-border last:border-b-0 transition-colors duration-150 ease-out ${
        isConfirming
          ? "bg-rose-50 dark:bg-red-950/10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-6"
          : isEditing
          ? "bg-surface"
          : "hover:bg-base lg:grid lg:grid-cols-[2fr_2fr_1fr_1fr_260px] lg:gap-4 lg:items-center"
      }`}
    >
      {!isConfirming && !isEditing && (
        <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-0.5 bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out" />
      )}

      {isEditing ? (
        /* ── Inline edit form ── */
        <form onSubmit={onSubmitEdit} className="flex flex-col gap-3 w-full">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted">
              Editing — {job.companyName}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={formState.companyName}
              onChange={(e) => onFieldChange("companyName", e.target.value)}
              placeholder="Company Name"
              className="w-full border border-border bg-base text-[16px] px-3 py-2.5 text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
              required
            />
            <input
              type="text"
              value={formState.jobRole}
              onChange={(e) => onFieldChange("jobRole", e.target.value)}
              placeholder="Role"
              className="w-full border border-border bg-base text-[16px] px-3 py-2.5 text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-3">
            <select
              value={formState.status}
              onChange={(e) => onFieldChange("status", e.target.value)}
              className="w-full border border-border bg-base text-[16px] px-3 py-2.5 text-primary focus:outline-none focus:border-accent transition-colors"
            >
              {knownStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              type="text"
              value={formState.notes}
              onChange={(e) => onFieldChange("notes", e.target.value)}
              placeholder="Notes (optional)"
              className="w-full border border-border bg-base text-[16px] px-3 py-2.5 text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {formError ? (
            <div className="border border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 px-3 py-2 text-xs">{formError}</div>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isSubmitting}
              className="px-3 py-1.5 border border-border bg-base text-xs font-mono uppercase tracking-widest text-muted hover:text-primary transition-colors disabled:opacity-70 disabled:cursor-not-allowed rounded-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 border border-primary bg-primary text-base text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed rounded-none"
            >
              {isSubmitting ? "Saving..." : "Update"}
            </button>
          </div>
        </form>
      ) : isConfirming ? (
        /* ── Confirmation state: full-row prompt ── */
        <>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary truncate">
                {job.companyName}
              </p>
              <p className="text-xs font-mono text-muted uppercase tracking-widest truncate">
                {job.jobRole}
              </p>
            </div>
            <span className="hidden sm:block text-xs font-mono uppercase tracking-widest text-red-600 dark:text-red-400/70 whitespace-nowrap ml-1">
              — remove?
            </span>
          </div>
          <div className="flex items-center gap-2 justify-start lg:justify-end shrink-0">
            <button
              type="button"
              onClick={() => onConfirmDelete(job)}
              disabled={isDeleting}
              className="px-5 py-2 border border-red-300 bg-red-50 text-xs font-mono uppercase tracking-widest text-red-700 hover:text-red-900 hover:border-red-400 hover:bg-red-100 dark:border-red-700/60 dark:bg-red-950/30 dark:text-red-400 dark:hover:text-red-300 dark:hover:border-red-500 dark:hover:bg-red-950/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed rounded-none"
            >
              {isDeleting ? "Deleting..." : "Confirm"}
            </button>
            <button
              type="button"
              onClick={onCancelDelete}
              disabled={isDeleting}
              className="px-5 py-2 border border-border text-xs font-mono uppercase tracking-widest text-muted hover:text-primary hover:border-primary transition-colors disabled:opacity-60 rounded-none bg-transparent"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        /* ── Normal state ── */
        <>
          <div className="flex justify-between items-start lg:block">
            <div className="font-semibold text-[16px] leading-tight wrap-break-word text-primary">
              {job.companyName || "Unknown Company"}
            </div>
            <div className="lg:hidden text-muted font-mono text-xs mt-0.5 whitespace-nowrap">
              {formatDate(job.applicationDate)}
            </div>
          </div>

          <div className="text-muted wrap-break-word uppercase tracking-widest font-mono text-xs">
            {job.jobRole}
          </div>

          <div className="mt-1 lg:mt-0">
            <StatusBadge status={job.status} />
          </div>

          <div className="hidden lg:block text-left text-muted font-mono text-xs whitespace-nowrap">
            {formatDate(job.applicationDate)}
          </div>

          <div className="flex items-center gap-1.5 mt-2 lg:mt-0">
            <button
              type="button"
              onClick={() => onEdit(job)}
              className="shrink-0 px-3 py-1.5 border border-border text-[10px] uppercase tracking-widest font-mono text-muted hover:text-primary hover:border-primary transition-colors rounded-none bg-transparent"
            >
              Edit
            </button>
            {job.emailId && (
              <button
                type="button"
                onClick={() => {
  const url = `https://mail.google.com/mail/u/0/?authuser=${encodeURIComponent(userEmail)}#all/${job.emailId}`;
                  window.open(url, "_blank");
                }}
                className="shrink-0 px-3 py-1.5 border border-border text-[10px] uppercase tracking-widest font-mono text-muted hover:text-primary hover:border-primary transition-colors rounded-none bg-transparent"
              >
                View Email
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(job)}
              className="shrink-0 px-3 py-1.5 border border-red-900/50 text-[10px] uppercase tracking-widest font-mono text-red-500 hover:text-red-400 hover:border-red-500 transition-colors rounded-none bg-transparent"
            >
              Delete
            </button>
          </div>

          {job.notes ? (
            <div className="mt-1 lg:mt-0 lg:col-span-1 lg:col-start-1 lg:-mb-1">
              <p className="text-sm leading-relaxed text-muted">{job.notes}</p>
            </div>
          ) : null}
        </>
      )}
    </m.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function JobTable({ jobs, userEmail, onCreateJob, onUpdateJob, onDeleteJob }: JobTableProps) {
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("applicationDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [formState, setFormState] = useState<JobFormState>(getDefaultFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  // Derived data
  const statusOptions = useMemo(() => {
    const unique = new Set<string>(knownStatuses);
    jobs.forEach((job) => {
      const s = job.status.trim();
      if (s) unique.add(s);
    });
    return ["All", ...Array.from(unique)];
  }, [jobs]);

  const filteredAndSortedJobs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = jobs.filter((job) => {
      const matchesStatus = statusFilter === "All" || job.status === statusFilter;
      const matchesSearch =
        !q ||
        job.companyName.toLowerCase().includes(q) ||
        job.jobRole.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
    const sorted = [...filtered].sort((a, b) => {
      if (sortField === "applicationDate") {
        return new Date(a.applicationDate).getTime() - new Date(b.applicationDate).getTime();
      }
      const aVal = String(a[sortField] ?? "").toLowerCase();
      const bVal = String(b[sortField] ?? "").toLowerCase();
      return aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: "base" });
    });
    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [jobs, statusFilter, searchQuery, sortDirection, sortField]);

  // Handlers
  function handleToggleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "applicationDate" ? "desc" : "asc");
    }
  }

  function openAddForm() {
    setIsFormOpen(true);
    setEditingJobId(null);
    setFormState(getDefaultFormState());
    setFormError(null);
  }

  function openEditForm(job: JobApplication) {
    setIsFormOpen(false);
    setEditingJobId(job._id);
    setFormState({
      companyName: job.companyName,
      jobRole: job.jobRole,
      status: normalizeStatus(job.status),
      notes: job.notes ?? "",
    });
    setFormError(null);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingJobId(null);
    setFormState(getDefaultFormState());
    setFormError(null);
  }

  function handleFieldChange(field: keyof JobFormState, value: string) {
    setFormState((prev) => ({
      ...prev,
      [field]: field === "status" ? normalizeStatus(value) : value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const companyName = formState.companyName.trim();
    const jobRole = formState.jobRole.trim();
    const notes = formState.notes.trim();

    if (companyName.length < 2) {
      setFormError("Company name must be at least 2 characters.");
      return;
    }
    if (jobRole.length < 2) {
      setFormError("Role must be at least 2 characters.");
      return;
    }

    const payload: JobApplicationMutationPayload = {
      companyName,
      jobRole,
      status: formState.status,
      notes: notes || undefined,
    };

    setFormError(null);
    setIsSubmitting(true);

    const action = editingJobId ? onUpdateJob(editingJobId, payload) : onCreateJob(payload);

    void Promise.resolve(action)
      .then(() => closeForm())
      .catch((err) => setFormError(getApiErrorMessage(err, "Failed to save job application.")))
      .finally(() => setIsSubmitting(false));
  }

  function handleDelete(job: JobApplication) {
    if (!job._id) return;

    setFormError(null);
    setDeletingJobId(job._id);
    setConfirmingDeleteId(null);

    const currentEditId = editingJobId;

    void Promise.resolve(onDeleteJob(job._id))
      .then(() => {
        if (currentEditId === job._id) closeForm();
      })
      .catch((err) => setFormError(getApiErrorMessage(err, "Failed to delete job application.")))
      .finally(() => setDeletingJobId(null));
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-stretch gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies or roles..."
            className="w-full h-full border border-border bg-base text-[16px] pl-9 pr-9 py-2.5 text-primary placeholder:text-muted focus:outline-none outline-none ring-0 focus:ring-0 focus:border-accent transition-colors font-sans"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-muted hover:text-primary transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={openAddForm}
            className="shrink-0 px-4 border border-primary bg-primary text-base text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity rounded-none"
          >
            + Add
          </button>
        </div>
        <StatusFilterPills options={statusOptions} activeStatus={statusFilter} onChange={setStatusFilter} />
      </div>

      {isFormOpen && !editingJobId ? (
        <JobFormPanel
          editingJobId={null}
          formState={formState}
          formError={formError}
          isSubmitting={isSubmitting}
          onFieldChange={handleFieldChange}
          onCancel={closeForm}
          onSubmit={handleSubmit}
        />
      ) : null}

<div className="flex justify-between items-center text-sm uppercase tracking-widest font-mono text-muted">
        <span>{filteredAndSortedJobs.length} matching records</span>
      </div>

      {jobs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="w-full text-left border border-border bg-surface overflow-hidden">
          <div className="hidden lg:grid grid-cols-[2fr_2fr_1fr_1fr_260px] px-4 py-3 gap-4 text-xs uppercase tracking-widest font-mono text-muted border-b border-border">
            <SortHeaderButton
              label="Company"
              field="companyName"
              sortField={sortField}
              sortDirection={sortDirection}
              onClick={handleToggleSort}
            />
            <SortHeaderButton
              label="Role"
              field="jobRole"
              sortField={sortField}
              sortDirection={sortDirection}
              onClick={handleToggleSort}
            />
            <SortHeaderButton
              label="Status"
              field="status"
              sortField={sortField}
              sortDirection={sortDirection}
              onClick={handleToggleSort}
            />
            <SortHeaderButton
              label="Date"
              field="applicationDate"
              sortField={sortField}
              sortDirection={sortDirection}
              onClick={handleToggleSort}
            />
            <div className="flex items-center">Actions</div>
          </div>

          <div className="flex flex-col">
            {filteredAndSortedJobs.length === 0 ? (
              <div className="py-16 px-6 text-center">
                <h3 className="font-mono text-sm tracking-widest uppercase mb-3 text-muted">
                  No Matches
                </h3>
                <p className="text-primary text-lg tracking-tight">
                  No applications match your current filters.
                </p>
              </div>
            ) : (
              filteredAndSortedJobs.map((job) => (
                <JobRow
                  key={job._id ?? `${job.companyName}-${job.applicationDate}`}
                  job={job}
                  userEmail={userEmail}
                  deletingJobId={deletingJobId}
                  confirmingDeleteId={confirmingDeleteId}
                  editingJobId={editingJobId}
                  formState={formState}
                  formError={formError}
                  isSubmitting={isSubmitting}
                  onEdit={openEditForm}
                  onDelete={(j) => setConfirmingDeleteId(j._id)}
                  onConfirmDelete={handleDelete}
                  onCancelDelete={() => setConfirmingDeleteId(null)}
                  onFieldChange={handleFieldChange}
                  onCancelEdit={closeForm}
                  onSubmitEdit={handleSubmit}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
