export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 border border-dashed border-border rounded-none bg-surface">
      <div className="text-center max-w-sm">
        <h3 className="font-mono text-xs tracking-widest uppercase mb-3 text-muted">No Jobs Found</h3>
        <p className="text-primary font-serif text-xl tracking-tight mb-2">
          Your pipeline is empty
        </p>
        <p className="text-sm text-muted leading-relaxed">
          Sync your inbox to automatically populate your applications, or sit tight while Echo scans for updates.
        </p>
      </div>
    </div>
  );
}
