import type { SyncStatus } from "@/lib/storage";
import type { BlockTypeId } from "@/types/document";

type StatusBarProps = {
  projectName: string;
  documentName: string;
  activeType: BlockTypeId;
  exportVisible: boolean;
  blockCount: number;
  syncStatus: SyncStatus;
  latestVersionLabel?: string | null;
};

function syncLabel(status: SyncStatus): string {
  switch (status) {
    case "loading":
      return "Loading";
    case "syncing":
      return "Saving";
    case "local-only":
    case "saved-local":
      return "Saved Locally";
    case "synced":
      return "Synced to Cloud";
    case "sync-error":
      return "Error · Local Kept";
  }
}

function syncLed(status: SyncStatus): string {
  switch (status) {
    case "loading":
      return "bg-led-orange text-led-orange";
    case "local-only":
    case "saved-local":
      return "bg-led-cyan text-led-cyan";
    case "syncing":
      return "bg-led-cyan text-led-cyan";
    case "synced":
      return "bg-led-green text-led-green";
    case "sync-error":
      return "bg-[#c45c5c] text-[#c45c5c]";
  }
}

export function StatusBar({
  projectName,
  documentName,
  activeType,
  exportVisible,
  blockCount,
  syncStatus,
  latestVersionLabel = null,
}: StatusBarProps) {
  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t border-panel-border bg-status px-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`led-dot h-1.5 w-1.5 rounded-full ${syncLed(syncStatus)}`}
            data-lit="true"
            aria-hidden
          />
          <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
            {syncLabel(syncStatus)}
          </span>
        </span>
        <span className="text-panel-border">|</span>
        <span className="font-mono text-[10px] tracking-[0.08em] text-muted uppercase">
          {projectName} · {documentName}
        </span>
        {latestVersionLabel ? (
          <>
            <span className="text-panel-border">|</span>
            <span className="max-w-[12rem] truncate font-mono text-[10px] tracking-[0.08em] text-led-orange uppercase">
              Latest · {latestVersionLabel}
            </span>
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
          Blocks · {blockCount}
        </span>
        <span className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
          Type · {activeType}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`led-dot h-1.5 w-1.5 rounded-full ${
              exportVisible
                ? "bg-led-blue text-led-blue"
                : "bg-[#3a3a42] text-transparent"
            }`}
            data-lit={exportVisible}
            aria-hidden
          />
          <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
            {exportVisible ? "Export On" : "Export Off"}
          </span>
        </span>
        <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
          Phase 6.4 · Versions
        </span>
      </div>
    </footer>
  );
}
