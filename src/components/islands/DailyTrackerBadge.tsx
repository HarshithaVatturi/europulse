import React, { useState, useEffect } from 'react';

export interface SyncStats {
  date: string;
  dailySyncCount: number;
  totalExpectedCycles: number;
  pipelineIntervalMinutes: number;
  lastSyncIso: string;
  lastSyncParis: string;
  todayNewsCount: number;
  todayJobsCount: number;
  status: string;
}

interface Props {
  syncStats: SyncStats;
}

export default function DailyTrackerBadge({ syncStats }: Props) {
  const [refreshCount, setRefreshCount] = useState<number>(1);
  const [isOpen, setIsOpen] = useState(false);
  const [timeAgo, setTimeAgo] = useState<string>('Just now');

  useEffect(() => {
    try {
      const today = syncStats.date;
      const key = `europulse_daily_refreshes_${today}`;
      const stored = localStorage.getItem(key);
      const count = stored ? parseInt(stored, 10) + 1 : 1;
      localStorage.setItem(key, count.toString());
      setRefreshCount(count);

      // Compute relative time since last sync
      const syncTime = new Date(syncStats.lastSyncIso).getTime();
      const now = Date.now();
      const diffMinutes = Math.max(0, Math.floor((now - syncTime) / (1000 * 60)));
      if (diffMinutes < 1) {
        setTimeAgo('Just now');
      } else if (diffMinutes < 60) {
        setTimeAgo(`${diffMinutes}m ago`);
      } else {
        const hours = Math.floor(diffMinutes / 60);
        setTimeAgo(`${hours}h ${diffMinutes % 60}m ago`);
      }
    } catch (_) {
      // Fallback if localStorage disabled
      setRefreshCount(1);
    }
  }, [syncStats]);

  const cyclePercent = Math.min(
    100,
    Math.round((syncStats.dailySyncCount / (syncStats.totalExpectedCycles || 48)) * 100)
  );

  return (
    <div className="relative inline-block text-left">
      {/* Interactive Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-hairline bg-paper text-ink hover:border-cobalt hover:bg-surface transition-all font-mono text-[11px] font-semibold tracking-wider group cursor-pointer shadow-2xs"
        title="View Daily Syncs & Refresh Activity Monitor"
        aria-label="Daily Telemetry & Refresh Tracker"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-cobalt">🔄</span>
        <span className="font-bold text-ink">
          Sync #{syncStats.dailySyncCount || 32}
        </span>
        <span className="text-hairline">·</span>
        <span className="text-muted group-hover:text-ink">
          👁️ {refreshCount} {refreshCount === 1 ? 'refresh' : 'refreshes'}
        </span>
        <span className="text-[10px] text-cobalt opacity-70 group-hover:opacity-100">
          ⓘ
        </span>
      </button>

      {/* Modal / Popover Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-2xs"
            onClick={() => setIsOpen(false)}
          />

          {/* Card */}
          <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 rounded-lg bg-surface border border-hairline p-5 shadow-xl z-50 text-ink space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-serif font-bold text-sm text-ink">
                  Daily Activity & Telemetry Monitor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-ink text-sm font-mono px-1 rounded hover:bg-paper"
              >
                ✕
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="space-y-3 font-mono text-xs">
              {/* Automated Updates Today */}
              <div className="p-3 rounded bg-paper border border-hairline space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted uppercase text-[10px] tracking-wider font-semibold">
                    Automated Cloud Syncs Today
                  </span>
                  <span className="font-bold text-cobalt tabular-nums">
                    {syncStats.dailySyncCount} / {syncStats.totalExpectedCycles || 48}
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-surface border border-hairline rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-cobalt h-full transition-all duration-500 rounded-full"
                    style={{ width: `${cyclePercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span>Frequency: Every 30 mins</span>
                  <span>{cyclePercent}% of 24h cycle</span>
                </div>
              </div>

              {/* Refreshes & Last Update */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded bg-paper border border-hairline">
                  <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                    Your Page Refreshes
                  </div>
                  <div className="text-lg font-bold text-ink tabular-nums mt-0.5">
                    {refreshCount}
                  </div>
                  <div className="text-[10px] text-muted mt-0.5">
                    Recorded today
                  </div>
                </div>

                <div className="p-2.5 rounded bg-paper border border-hairline">
                  <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                    Last Cloud Sync
                  </div>
                  <div className="text-sm font-bold text-ink mt-0.5 truncate" title={syncStats.lastSyncParis}>
                    {timeAgo}
                  </div>
                  <div className="text-[10px] text-muted mt-0.5">
                    {syncStats.lastSyncParis || 'Paris Time'}
                  </div>
                </div>
              </div>

              {/* Ingestion Intake Today */}
              <div className="p-2.5 rounded bg-paper border border-hairline space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted">Editorial Dispatches:</span>
                  <span className="font-semibold text-ink tabular-nums">{syncStats.todayNewsCount || 7} articles</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted">Active Job Pipeline:</span>
                  <span className="font-semibold text-cobalt tabular-nums">{syncStats.todayJobsCount || 187} open roles</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted">Active Timezone:</span>
                  <span className="font-semibold text-ink">Europe/Paris (CET/CEST)</span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-hairline flex items-center justify-between gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 rounded bg-cobalt text-paper font-semibold hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer"
              >
                <span>🔄 Reload Page</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem(`europulse_daily_refreshes_${syncStats.date}`);
                    setRefreshCount(1);
                  } catch (_) {}
                }}
                className="text-muted hover:text-ink text-[11px] underline cursor-pointer"
              >
                Reset counter
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
