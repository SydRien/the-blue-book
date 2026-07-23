/**
 * Per-document cloud/local persistence indicator for the sidebar.
 * Separate from storage SyncStatus (StatusBar), which includes loading/errors.
 *
 * SyncStatus (document indicator): "synced" | "dirty" | "syncing"
 */
export type SyncStatus = "synced" | "dirty" | "syncing";

/** Alias used by UI components. */
export type DocumentSyncStatus = SyncStatus;

export function documentSyncLabel(status: DocumentSyncStatus): string {
  switch (status) {
    case "synced":
      return "Synced";
    case "dirty":
      return "Unsynced";
    case "syncing":
      return "Syncing";
  }
}
