import type { SyncStatus } from "@/lib/storage";
import type { ScriptBlockType } from "@/types/document";

type StatusBarProps = {
  projectName: string;
  documentName: string;
  activeType: ScriptBlockType;
  exportVisible: boolean;
  blockCount: number;
  syncStatus: SyncStatus;
};

function syncLabel(status: SyncStatus): string {
  switch (status) {
    case "loading":
      return "Loading";
    case "local-only":
      return "Local Only";
    case "saved-local":
      return "Saved Locally";
    case "syncing":
      return "Syncing";
    case "synced":
      return "Synced";
    case "sync-error":
      return "Local · Sync Pending";
  }
}

function syncLed(status: SyncStatus): string {
  switch (status) {
    case "loading":
      return "bg-led-orange text-led-orange";
    case "local-only":
      return "bg-led-cyan text-led-cyan";
    case "saved-local":
      return "bg-led-green text-led-green";
    case "syncing":
      return "bg-led-cyan text-led-cyan";
    case "synced":
      return "bg-led-green text-led-green";
    case "sync-error":
      return "bg-led-orange text-led-orange";
  }
}

export function StatusBar({
  projectName,
  documentName,
  activeType,
  exportVisible,
  blockCount,
  syncStatus,
}: StatusBarProps) {
  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t border-panel-border bg-status px-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`led-dot h-1.5 w-1.5 rounded-full ${syncLed(syncStatus)}`}
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
            aria-hidden
          />
          <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
            {exportVisible ? "Export On" : "Export Off"}
          </span>
        </span>
        <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
          Phase 4 · Cloud
        </span>
      </div>
    </footer>
  );
}
