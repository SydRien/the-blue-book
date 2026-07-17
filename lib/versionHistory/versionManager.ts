import { createLocalVersionStore } from "@/lib/versionHistory/localVersionStore";
import type {
  DocumentVersion,
  VersionStore,
} from "@/lib/versionHistory/types";
import type { BlueBookDocument } from "@/types/document";

function cloneDocument(document: BlueBookDocument): BlueBookDocument {
  return structuredClone(document);
}

function defaultLabel(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Document snapshot manager — not Git, not collaborative.
 */
export class VersionManager {
  constructor(private readonly store: VersionStore) {}

  list(documentId: string): DocumentVersion[] {
    return this.store.listByDocument(documentId);
  }

  get(id: string): DocumentVersion | null {
    return this.store.get(id);
  }

  latest(documentId: string): DocumentVersion | null {
    return this.list(documentId)[0] ?? null;
  }

  createSnapshot(
    document: BlueBookDocument,
    label?: string,
  ): DocumentVersion {
    const record: DocumentVersion = {
      id: crypto.randomUUID(),
      documentId: document.id,
      label: (label?.trim() || defaultLabel()).trim(),
      snapshot: cloneDocument(document),
      createdAt: new Date().toISOString(),
    };
    this.store.create(record);
    return record;
  }

  /** Returns a deep clone suitable for setDocument / editor remount. */
  restore(versionId: string): BlueBookDocument {
    const version = this.store.get(versionId);
    if (!version) {
      throw new Error(`Version not found: ${versionId}`);
    }
    return cloneDocument(version.snapshot);
  }

  delete(versionId: string): void {
    const version = this.store.get(versionId);
    if (!version) {
      throw new Error(`Version not found: ${versionId}`);
    }
    this.store.delete(versionId);
  }
}

let singleton: VersionManager | null = null;

export function getVersionManager(): VersionManager {
  if (!singleton) {
    singleton = new VersionManager(createLocalVersionStore());
  }
  return singleton;
}

export function createVersionManager(
  store: VersionStore = createLocalVersionStore(),
): VersionManager {
  return new VersionManager(store);
}
