import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Check } from "lucide-react";
import api from "../utils/api";
import { getApiErrorMessage } from "../utils/api";
import type { SyncResponse } from "../types/api";

type SyncButtonProps = {
  onSyncComplete: (syncData: SyncResponse) => Promise<void> | void;
};

export default function SyncButton({ onSyncComplete }: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleSync = async () => {
    if (isSyncing || justSynced) return;

    setError(null);
    setIsSyncing(true);
    
    try {
      const { data } = await api.post<SyncResponse>("/api/gmail/sync");
      await onSyncComplete(data);
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 2000);
    } catch (errorResponse) {
      setError(getApiErrorMessage(errorResponse, "Failed to sync inbox."));
      setIsSyncing(false);
      return;
    }

    setIsSyncing(false);
  };

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="flex items-center justify-center gap-2 h-9 px-4 border border-border bg-surface hover:bg-border disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-150 ease-out text-sm font-medium whitespace-nowrap"
      >
        <div className="w-4 h-4 relative flex items-center justify-center">
          <AnimatePresence mode="wait">
            {justSynced ? (
              <motion.div
                key="check"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Check className="w-4 h-4 text-green-500" />
              </motion.div>
            ) : (
              <motion.div
                key="refresh"
                animate={{ rotate: isSyncing ? 360 : 0 }}
                transition={{
                  duration: isSyncing ? 1 : 0,
                  repeat: isSyncing ? Infinity : 0,
                  ease: "linear",
                }}
              >
                <RefreshCw className="w-4 h-4 text-primary opacity-80" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <span className="font-mono text-xs uppercase tracking-widest whitespace-nowrap">
          {isSyncing ? "Syncing..." : justSynced ? "Synced!" : "Sync Inbox"}
        </span>
      </button>
      {error ? (
        <span className="text-xs text-red-400" role="status">
          {error}
        </span>
      ) : null}
    </div>
  );
}
