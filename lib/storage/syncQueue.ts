/**
 * Persistent outbox for offline changes.
 *
 * Every write lands in local storage first and is recorded here. The
 * offline-first repository drains the queue to Supabase whenever the app is
 * online, so changes made with no connection reach the cloud later — even
 * after the app is closed and reopened.
 *
 * Content is never stored in the queue: when an operation is sent, the latest
 * version is read from local storage. That keeps the queue small and means
 * several offline saves of one document upload once.
 */

export type PendingOp =
  | { kind: "createProject"; projectId: string }
  | { kind: "updateProject"; projectId: string }
  | { kind: "deleteProject"; projectId: string }
  | { kind: "saveDocument"; documentId: string; projectId: string }
  | { kind: "updateDocument"; documentId: string }
  | { kind: "deleteDocument"; documentId: string }
  | { kind: "upsertNote"; noteId: string }
  | { kind: "deleteNote"; noteId: string };

export type QueuedOp = PendingOp & {
  queuedAt: string;
  attempts: number;
  lastError?: string;
};

export type SyncQueueState = {
  ops: QueuedOp[];
  /** Ops that kept failing with a server error; kept for inspection, not retried. */
  failed: QueuedOp[];
  /** Cloud `updated_at` of each document when this device last synced it. */
  docBase: Record<string, string>;
  /** Ids this device has seen in the cloud (to tell "deleted elsewhere" from "never uploaded"). */
  knownRemoteProjects: Record<string, true>;
  knownRemoteDocuments: Record<string, true>;
};

const SYNC_KEY = "the-blue-book:sync-v1";

export interface SyncStore {
  read(): SyncQueueState;
  write(state: SyncQueueState): void;
}

export function emptySyncState(): SyncQueueState {
  return {
    ops: [],
    failed: [],
    docBase: {},
    knownRemoteProjects: {},
    knownRemoteDocuments: {},
  };
}

export class LocalStorageSyncStore implements SyncStore {
  read(): SyncQueueState {
    if (typeof window === "undefined") {
      return emptySyncState();
    }
    try {
      const raw = window.localStorage.getItem(SYNC_KEY);
      if (!raw) {
        return emptySyncState();
      }
      const parsed = JSON.parse(raw) as Partial<SyncQueueState>;
      return { ...emptySyncState(), ...parsed };
    } catch {
      return emptySyncState();
    }
  }

  write(state: SyncQueueState): void {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(SYNC_KEY, JSON.stringify(state));
  }
}

/** In-memory store, used by tests. */
export class MemorySyncStore implements SyncStore {
  private state = emptySyncState();
  read(): SyncQueueState {
    return JSON.parse(JSON.stringify(this.state)) as SyncQueueState;
  }
  write(state: SyncQueueState): void {
    this.state = JSON.parse(JSON.stringify(state)) as SyncQueueState;
  }
}

function docIdOf(op: PendingOp): string | null {
  return "documentId" in op ? op.documentId : null;
}

export class SyncQueue {
  constructor(private readonly store: SyncStore) {}

  state(): SyncQueueState {
    return this.store.read();
  }

  pendingCount(): number {
    return this.store.read().ops.length;
  }

  hasPendingForDocument(documentId: string): boolean {
    return this.store
      .read()
      .ops.some((op) => docIdOf(op) === documentId);
  }

  hasPendingForProject(projectId: string): boolean {
    return this.store
      .read()
      .ops.some(
        (op) =>
          ("projectId" in op && op.projectId === projectId) ||
          false,
      );
  }

  hasPendingNoteOp(noteId: string): boolean {
    return this.store
      .read()
      .ops.some((op) => "noteId" in op && op.noteId === noteId);
  }

  pendingNoteDeletes(): Set<string> {
    return new Set(
      this.store
        .read()
        .ops.filter((op) => op.kind === "deleteNote")
        .map((op) => (op as { noteId: string }).noteId),
    );
  }

  /** Add an operation, merging it with what's already queued. */
  enqueue(op: PendingOp): void {
    const state = this.store.read();
    const queued: QueuedOp = { ...op, queuedAt: new Date().toISOString(), attempts: 0 };

    switch (op.kind) {
      case "createProject":
        if (!state.ops.some((o) => o.kind === "createProject" && o.projectId === op.projectId)) {
          state.ops.push(queued);
        }
        break;

      case "updateProject": {
        const pendingCreate = state.ops.some(
          (o) => o.kind === "createProject" && o.projectId === op.projectId,
        );
        state.ops = state.ops.filter(
          (o) => !(o.kind === "updateProject" && o.projectId === op.projectId),
        );
        // A pending create uploads the current title anyway.
        if (!pendingCreate) {
          state.ops.push(queued);
        }
        break;
      }

      case "deleteProject": {
        const docIdsInProject = new Set(
          state.ops
            .filter((o) => o.kind === "saveDocument" && o.projectId === op.projectId)
            .map((o) => (o as { documentId: string }).documentId),
        );
        state.ops = state.ops.filter(
          (o) =>
            !("projectId" in o && o.projectId === op.projectId) &&
            !(docIdOf(o) !== null && docIdsInProject.has(docIdOf(o)!)),
        );
        // Never reached the cloud: nothing to delete there.
        if (state.knownRemoteProjects[op.projectId]) {
          state.ops.push(queued);
        }
        break;
      }

      case "saveDocument":
        state.ops = state.ops.filter(
          (o) => !(o.kind === "saveDocument" && o.documentId === op.documentId),
        );
        state.ops.push(queued);
        break;

      case "updateDocument":
        state.ops = state.ops.filter(
          (o) => !(o.kind === "updateDocument" && o.documentId === op.documentId),
        );
        state.ops.push(queued);
        break;

      case "deleteDocument":
        state.ops = state.ops.filter((o) => docIdOf(o) !== op.documentId);
        if (state.knownRemoteDocuments[op.documentId]) {
          state.ops.push(queued);
        }
        delete state.docBase[op.documentId];
        break;

      case "upsertNote":
        state.ops = state.ops.filter((o) => !("noteId" in o && o.noteId === op.noteId));
        state.ops.push(queued);
        break;

      case "deleteNote":
        state.ops = state.ops.filter((o) => !("noteId" in o && o.noteId === op.noteId));
        state.ops.push(queued);
        break;
    }

    this.store.write(state);
  }

  peek(): QueuedOp | undefined {
    return this.store.read().ops[0];
  }

  /** Remove the head op if it is still the one that was sent. */
  complete(op: QueuedOp): void {
    const state = this.store.read();
    const head = state.ops[0];
    if (head && head.kind === op.kind && head.queuedAt === op.queuedAt) {
      state.ops.shift();
      this.store.write(state);
    }
  }

  recordFailure(op: QueuedOp, message: string, maxAttempts: number): "retry" | "dropped" {
    const state = this.store.read();
    const head = state.ops[0];
    if (!head || head.kind !== op.kind || head.queuedAt !== op.queuedAt) {
      return "retry";
    }
    head.attempts += 1;
    head.lastError = message;
    if (head.attempts >= maxAttempts) {
      state.ops.shift();
      state.failed.push(head);
      this.store.write(state);
      return "dropped";
    }
    this.store.write(state);
    return "retry";
  }

  setDocBase(documentId: string, remoteUpdatedAt: string): void {
    const state = this.store.read();
    state.docBase[documentId] = remoteUpdatedAt;
    state.knownRemoteDocuments[documentId] = true;
    this.store.write(state);
  }

  docBase(documentId: string): string | undefined {
    return this.store.read().docBase[documentId];
  }

  markRemoteProject(projectId: string): void {
    const state = this.store.read();
    if (!state.knownRemoteProjects[projectId]) {
      state.knownRemoteProjects[projectId] = true;
      this.store.write(state);
    }
  }

  isKnownRemoteProject(projectId: string): boolean {
    return Boolean(this.store.read().knownRemoteProjects[projectId]);
  }

  isKnownRemoteDocument(documentId: string): boolean {
    return Boolean(this.store.read().knownRemoteDocuments[documentId]);
  }

  forgetProject(projectId: string): void {
    const state = this.store.read();
    delete state.knownRemoteProjects[projectId];
    this.store.write(state);
  }

  forgetDocument(documentId: string): void {
    const state = this.store.read();
    delete state.knownRemoteDocuments[documentId];
    delete state.docBase[documentId];
    this.store.write(state);
  }
}
