"use client";

import type { DocumentSyncStatus } from "@/lib/storage/documentSyncStatus";
import { documentSyncLabel } from "@/lib/storage/documentSyncStatus";

type SyncCloudIconProps = {
  status: DocumentSyncStatus;
  className?: string;
};

/**
 * Minimal hardware-style cloud status mark (12–14px). Not an emoji.
 */
export function SyncCloudIcon({ status, className = "" }: SyncCloudIconProps) {
  return (
    <span
      className={`sync-cloud-icon sync-cloud-icon--${status} ${className}`.trim()}
      title={documentSyncLabel(status)}
      aria-label={documentSyncLabel(status)}
      role="img"
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 13 13"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          className="sync-cloud-icon__outline"
          d="M3.8 9.6h5.6c1.2 0 2.1-.95 2.1-2.1 0-1.05-.78-1.92-1.8-2.08A2.55 2.55 0 0 0 7.2 3.2c-1.1 0-2.05.7-2.4 1.68A2.05 2.05 0 0 0 2.6 7.5c0 1.16.94 2.1 2.2 2.1Z"
          strokeWidth="1.15"
          strokeLinejoin="round"
        />
        {status === "syncing" ? (
          <path
            className="sync-cloud-icon__pulse"
            d="M4.6 7.1h3.8"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        ) : null}
      </svg>
    </span>
  );
}
