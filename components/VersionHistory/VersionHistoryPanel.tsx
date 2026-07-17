"use client";

import type { DocumentVersion } from "@/lib/versionHistory/types";

type VersionHistoryPanelProps = {
  open: boolean;
  documentTitle: string;
  versions: DocumentVersion[];
  onClose: () => void;
  onCreateSnapshot: () => void;
  onRestore: (version: DocumentVersion) => void;
  onDelete: (version: DocumentVersion) => void;
};

function formatWhen(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function VersionHistoryPanel({
  open,
  documentTitle,
  versions,
  onClose,
  onCreateSnapshot,
  onRestore,
  onDelete,
}: VersionHistoryPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[min(640px,88vh)] w-full max-w-lg flex-col rounded-sm border border-panel-border bg-panel shadow-[0_16px_48px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between border-b border-panel-border px-4 py-3">
          <div>
            <p className="font-mono text-sm tracking-[0.16em] text-foreground uppercase">
              Version History
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
              {documentTitle} · local snapshots
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="module-button rounded-sm border border-panel-border px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-muted uppercase"
          >
            Close
          </button>
        </div>

        <div className="border-b border-panel-border px-4 py-3">
          <button
            type="button"
            onClick={onCreateSnapshot}
            className="module-button w-full rounded-sm border border-panel-border px-3 py-2.5 font-mono text-[11px] tracking-[0.14em] text-foreground uppercase"
            data-active="true"
          >
            Create Snapshot
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {versions.length === 0 ? (
            <p className="font-mono text-[11px] leading-relaxed text-muted">
              No versions yet. Create a snapshot before large edits.
            </p>
          ) : (
            versions.map((version, index) => (
              <div
                key={version.id}
                className="rounded-sm border border-panel-border bg-panel-inset px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] tracking-[0.14em] text-led-cyan uppercase">
                      v{versions.length - index}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[12px] text-foreground">
                      {version.label}
                    </p>
                    <p className="mt-1 font-mono text-[9px] text-muted">
                      {formatWhen(version.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => onRestore(version)}
                      className="module-button rounded-sm border border-panel-border px-2 py-1 font-mono text-[9px] tracking-[0.12em] text-foreground uppercase"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(version)}
                      className="module-button rounded-sm border border-panel-border px-2 py-1 font-mono text-[9px] tracking-[0.12em] text-[#c45c5c] uppercase"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
