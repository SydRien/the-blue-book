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

export type SyncStatus =
  | "local-only"
  | "saved-local"
  | "syncing"
  | "synced"
  | "sync-error"
  | "loading";

/**
 * Backend-agnostic repository for projects, documents, and scratchpad notes.
 * UI and editor depend on this interface only.
 */
export interface BlueBookRepository {
  listProjects(): Promise<Project[]>;
  createProject(input: CreateProjectInput): Promise<Project>;
  updateProject(input: UpdateProjectInput): Promise<Project>;
  deleteProject(projectId: string): Promise<void>;
  getProject(projectId: string): Promise<ProjectWithDocuments | null>;
  listDocuments(projectId: string): Promise<DocumentSummary[]>;
  createDocument(input: CreateDocumentInput): Promise<BlueBookDocument>;
  updateDocument(input: UpdateDocumentInput): Promise<DocumentSummary>;
  deleteDocument(documentId: string): Promise<void>;
  loadDocument(
    documentId: string,
    projectId?: string,
  ): Promise<BlueBookDocument | null>;
  saveDocument(input: SaveDocumentInput): Promise<SyncStatus>;

  /** Scratchpad notes — offline-first when wrapped. */
  listNotes(): Promise<Note[]>;
  upsertNote(note: Note): Promise<Note>;
  deleteNote(noteId: string): Promise<void>;
}
