import type { BlueBookDocument } from "@/types/document";
import type {
  CreateDocumentInput,
  CreateProjectInput,
  DocumentSummary,
  Project,
  ProjectWithDocuments,
  SaveDocumentInput,
} from "@/types/project";

export type SyncStatus =
  | "local-only"
  | "saved-local"
  | "syncing"
  | "synced"
  | "sync-error"
  | "loading";

/**
 * Backend-agnostic repository for projects and documents.
 * UI and editor depend on this interface only.
 */
export interface BlueBookRepository {
  listProjects(): Promise<Project[]>;
  createProject(input: CreateProjectInput): Promise<Project>;
  getProject(projectId: string): Promise<ProjectWithDocuments | null>;
  listDocuments(projectId: string): Promise<DocumentSummary[]>;
  createDocument(input: CreateDocumentInput): Promise<BlueBookDocument>;
  loadDocument(
    documentId: string,
    projectId?: string,
  ): Promise<BlueBookDocument | null>;
  saveDocument(input: SaveDocumentInput): Promise<SyncStatus>;
}
