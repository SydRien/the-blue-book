import type {
  DocumentVersion,
  VersionStore,
  VersionStoreSnapshot,
} from "@/lib/versionHistory/types";

export const VERSION_STORE_KEY = "the-blue-book:versions-v1";

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function readSnapshot(): VersionStoreSnapshot {
  if (!canUseStorage()) {
    return { version: 1, versions: [] };
  }

  try {
    const raw = window.localStorage.getItem(VERSION_STORE_KEY);
    if (!raw) {
      return { version: 1, versions: [] };
    }
    const parsed = JSON.parse(raw) as Partial<VersionStoreSnapshot>;
    if (!Array.isArray(parsed.versions)) {
      return { version: 1, versions: [] };
    }
    return { version: 1, versions: parsed.versions as DocumentVersion[] };
  } catch {
    return { version: 1, versions: [] };
  }
}

function writeSnapshot(snapshot: VersionStoreSnapshot) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(VERSION_STORE_KEY, JSON.stringify(snapshot));
}

export function createLocalVersionStore(): VersionStore {
  return {
    listByDocument(documentId: string) {
      return readSnapshot()
        .versions.filter((item) => item.documentId === documentId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    get(id: string) {
      return (
        readSnapshot().versions.find((item) => item.id === id) ?? null
      );
    },

    create(record: DocumentVersion) {
      const snapshot = readSnapshot();
      snapshot.versions.push(record);
      writeSnapshot(snapshot);
    },

    delete(id: string) {
      const snapshot = readSnapshot();
      snapshot.versions = snapshot.versions.filter((item) => item.id !== id);
      writeSnapshot(snapshot);
    },
  };
}
