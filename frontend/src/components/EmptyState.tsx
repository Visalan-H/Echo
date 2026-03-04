export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 border border-dashed border-[var(--color-border)] rounded-none bg-[var(--color-surface)]">
      <div className="text-center max-w-sm">
        <h3 className="font-mono text-xs tracking-widest uppercase mb-3 text-[var(--color-muted)]">No Jobs Found</h3>
        <p className="text-[var(--color-primary)] font-serif text-xl tracking-tight mb-2">
          Your pipeline is empty
        </p>
        <p className="text-sm text-[var(--color-muted)] leading-relaxed">
          Sync your inbox to automatically populate your applications, or sit tight while Trackrr scans for updates.
        </p>
      </div>
    </div>
  );
}
