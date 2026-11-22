import type { BlueBookDocument } from "@/types/document";
import type {
  CreateDocumentInput,
  CreateProjectInput,
  DocumentSummary,
  Project,
  ProjectWithDocuments,
  SaveDocumentInput,
  UpdateDocumentInput,
  UpdateProjectInput,
} from "@/types/project";
import type { Note } from "@/lib/notes/types";
import type { LocalBlueBookRepository } from "@/lib/storage/localBlueBookRepository";
import type { QueuedOp, SyncQueue } from "@/lib/storage/syncQueue";
import type { BlueBookRepository, SyncStatus } from "@/lib/storage/types";

/** What the offline-first layer needs from the cloud (Supabase in production). */
export interface RemoteSyncTarget {
  listProjects(): Promise<Project[]>;
  upsertProject(project: Project): Promise<Project>;
  updateProject(input: UpdateProjectInput): Promise<Project>;
  deleteProject(projectId: string): Promise<void>;
  listDocumentsWithContent(
    projectId: string,
  ): Promise<{ summary: DocumentSummary; document: BlueBookDocument | null }[]>;
  getDocumentMeta(
    documentId: string,
  ): Promise<{ updated_at: string; project_id: string } | null>;
  loadDocument(documentId: string, projectId?: string): Promise<BlueBookDocument | null>;
  saveDocumentReturningTimestamp(input: SaveDocumentInput): Promise<string>;
  updateDocument(input: UpdateDocumentInput): Promise<DocumentSummary>;
  deleteDocument(documentId: string): Promise<void>;
  listNotes(): Promise<Note[]>;
  upsertNote(note: Note): Promise<Note>;
  deleteNote(noteId: string): Promise<void>;
}

export type SyncSnapshot = {
  online: boolean;
  syncing: boolean;
  pending: number;
  lastSyncedAt: string | null;
  lastError: string | null;
};

export type SyncEvent =
  | { type: "status"; snapshot: SyncSnapshot }
  | {
      type: "conflict";
      documentId: string;
      copyDocumentId: string;
      copyTitle: string;
      projectId: string;
    }
  | { type: "remote-changed"; documentIds: string[] };

type Listener = (event: SyncEvent) => void;

const MAX_ATTEMPTS = 6;
const RETRY_INTERVAL_MS = 30_000;

function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine !== false;
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

/** PostgREST/Postgres errors carry a `code`; network failures don't. */
function isServerError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      typeof (error as { code: unknown }).code === "string" &&
      (error as { code: string }).code.length > 0,
  );
}

function isForeignKeyError(error: unknown): boolean {
  return isServerError(error) && (error as { code: string }).code === "23503";
}

/** Compare timestamps from Postgres ("+00:00") and JS ("Z") correctly. */
function isAfter(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const left = Date.parse(a);
  const right = Date.parse(b);
  if (Number.isNaN(left) || Number.isNaN(right)) return a > b;
  return left > right;
}

function offlineCopyTitle(title: string): string {
  const stamp = new Date().toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${title} (offline copy ${stamp})`;
}

/**
 * Offline-first repository (local-first, Notion-style):
 * - Every read and write uses this device's local copy, so the app works with
 *   no connection.
 * - Every write is recorded in a persistent sync queue and sent to the cloud
 *   when online, including after a restart.
 * - When online, the whole library is downloaded so every document is
 *   available offline.
 * - Conflicts (the same document changed offline here and in the cloud) never
 *   lose writing: the cloud version stays, and this device's version is kept as
 *   an "offline copy" document next to it.
 */
export class OfflineFirstRepository implements BlueBookRepository {
  private flushing: Promise<void> | null = null;
  private listeners = new Set<Listener>();
  private lastSyncedAt: string | null = null;
  private lastError: string | null = null;
  private started = false;

  constructor(
    private readonly local: LocalBlueBookRepository,
    private readonly remote: RemoteSyncTarget,
    private readonly queue: SyncQueue,
  ) {}

  /* ------------------------------------------------------------------ */
  /* Sync lifecycle                                                      */
  /* ------------------------------------------------------------------ */

  /** Start background syncing (online/offline events + periodic retry). */
  start(): void {
    if (this.started || typeof window === "undefined") {
      return;
    }
    this.started = true;
    window.addEventListener("online", () => {
      this.emitStatus();
      void this.flush();
    });
    window.addEventListener("offline", () => this.emitStatus());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        void this.flush();
      }
    });
    window.setInterval(() => {
      if (this.queue.pendingCount() > 0) {
        void this.flush();
      }
    }, RETRY_INTERVAL_MS);
    void this.flush();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener({ type: "status", snapshot: this.snapshot() });
    return () => {
      this.listeners.delete(listener);
    };
  }

  snapshot(): SyncSnapshot {
    return {
      online: isOnline(),
      syncing: this.flushing !== null,
      pending: this.queue.pendingCount(),
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
    };
  }

  hasPendingChanges(documentId: string): boolean {
    return this.queue.hasPendingForDocument(documentId);
  }

  private emit(event: SyncEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // a broken listener must not stop syncing
      }
    }
  }

  private emitStatus(): void {
    this.emit({ type: "status", snapshot: this.snapshot() });
  }

  /** Send queued changes to the cloud. Safe to call any time. */
  flush(): Promise<void> {
    if (this.flushing) {
      return this.flushing;
    }
    if (!isOnline() || this.queue.pendingCount() === 0) {
      this.emitStatus();
      return Promise.resolve();
    }

    this.flushing = this.drain().finally(() => {
      this.flushing = null;
      this.emitStatus();
    });
    this.emitStatus();
    return this.flushing;
  }

  private async drain(): Promise<void> {
    let op = this.queue.peek();
    while (op) {
      if (!isOnline()) {
        return;
      }
      try {
        await this.send(op);
        this.queue.complete(op);
        this.lastError = null;
        this.lastSyncedAt = new Date().toISOString();
      } catch (error) {
        this.lastError = errorMessage(error);
        if (isServerError(error)) {
          // A real server rejection: retry a few times, then park it so one
          // bad change can't block everything behind it.
          const outcome = this.queue.recordFailure(op, this.lastError, MAX_ATTEMPTS);
          if (outcome === "retry") {
            return;
          }
        } else {
          // Network / auth problem: stop and try again later.
          return;
        }
      }
      this.emitStatus();
      op = this.queue.peek();
    }
  }

  private async send(op: QueuedOp): Promise<void> {
    switch (op.kind) {
      case "createProject": {
        const project = await this.localProject(op.projectId);
        if (!project) return;
        await this.remote.upsertProject(project);
        this.queue.markRemoteProject(op.projectId);
        return;
      }

      case "updateProject": {
        const project = await this.localProject(op.projectId);
        if (!project) return;
        // Upsert so a project deleted or never created in the cloud is restored.
        await this.remote.upsertProject(project);
        this.queue.markRemoteProject(op.projectId);
        return;
      }

      case "deleteProject":
        await this.remote.deleteProject(op.projectId);
        this.queue.forgetProject(op.projectId);
        return;

      case "saveDocument":
        await this.sendDocument(op.documentId, op.projectId);
        return;

      case "updateDocument": {
        const summary = await this.localSummary(op.documentId);
        if (!summary) return;
        await this.sendDocument(op.documentId, summary.project_id);
        return;
      }

      case "deleteDocument":
        await this.remote.deleteDocument(op.documentId);
        this.queue.forgetDocument(op.documentId);
        return;

      case "upsertNote": {
        const note = (await this.local.listNotes()).find((item) => item.id === op.noteId);
        if (!note) return;
        await this.remote.upsertNote(note);
        return;
      }

      case "deleteNote":
        await this.remote.deleteNote(op.noteId);
        return;
    }
  }

  /** Upload the local version of a document, resolving conflicts safely. */
  private async sendDocument(documentId: string, projectId: string): Promise<void> {
    const document = await this.local.loadDocument(documentId);
    const summary = await this.localSummary(documentId);
    if (!document || !summary) {
      return; // deleted locally since it was queued
    }
    const targetProjectId = summary.project_id || projectId;

    const base = this.queue.docBase(documentId);
    const remoteMeta = await this.remote.getDocumentMeta(documentId);

    if (remoteMeta && base && isAfter(remoteMeta.updated_at, base)) {
      await this.resolveConflict(document, targetProjectId, remoteMeta.updated_at);
      return;
    }

    const payload: SaveDocumentInput = {
      projectId: targetProjectId,
      document: { ...document, title: summary.title },
    };

    let savedAt: string;
    try {
      savedAt = await this.remote.saveDocumentReturningTimestamp(payload);
    } catch (error) {
      if (!isForeignKeyError(error)) throw error;
      // The project isn't in the cloud (created offline, or deleted elsewhere).
      const project = await this.localProject(targetProjectId);
      if (!project) throw error;
      await this.remote.upsertProject(project);
      this.queue.markRemoteProject(project.id);
      savedAt = await this.remote.saveDocumentReturningTimestamp(payload);
    }
    this.queue.setDocBase(documentId, savedAt);
  }

  /**
   * The document changed in the cloud since this device last synced it, and it
   * was also edited here. Keep both: the cloud version stays in place and this
   * device's version becomes a new "offline copy" document.
   */
  private async resolveConflict(
    localDocument: BlueBookDocument,
    projectId: string,
    remoteUpdatedAt: string,
  ): Promise<void> {
    const copyId = crypto.randomUUID();
    const copyTitle = offlineCopyTitle(localDocument.title);

    await this.local.createDocument({
      projectId,
      title: copyTitle,
      document: { id: copyId, title: copyTitle, blocks: localDocument.blocks },
    });
    const savedAt = await this.remote.saveDocumentReturningTimestamp({
      projectId,
      document: { id: copyId, title: copyTitle, blocks: localDocument.blocks },
    });
    this.queue.setDocBase(copyId, savedAt);

    const remoteDocument = await this.remote.loadDocument(localDocument.id, projectId);
    if (remoteDocument) {
      await this.local.cacheDocument(projectId, remoteDocument, {
        updated_at: remoteUpdatedAt,
      });
    }
    this.queue.setDocBase(localDocument.id, remoteUpdatedAt);

    this.emit({
      type: "conflict",
      documentId: localDocument.id,
      copyDocumentId: copyId,
      copyTitle,
      projectId,
    });
  }

  private async localProject(projectId: string): Promise<Project | null> {
    const projects = await this.local.listProjects();
    return projects.find((project) => project.id === projectId) ?? null;
  }

  private async localSummary(documentId: string): Promise<DocumentSummary | null> {
    const projects = await this.local.listProjects();
    for (const project of projects) {
      const docs = await this.local.listDocuments(project.id);
      const match = docs.find((doc) => doc.id === documentId);
      if (match) return match;
    }
    return null;
  }

  private afterWrite(): void {
    this.emitStatus();
    void this.flush();
  }

  /* ------------------------------------------------------------------ */
  /* Pulling from the cloud                                              */
  /* ------------------------------------------------------------------ */

  /** Bring this device's project list in line with the cloud. */
  private async pullProjects(): Promise<void> {
    if (!isOnline()) return;
    let remoteProjects: Project[];
    try {
      remoteProjects = await this.remote.listProjects();
    } catch {
      return; // offline or signed out: keep using the local copy
    }

    const remoteIds = new Set(remoteProjects.map((project) => project.id));
    for (const project of remoteProjects) {
      this.queue.markRemoteProject(project.id);
      if (!this.queue.hasPendingForProject(project.id)) {
        await this.local.cacheProject(project);
      }
    }

    for (const project of await this.local.listProjects()) {
      if (remoteIds.has(project.id) || this.queue.hasPendingForProject(project.id)) {
        continue;
      }
      if (this.queue.isKnownRemoteProject(project.id)) {
        // It was in the cloud before and is gone now: deleted on another device.
        const docs = await this.local.listDocuments(project.id);
        const hasUnsynced = docs.some((doc) => this.queue.hasPendingForDocument(doc.id));
        if (!hasUnsynced) {
          await this.local.deleteProject(project.id);
          this.queue.forgetProject(project.id);
          continue;
        }
      }
      // Never uploaded (e.g. written before cloud sync was set up): upload it.
      this.queue.enqueue({ kind: "createProject", projectId: project.id });
      for (const doc of await this.local.listDocuments(project.id)) {
        this.queue.enqueue({ kind: "saveDocument", documentId: doc.id, projectId: project.id });
      }
    }
  }

  /** Download every document in a project so it's available offline. */
  private async pullDocuments(projectId: string): Promise<string[]> {
    if (!isOnline() || !this.queue.isKnownRemoteProject(projectId)) return [];
    let rows: Awaited<ReturnType<RemoteSyncTarget["listDocumentsWithContent"]>>;
    try {
      rows = await this.remote.listDocumentsWithContent(projectId);
    } catch {
      return [];
    }

    const changed: string[] = [];
    const remoteIds = new Set(rows.map((row) => row.summary.id));
    const localDocs = await this.local.listDocuments(projectId);
    const localById = new Map(localDocs.map((doc) => [doc.id, doc]));

    for (const { summary, document } of rows) {
      if (!document) continue;
      if (this.queue.hasPendingForDocument(summary.id)) {
        continue; // local edits win until they're uploaded (conflicts handled then)
      }
      const base = this.queue.docBase(summary.id);
      const local = localById.get(summary.id);
      if (local && !base && isAfter(local.updated_at, summary.updated_at)) {
        // First sync on this device and the local copy is newer (e.g. edits
        // made offline before this update): upload it instead of overwriting.
        this.queue.enqueue({ kind: "saveDocument", documentId: summary.id, projectId });
        continue;
      }
      const remoteIsNewer = !local || !base || isAfter(summary.updated_at, base);
      if (remoteIsNewer) {
        await this.local.cacheDocument(projectId, document, {
          created_at: summary.created_at,
          updated_at: summary.updated_at,
        });
        if (local && base) changed.push(summary.id);
      }
      this.queue.setDocBase(summary.id, summary.updated_at);
    }

    for (const doc of localDocs) {
      if (remoteIds.has(doc.id) || this.queue.hasPendingForDocument(doc.id)) continue;
      if (this.queue.isKnownRemoteDocument(doc.id)) {
        await this.local.deleteDocument(doc.id); // deleted on another device
        this.queue.forgetDocument(doc.id);
      } else {
        this.queue.enqueue({ kind: "saveDocument", documentId: doc.id, projectId });
      }
    }

    if (changed.length > 0) {
      this.emit({ type: "remote-changed", documentIds: changed });
    }
    return changed;
  }

  /* ------------------------------------------------------------------ */
  /* BlueBookRepository                                                  */
  /* ------------------------------------------------------------------ */

  async listProjects(): Promise<Project[]> {
    this.start();
    await this.pullProjects();
    void this.flush();
    return this.local.listProjects();
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const project = await this.local.createProject(input);
    this.queue.enqueue({ kind: "createProject", projectId: project.id });
    this.afterWrite();
    return project;
  }

  async updateProject(input: UpdateProjectInput): Promise<Project> {
    const project = await this.local.updateProject(input);
    this.queue.enqueue({ kind: "updateProject", projectId: input.projectId });
    this.afterWrite();
    return project;
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.local.deleteProject(projectId);
    this.queue.enqueue({ kind: "deleteProject", projectId });
    this.afterWrite();
  }

  async getProject(projectId: string): Promise<ProjectWithDocuments | null> {
    await this.pullDocuments(projectId);
    return this.local.getProject(projectId);
  }

  async listDocuments(projectId: string): Promise<DocumentSummary[]> {
    await this.pullDocuments(projectId);
    return this.local.listDocuments(projectId);
  }

  async createDocument(input: CreateDocumentInput): Promise<BlueBookDocument> {
    const document = await this.local.createDocument(input);
    this.queue.enqueue({
      kind: "saveDocument",
      documentId: document.id,
      projectId: input.projectId,
    });
    this.afterWrite();
    return document;
  }

  async updateDocument(input: UpdateDocumentInput): Promise<DocumentSummary> {
    const summary = await this.local.updateDocument(input);
    this.queue.enqueue({ kind: "updateDocument", documentId: input.documentId });
    this.afterWrite();
    return summary;
  }

  async deleteDocument(documentId: string): Promise<void> {
    await this.local.deleteDocument(documentId);
    this.queue.enqueue({ kind: "deleteDocument", documentId });
    this.afterWrite();
  }

  async loadDocument(
    documentId: string,
    projectId?: string,
  ): Promise<BlueBookDocument | null> {
    const localDocument = await this.local.loadDocument(documentId);

    // Freshen from the cloud when this device has no unsynced edits to it.
    if (isOnline() && !this.queue.hasPendingForDocument(documentId)) {
      try {
        const meta = await this.remote.getDocumentMeta(documentId);
        const base = this.queue.docBase(documentId);
        const localSummary = localDocument ? await this.localSummary(documentId) : null;
        if (meta && localSummary && !base && isAfter(localSummary.updated_at, meta.updated_at)) {
          // Local copy is newer than the cloud and was never synced: keep it.
          this.queue.enqueue({
            kind: "saveDocument",
            documentId,
            projectId: localSummary.project_id,
          });
          this.afterWrite();
          return localDocument;
        }
        if (meta && (!localDocument || !base || isAfter(meta.updated_at, base))) {
          const remoteDocument = await this.remote.loadDocument(
            documentId,
            projectId ?? meta.project_id,
          );
          if (remoteDocument) {
            await this.local.cacheDocument(projectId ?? meta.project_id, remoteDocument, {
              updated_at: meta.updated_at,
            });
            this.queue.setDocBase(documentId, meta.updated_at);
            return remoteDocument;
          }
        }
      } catch {
        // offline or signed out: use the local copy
      }
    }

    return localDocument;
  }

  /**
   * Saves to this device immediately, then tries the cloud.
   * Returns "synced" when the cloud has it, "saved-local" when it's queued.
   */
  async saveDocument(input: SaveDocumentInput): Promise<SyncStatus> {
    await this.local.saveDocument(input);
    this.queue.enqueue({
      kind: "saveDocument",
      documentId: input.document.id,
      projectId: input.projectId,
    });
    this.emitStatus();

    if (!isOnline()) {
      return "saved-local";
    }
    await this.flush();
    return this.queue.hasPendingForDocument(input.document.id) ? "saved-local" : "synced";
  }

  async listNotes(): Promise<Note[]> {
    const localNotes = await this.local.listNotes();
    if (!isOnline()) {
      return localNotes;
    }

    let remoteNotes: Note[];
    try {
      remoteNotes = await this.remote.listNotes();
    } catch {
      return localNotes;
    }

    const pendingDeletes = this.queue.pendingNoteDeletes();
    const byId = new Map<string, Note>();
    for (const note of localNotes) {
      byId.set(note.id, note);
    }
    for (const note of remoteNotes) {
      if (pendingDeletes.has(note.id)) continue;
      const local = byId.get(note.id);
      if (this.queue.hasPendingNoteOp(note.id)) continue; // local edit wins until sent
      if (!local || note.updatedAt >= local.updatedAt) {
        byId.set(note.id, note);
      }
    }

    const merged = Array.from(byId.values()).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
    await this.local.cacheNotes(merged);

    for (const note of merged) {
      const remote = remoteNotes.find((item) => item.id === note.id);
      if (!remote || note.updatedAt > remote.updatedAt) {
        this.queue.enqueue({ kind: "upsertNote", noteId: note.id });
      }
    }
    this.afterWrite();
    return merged;
  }

  async upsertNote(note: Note): Promise<Note> {
    const localNote = await this.local.upsertNote(note);
    this.queue.enqueue({ kind: "upsertNote", noteId: localNote.id });
    this.afterWrite();
    return localNote;
  }

  async deleteNote(noteId: string): Promise<void> {
    await this.local.deleteNote(noteId);
    this.queue.enqueue({ kind: "deleteNote", noteId });
    this.afterWrite();
  }
}
