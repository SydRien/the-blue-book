import type { BlueBookDocument } from "@/types/document";
import type {
  CreateDocumentInput,
  CreateProjectInput,
  DocumentSummary,
  Project,
  ProjectWithDocuments,
  SaveDocumentInput,
  UpdateProjectInput,
} from "@/types/project";
import type { LocalBlueBookRepository } from "@/lib/storage/localBlueBookRepository";
import type { BlueBookRepository, SyncStatus } from "@/lib/storage/types";

/**
 * Offline-first repository:
 * - Reads prefer local cache, then hydrate from remote when available.
 * - Writes always succeed locally first; remote sync is best-effort.
 * - Supabase failures never clear or block local writing.
 */
export class OfflineFirstRepository implements BlueBookRepository {
  constructor(
    private readonly local: LocalBlueBookRepository,
    private readonly remote: BlueBookRepository,
  ) {}

  async listProjects(): Promise<Project[]> {
    try {
      const remoteProjects = await this.remote.listProjects();
      await Promise.all(
        remoteProjects.map((project) => this.local.cacheProject(project)),
      );
      return remoteProjects;
    } catch {
      return this.local.listProjects();
    }
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    try {
      const project = await this.remote.createProject(input);
      await this.local.cacheProject(project);
      return project;
    } catch {
      return this.local.createProject(input);
    }
  }

  async updateProject(input: UpdateProjectInput): Promise<Project> {
    const localProject = await this.local.updateProject(input);

    try {
      const remoteProject = await this.remote.updateProject(input);
      await this.local.cacheProject(remoteProject);
      return remoteProject;
    } catch {
      return localProject;
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.local.deleteProject(projectId);

    try {
      await this.remote.deleteProject(projectId);
    } catch {
      // Local delete already applied; cloud sync can catch up later.
    }
  }

  async getProject(projectId: string): Promise<ProjectWithDocuments | null> {
    try {
      const project = await this.remote.getProject(projectId);
      if (project) {
        await this.local.cacheProject(project);
        return project;
      }
    } catch {
      // fall through to local
    }

    return this.local.getProject(projectId);
  }

  async listDocuments(projectId: string): Promise<DocumentSummary[]> {
    try {
      return await this.remote.listDocuments(projectId);
    } catch {
      return this.local.listDocuments(projectId);
    }
  }

  async createDocument(input: CreateDocumentInput): Promise<BlueBookDocument> {
    try {
      const document = await this.remote.createDocument(input);
      await this.local.cacheDocument(input.projectId, document);
      return document;
    } catch {
      return this.local.createDocument(input);
    }
  }

  async loadDocument(
    documentId: string,
    projectId?: string,
  ): Promise<BlueBookDocument | null> {
    const localDocument = await this.local.loadDocument(documentId);
    if (localDocument) {
      return localDocument;
    }

    try {
      const remoteDocument = await this.remote.loadDocument(
        documentId,
        projectId,
      );
      if (!remoteDocument) {
        return null;
      }

      if (projectId) {
        await this.local.cacheDocument(projectId, remoteDocument);
      }

      return remoteDocument;
    } catch {
      return null;
    }
  }

  async saveDocument(input: SaveDocumentInput): Promise<SyncStatus> {
    // Always persist locally first so writing never depends on the network.
    await this.local.saveDocument(input);

    try {
      await this.remote.saveDocument(input);
      return "synced";
    } catch {
      return "sync-error";
    }
  }
}
