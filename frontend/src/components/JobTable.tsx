import { m, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, X, Trash2, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import StatusBadge from "./StatusBadge";
import EmptyState from "./EmptyState";
import type { JobApplication, JobApplicationMutationPayload, JobStatus } from "../types/api";
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
  applicationDate: string;
};

const knownStatuses: JobStatus[] = ["Applied", "Interviewing", "Offered", "Rejected"];

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return dateFormatter.format(date);
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function getDefaultFormState(): JobFormState {
  return { companyName: "", jobRole: "", status: "Applied", notes: "", applicationDate: todayISO() };
}

function normalizeStatus(status: string): JobStatus {
  if (knownStatuses.includes(status as JobStatus)) return status as JobStatus;
  return "Applied";
}

// ---------------------------------------------------------------------------
// Checkbox — always visible, supports indeterminate and shift-click
// ---------------------------------------------------------------------------

type CheckboxProps = {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (shiftKey: boolean) => void;
  disabled?: boolean;
  label?: string;
};

function Checkbox({ checked, indeterminate, onChange, disabled, label }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={(e) => onChange((e.nativeEvent as MouseEvent).shiftKey ?? false)}
      disabled={disabled}
      className="w-3.5 h-3.5 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40 shrink-0"
    />
  );
}

// ---------------------------------------------------------------------------
// Shared form fields
// ---------------------------------------------------------------------------

type JobFormFieldsProps = {
  formState: JobFormState;
  onFieldChange: (field: keyof JobFormState, value: string) => void;
};

function JobFormFields({ formState, onFieldChange }: JobFormFieldsProps) {
  return (
    <>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select
          value={formState.status}
          onChange={(e) => onFieldChange("status", e.target.value)}
          className="w-full border border-border bg-base text-[16px] px-3 py-2.5 text-primary focus:outline-none focus:border-accent transition-colors"
        >
          {knownStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="date"
          value={formState.applicationDate}
          onChange={(e) => onFieldChange("applicationDate", e.target.value)}
          max={todayISO()}
          className="w-full border border-border bg-base text-[16px] px-3 py-2.5 text-primary focus:outline-none focus:border-accent transition-colors"
        />
        <input
          type="text"
          value={formState.notes}
          onChange={(e) => onFieldChange("notes", e.target.value)}
          placeholder="Notes (optional)"
          className="w-full border border-border bg-base text-[16px] px-3 py-2.5 text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
        />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusFilterPills({ options, activeStatus, onChange }: { options: string[]; activeStatus: string; onChange: (s: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-0.5">
      {options.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => onChange(status)}
          className={`shrink-0 px-4 py-2.5 border text-xs font-mono uppercase tracking-widest transition-colors rounded-none ${
            activeStatus === status
              ? "border-primary bg-primary text-base"
              : "border-border bg-surface text-muted hover:text-primary hover:border-primary"
          }`}
        >
          {status}
        </button>
      ))}
    </div>
  );
}

function JobFormPanel({ editingJobId, formState, formError, isSubmitting, onFieldChange, onCancel, onSubmit }: {
  editingJobId: string | null;
  formState: JobFormState;
  formError: string | null;
  isSubmitting: boolean;
  onFieldChange: (field: keyof JobFormState, value: string) => void;
  onCancel: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="border border-border bg-surface p-4 flex flex-col gap-3">
      <h3 className="text-xs font-mono uppercase tracking-widest text-muted">
        {editingJobId ? "Edit Application" : "New Application"}
      </h3>
      <JobFormFields formState={formState} onFieldChange={onFieldChange} />
      {formError && (
        <div className="border border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 px-3 py-2 text-xs">{formError}</div>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={isSubmitting}
          className="px-3 py-1.5 border border-border bg-base text-xs font-mono uppercase tracking-widest text-muted hover:text-primary transition-colors disabled:opacity-70 disabled:cursor-not-allowed rounded-none">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting}
          className="px-3 py-1.5 border border-primary bg-primary text-base text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed rounded-none">
          {isSubmitting ? "Saving..." : editingJobId ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}

function SortHeaderButton({ label, field, sortField, sortDirection, onClick }: {
  label: string; field: SortField; sortField: SortField; sortDirection: SortDirection; onClick: (f: SortField) => void;
}) {
  const isActive = sortField === field;
  const Icon = !isActive ? ChevronsUpDown : sortDirection === "asc" ? ChevronUp : ChevronDown;
  return (
    <button type="button" onClick={() => onClick(field)}
      className="inline-flex items-center gap-1.5 hover:text-primary transition-colors whitespace-nowrap">
      <span>{label}</span>
      <Icon className="w-3 h-3" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// JobRow
// ---------------------------------------------------------------------------

type JobRowProps = {
  job: JobApplication;
  rowIndex: number;
  userEmail: string;
  isSelected: boolean;
  isBulkMode: boolean;
  deletingJobId: string | null;
  confirmingDeleteId: string | null;
  editingJobId: string | null;
  formState: JobFormState;
  formError: string | null;
  isSubmitting: boolean;
  onToggleSelect: (id: string, index: number, shiftKey: boolean) => void;
  onEdit: (job: JobApplication) => void;
  onRequestDelete: (job: JobApplication) => void;
  onConfirmDelete: (job: JobApplication) => void;
  onCancelDelete: () => void;
  onFieldChange: (field: keyof JobFormState, value: string) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (e: FormEvent<HTMLFormElement>) => void;
};

function JobRow({
  job, rowIndex, userEmail, isSelected, isBulkMode,
  deletingJobId, confirmingDeleteId, editingJobId,
  formState, formError, isSubmitting,
  onToggleSelect, onEdit, onRequestDelete, onConfirmDelete, onCancelDelete,
  onFieldChange, onCancelEdit, onSubmitEdit,
}: JobRowProps) {
  const isConfirming = confirmingDeleteId === job._id;
  const isDeleting = deletingJobId === job._id;
  const isEditing = editingJobId === job._id;

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isDeleting ? 0.4 : 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`group relative flex flex-col p-4 gap-3 border-b border-border last:border-b-0 transition-colors duration-150 ease-out ${
        isDeleting ? "pointer-events-none"
        : isConfirming ? "bg-rose-50 dark:bg-red-950/10 lg:grid lg:grid-cols-[40px_1fr_auto] lg:items-center lg:gap-4"
        : isEditing ? "bg-surface"
        : isSelected ? "bg-surface lg:grid lg:grid-cols-[40px_2fr_2fr_1fr_1fr_260px] lg:gap-4 lg:items-center"
        : "hover:bg-base lg:grid lg:grid-cols-[40px_2fr_2fr_1fr_1fr_260px] lg:gap-4 lg:items-center"
      }`}
    >
      {!isConfirming && !isEditing && !isDeleting && (
        <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-0.5 bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out" />
      )}

      {/* ── Editing ── */}
      {isEditing ? (
        <form onSubmit={onSubmitEdit} className="flex flex-col gap-3 w-full">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted">Editing — {job.companyName}</span>
          </div>
          <JobFormFields formState={formState} onFieldChange={onFieldChange} />
          {formError && (
            <div className="border border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 px-3 py-2 text-xs">{formError}</div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancelEdit} disabled={isSubmitting}
              className="px-3 py-1.5 border border-border bg-base text-xs font-mono uppercase tracking-widest text-muted hover:text-primary transition-colors disabled:opacity-70 disabled:cursor-not-allowed rounded-none">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-3 py-1.5 border border-primary bg-primary text-base text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed rounded-none">
              {isSubmitting ? "Saving..." : "Update"}
            </button>
          </div>
        </form>

      ) : isDeleting ? (
        /* ── Deleting loading state ── */
        <>
          <div className="hidden lg:flex lg:items-center lg:justify-center">
            <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin" />
          </div>
          <div className="flex items-center gap-3 lg:col-span-5">
            <Loader2 className="lg:hidden w-3.5 h-3.5 text-red-400 animate-spin shrink-0" />
            <div>
              <p className="text-sm font-semibold text-primary">{job.companyName}</p>
              <p className="text-xs font-mono text-red-400 uppercase tracking-widest mt-0.5">Deleting...</p>
            </div>
          </div>
        </>

      ) : isConfirming ? (
        /* ── Confirm delete ── */
        <>
          <div className="hidden lg:flex lg:items-center lg:justify-center">
            <Checkbox checked={isSelected} onChange={(sk) => onToggleSelect(job._id, rowIndex, sk)} label={`Select ${job.companyName}`} disabled />
          </div>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary truncate">{job.companyName}</p>
              <p className="text-xs font-mono text-muted uppercase tracking-widest truncate">{job.jobRole}</p>
            </div>
            <span className="hidden sm:block text-xs font-mono uppercase tracking-widest text-red-600 dark:text-red-400/70 whitespace-nowrap ml-1">— remove?</span>
          </div>
          <div className="flex items-center gap-2 justify-start lg:justify-end shrink-0">
            <button type="button" onClick={() => onConfirmDelete(job)}
              className="px-5 py-2 border border-red-300 bg-red-50 text-xs font-mono uppercase tracking-widest text-red-700 hover:text-red-900 hover:border-red-400 hover:bg-red-100 dark:border-red-700/60 dark:bg-red-950/30 dark:text-red-400 dark:hover:text-red-300 dark:hover:border-red-500 dark:hover:bg-red-950/50 transition-colors rounded-none">
              Confirm
            </button>
            <button type="button" onClick={onCancelDelete}
              className="px-5 py-2 border border-border text-xs font-mono uppercase tracking-widest text-muted hover:text-primary hover:border-primary transition-colors rounded-none bg-transparent">
              Cancel
            </button>
          </div>
        </>

      ) : (
        /* ── Normal row ── */
        <>
          {/* Desktop checkbox — always visible */}
          <div className="hidden lg:flex lg:items-center lg:justify-center">
            <Checkbox checked={isSelected} onChange={(sk) => onToggleSelect(job._id, rowIndex, sk)} label={`Select ${job.companyName}`} />
          </div>

          <div className="flex items-start gap-3 lg:contents">
            {/* Mobile checkbox — always visible */}
            <div className="lg:hidden pt-0.5">
              <Checkbox checked={isSelected} onChange={(sk) => onToggleSelect(job._id, rowIndex, sk)} label={`Select ${job.companyName}`} />
            </div>

            <div className="flex-1 flex flex-col gap-3 lg:contents">
              <div className="flex justify-between items-start lg:block">
                <div className="font-semibold text-[16px] leading-tight wrap-break-word text-primary">
                  {job.companyName || "Unknown Company"}
                </div>
                <div className="lg:hidden text-muted font-mono text-xs mt-0.5 whitespace-nowrap">
                  {formatDate(job.applicationDate)}
                </div>
              </div>

              <div className="text-muted wrap-break-word uppercase tracking-widest font-mono text-xs">{job.jobRole}</div>

              <div className="mt-1 lg:mt-0"><StatusBadge status={job.status} /></div>

              <div className="hidden lg:block text-left text-muted font-mono text-xs whitespace-nowrap">
                {formatDate(job.applicationDate)}
              </div>

              <div className="flex items-center gap-1.5 mt-2 lg:mt-0">
                <button type="button" onClick={() => onEdit(job)}
                  className="shrink-0 px-3 py-1.5 border border-border text-[10px] uppercase tracking-widest font-mono text-muted hover:text-primary hover:border-primary transition-colors rounded-none bg-transparent">
                  Edit
                </button>
                {job.emailId && (
                  <button type="button"
                    onClick={() => window.open(`https://mail.google.com/mail/u/0/?authuser=${encodeURIComponent(userEmail)}#all/${job.emailId}`, "_blank")}
                    className="shrink-0 px-3 py-1.5 border border-border text-[10px] uppercase tracking-widest font-mono text-muted hover:text-primary hover:border-primary transition-colors rounded-none bg-transparent">
                    View Email
                  </button>
                )}
                <button type="button" onClick={() => onRequestDelete(job)}
                  className="shrink-0 px-3 py-1.5 border border-red-900/50 text-[10px] uppercase tracking-widest font-mono text-red-500 hover:text-red-400 hover:border-red-500 transition-colors rounded-none bg-transparent">
                  Delete
                </button>
              </div>

              {job.notes && (
                <div className="mt-1 lg:mt-0 lg:col-span-5 lg:col-start-2 lg:-mb-1">
                  <p className="text-sm leading-relaxed text-muted">{job.notes}</p>
                </div>
              )}
            </div>
          </div>
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

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  // Tracks the last clicked row for shift-click range selection
  const lastClickedIndexRef = useRef<number | null>(null);

  const statusOptions = useMemo(() => {
    const unique = new Set<string>(knownStatuses);
    jobs.forEach((job) => { if (job.status.trim()) unique.add(job.status.trim()); });
    return ["All", ...Array.from(unique)];
  }, [jobs]);

  const filteredAndSortedJobs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = jobs.filter((job) => {
      const matchesStatus = statusFilter === "All" || job.status === statusFilter;
      const matchesSearch = !q || job.companyName.toLowerCase().includes(q) || job.jobRole.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
    const sorted = [...filtered].sort((a, b) => {
      if (sortField === "applicationDate") {
        return new Date(a.applicationDate).getTime() - new Date(b.applicationDate).getTime();
      }
      return String(a[sortField] ?? "").toLowerCase().localeCompare(String(b[sortField] ?? "").toLowerCase(), undefined, { numeric: true, sensitivity: "base" });
    });
    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [jobs, statusFilter, searchQuery, sortDirection, sortField]);

  const visibleIds = useMemo(
    () => new Set(filteredAndSortedJobs.map((j) => j._id).filter(Boolean)),
    [filteredAndSortedJobs],
  );

  // Clear selection when filters/search change
  useEffect(() => {
    setSelectedIds(new Set());
    setShowBulkConfirm(false);
    lastClickedIndexRef.current = null;
  }, [statusFilter, searchQuery]);

  const selectedVisibleCount = [...visibleIds].filter((id) => selectedIds.has(id)).length;
  const allVisibleSelected = visibleIds.size > 0 && selectedVisibleCount === visibleIds.size;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;
  const isBulkMode = selectedIds.size > 0;

  function handleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
      setShowBulkConfirm(false);
    } else {
      setSelectedIds(new Set(visibleIds));
    }
    lastClickedIndexRef.current = null;
  }

  // Shift+click: selects a range anchored at the last clicked row.
  // The range inherits the anchor's checked state (add or remove).
  function handleToggleSelect(id: string, index: number, shiftKey: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (shiftKey && lastClickedIndexRef.current !== null) {
        const start = Math.min(lastClickedIndexRef.current, index);
        const end = Math.max(lastClickedIndexRef.current, index);
        const rangeIds = filteredAndSortedJobs.slice(start, end + 1).map((j) => j._id).filter(Boolean);
        const anchorId = filteredAndSortedJobs[lastClickedIndexRef.current]?._id;
        const anchorSelected = anchorId ? prev.has(anchorId) : true;
        rangeIds.forEach((rid) => (anchorSelected ? next.add(rid) : next.delete(rid)));
      } else {
        if (next.has(id)) { next.delete(id); } else { next.add(id); }
        lastClickedIndexRef.current = index;
      }
      return next;
    });
    setShowBulkConfirm(false);
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setShowBulkConfirm(false);
    lastClickedIndexRef.current = null;
  }

  // Keyboard shortcuts:
  //   Ctrl/Cmd+A  — select all visible rows (no-op if focused in an input)
  //   Escape      — dismiss bulk confirm, then clear selection
  //   Delete      — open bulk confirm when rows are selected
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const active = document.activeElement;
    const isTyping = active?.tagName === "INPUT" || active?.tagName === "TEXTAREA" || (active as HTMLElement)?.isContentEditable;

    if ((e.ctrlKey || e.metaKey) && e.key === "a") {
      if (isTyping) return;
      e.preventDefault();
      setSelectedIds(new Set(visibleIds));
      lastClickedIndexRef.current = null;
      return;
    }
    if (e.key === "Escape") {
      if (showBulkConfirm) { setShowBulkConfirm(false); }
      else if (selectedIds.size > 0) { clearSelection(); }
      return;
    }
    if (e.key === "Delete" && selectedIds.size > 0) {
      if (isTyping) return;
      e.preventDefault();
      setShowBulkConfirm(true);
    }
  }, [visibleIds, selectedIds, showBulkConfirm]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  async function handleBulkDelete() {
    if (isBulkDeleting) return;
    setIsBulkDeleting(true);
    setShowBulkConfirm(false);
    await Promise.allSettled([...selectedIds].map((id) => onDeleteJob(id)));
    setSelectedIds(new Set());
    setIsBulkDeleting(false);
  }

  function handleToggleSort(field: SortField) {
    if (sortField === field) { setSortDirection((d) => (d === "asc" ? "desc" : "asc")); }
    else { setSortField(field); setSortDirection(field === "applicationDate" ? "desc" : "asc"); }
  }

  function openAddForm() {
    setIsFormOpen(true); setEditingJobId(null); setFormState(getDefaultFormState()); setFormError(null);
  }

  function openEditForm(job: JobApplication) {
    setIsFormOpen(false);
    setEditingJobId(job._id);
    setFormState({
      companyName: job.companyName,
      jobRole: job.jobRole,
      status: normalizeStatus(job.status),
      notes: job.notes ?? "",
      applicationDate: job.applicationDate ? new Date(job.applicationDate).toISOString().split("T")[0] : todayISO(),
    });
    setFormError(null);
  }

  function closeForm() {
    setIsFormOpen(false); setEditingJobId(null); setFormState(getDefaultFormState()); setFormError(null);
  }

  function handleFieldChange(field: keyof JobFormState, value: string) {
    setFormState((prev) => ({ ...prev, [field]: field === "status" ? normalizeStatus(value) : value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const companyName = formState.companyName.trim();
    const jobRole = formState.jobRole.trim();
    const notes = formState.notes.trim();
    if (companyName.length < 2) { setFormError("Company name must be at least 2 characters."); return; }
    if (jobRole.length < 2) { setFormError("Role must be at least 2 characters."); return; }
    const payload: JobApplicationMutationPayload = {
      companyName, jobRole, status: formState.status,
      notes: notes || undefined,
      applicationDate: formState.applicationDate || undefined,
    };
    setFormError(null);
    setIsSubmitting(true);
    const action = editingJobId ? onUpdateJob(editingJobId, payload) : onCreateJob(payload);
    void Promise.resolve(action)
      .then(() => closeForm())
      .catch((err) => setFormError(getApiErrorMessage(err, "Failed to save job application.")))
      .finally(() => setIsSubmitting(false));
  }

  function handleConfirmDelete(job: JobApplication) {
    if (!job._id) return;
    setFormError(null);
    setDeletingJobId(job._id);
    setConfirmingDeleteId(null);
    const currentEditId = editingJobId;
    void Promise.resolve(onDeleteJob(job._id))
      .then(() => { if (currentEditId === job._id) closeForm(); })
      .catch((err) => setFormError(getApiErrorMessage(err, "Failed to delete job application.")))
      .finally(() => setDeletingJobId(null));
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* ── Toolbar ── */}
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
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-muted hover:text-primary transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button type="button" onClick={openAddForm}
            className="shrink-0 px-4 border border-primary bg-primary text-base text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity rounded-none">
            + Add
          </button>
        </div>
        <StatusFilterPills options={statusOptions} activeStatus={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* ── Add form ── */}
      {isFormOpen && !editingJobId && (
        <JobFormPanel
          editingJobId={null} formState={formState} formError={formError} isSubmitting={isSubmitting}
          onFieldChange={handleFieldChange} onCancel={closeForm} onSubmit={handleSubmit}
        />
      )}

      {/* ── Bulk action bar / record count ── */}
      <AnimatePresence mode="wait">
        {isBulkMode ? (
          <m.div key="bulk-bar"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-between px-4 py-3 border border-red-900/30 bg-red-950/10">
            <div className="flex items-center gap-3">
              <Trash2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="text-sm font-mono text-red-400">{selectedIds.size} selected</span>
            </div>
            <div className="flex items-center gap-2">
              {showBulkConfirm ? (
                <>
                  <span className="text-xs font-mono text-red-400 hidden sm:block">Are you sure?</span>
                  <button type="button" onClick={handleBulkDelete} disabled={isBulkDeleting}
                    className="flex items-center gap-1.5 px-4 py-1.5 border border-red-500 bg-red-500 text-white text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed rounded-none">
                    {isBulkDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                    {isBulkDeleting ? "Deleting..." : `Delete ${selectedIds.size}`}
                  </button>
                  <button type="button" onClick={() => setShowBulkConfirm(false)} disabled={isBulkDeleting}
                    className="px-4 py-1.5 border border-border text-xs font-mono uppercase tracking-widest text-muted hover:text-primary hover:border-primary transition-colors disabled:opacity-60 rounded-none bg-transparent">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setShowBulkConfirm(true)}
                    className="flex items-center gap-1.5 px-4 py-1.5 border border-red-900/50 text-xs font-mono uppercase tracking-widest text-red-500 hover:text-red-400 hover:border-red-500 transition-colors rounded-none bg-transparent">
                    <Trash2 className="w-3 h-3" />
                    Delete selected
                  </button>
                  <button type="button" onClick={clearSelection}
                    className="px-4 py-1.5 border border-border text-xs font-mono uppercase tracking-widest text-muted hover:text-primary hover:border-primary transition-colors rounded-none bg-transparent">
                    Clear
                  </button>
                </>
              )}
            </div>
          </m.div>
        ) : (
          <m.div key="record-count"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
            className="flex justify-between items-center text-sm uppercase tracking-widest font-mono text-muted">
            <span>{filteredAndSortedJobs.length} matching records</span>
          </m.div>
        )}
      </AnimatePresence>

      {/* ── Table ── */}
      {jobs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="w-full text-left border border-border bg-surface overflow-hidden">
          {/* Header */}
          <div className="hidden lg:grid grid-cols-[40px_2fr_2fr_1fr_1fr_260px] px-4 py-3 gap-4 text-xs uppercase tracking-widest font-mono text-muted border-b border-border">
            <div className="flex items-center justify-center">
              <Checkbox checked={allVisibleSelected} indeterminate={someVisibleSelected} onChange={handleSelectAll} label="Select all" />
            </div>
            <SortHeaderButton label="Company" field="companyName" sortField={sortField} sortDirection={sortDirection} onClick={handleToggleSort} />
            <SortHeaderButton label="Role" field="jobRole" sortField={sortField} sortDirection={sortDirection} onClick={handleToggleSort} />
            <SortHeaderButton label="Status" field="status" sortField={sortField} sortDirection={sortDirection} onClick={handleToggleSort} />
            <SortHeaderButton label="Date" field="applicationDate" sortField={sortField} sortDirection={sortDirection} onClick={handleToggleSort} />
            <div className="flex items-center">Actions</div>
          </div>

          {/* Rows */}
          <div className="flex flex-col">
            {filteredAndSortedJobs.length === 0 ? (
              <div className="py-16 px-6 text-center">
                <h3 className="font-mono text-sm tracking-widest uppercase mb-3 text-muted">No Matches</h3>
                <p className="text-primary text-lg tracking-tight">No applications match your current filters.</p>
              </div>
            ) : (
              filteredAndSortedJobs.map((job, index) => (
                <JobRow
                  key={job._id ?? `${job.companyName}-${job.applicationDate}`}
                  job={job}
                  rowIndex={index}
                  userEmail={userEmail}
                  isSelected={selectedIds.has(job._id)}
                  isBulkMode={isBulkMode}
                  deletingJobId={deletingJobId}
                  confirmingDeleteId={confirmingDeleteId}
                  editingJobId={editingJobId}
                  formState={formState}
                  formError={formError}
                  isSubmitting={isSubmitting}
                  onToggleSelect={handleToggleSelect}
                  onEdit={openEditForm}
                  onRequestDelete={(j) => setConfirmingDeleteId(j._id)}
                  onConfirmDelete={handleConfirmDelete}
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
