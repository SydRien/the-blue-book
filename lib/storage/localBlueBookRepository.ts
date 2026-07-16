import type { BlueBookDocument } from "@/types/document";
import { createSeedDocument } from "@/types/document";
import type {
  CreateDocumentInput,
  CreateProjectInput,
  DocumentSummary,
  Project,
  ProjectWithDocuments,
  SaveDocumentInput,
  UpdateProjectInput,
} from "@/types/project";
import type { BlueBookRepository, SyncStatus } from "@/lib/storage/types";
import {
  parseStoredBlocks,
  parseStoredDocument,
} from "@/lib/storage/validateDocument";

const LOCAL_DB_KEY = "the-blue-book:local-db-v1";

type LocalDb = {
  projects: Record<string, Project>;
  documents: Record<
    string,
    DocumentSummary & {
      blocks: BlueBookDocument["blocks"];
    }
  >;
};

function emptyDb(): LocalDb {
  return { projects: {}, documents: {} };
}

function nowIso(): string {
  return new Date().toISOString();
}

function readDb(): LocalDb {
  if (typeof window === "undefined") {
    return emptyDb();
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_DB_KEY);
    if (!raw) {
      return emptyDb();
    }

    const parsed = JSON.parse(raw) as LocalDb;
    if (!parsed || typeof parsed !== "object") {
      return emptyDb();
    }

    return {
      projects: parsed.projects ?? {},
      documents: parsed.documents ?? {},
    };
  } catch {
    return emptyDb();
  }
}

function writeDb(db: LocalDb): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
}

export class LocalBlueBookRepository implements BlueBookRepository {
  async listProjects(): Promise<Project[]> {
    const db = readDb();
    return Object.values(db.projects).sort((a, b) =>
      b.updated_at.localeCompare(a.updated_at),
    );
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const db = readDb();
    const timestamp = nowIso();
    const project: Project = {
      id: crypto.randomUUID(),
      title: input.title.trim() || "Untitled Project",
      description: input.description?.trim() ?? "",
      created_at: timestamp,
      updated_at: timestamp,
    };

    db.projects[project.id] = project;
    writeDb(db);
    return project;
  }

  async updateProject(input: UpdateProjectInput): Promise<Project> {
    const db = readDb();
    const existing = db.projects[input.projectId];
    if (!existing) {
      throw new Error("Project not found");
    }

    const updated: Project = {
      ...existing,
      title: input.title.trim() || "Untitled Project",
      updated_at: nowIso(),
    };
    db.projects[input.projectId] = updated;
    writeDb(db);
    return updated;
  }

  async deleteProject(projectId: string): Promise<void> {
    const db = readDb();
    if (!db.projects[projectId]) {
      return;
    }

    delete db.projects[projectId];
    for (const [documentId, document] of Object.entries(db.documents)) {
      if (document.project_id === projectId) {
        delete db.documents[documentId];
      }
    }
    writeDb(db);
  }

  async getProject(projectId: string): Promise<ProjectWithDocuments | null> {
    const db = readDb();
    const project = db.projects[projectId];
    if (!project) {
      return null;
    }

    const documents = await this.listDocuments(projectId);
    return { ...project, documents };
  }

  async listDocuments(projectId: string): Promise<DocumentSummary[]> {
    const db = readDb();
    return Object.values(db.documents)
      .filter((document) => document.project_id === projectId)
      .map(({ id, project_id, title, created_at, updated_at }) => ({
        id,
        project_id,
        title,
        created_at,
        updated_at,
      }))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  async createDocument(input: CreateDocumentInput): Promise<BlueBookDocument> {
    const db = readDb();
    const project = db.projects[input.projectId];
    if (!project) {
      throw new Error("Project not found");
    }

    const seed = input.document ?? createSeedDocument();
    const timestamp = nowIso();
    const document: BlueBookDocument = {
      id: seed.id && seed.id !== "doc-seed-script" ? seed.id : crypto.randomUUID(),
      title: input.title.trim() || seed.title || "Script",
      blocks: seed.blocks,
    };

    db.documents[document.id] = {
      id: document.id,
      project_id: input.projectId,
      title: document.title,
      created_at: timestamp,
      updated_at: timestamp,
      blocks: document.blocks,
    };
    db.projects[input.projectId] = {
      ...project,
      updated_at: timestamp,
    };
    writeDb(db);
    return document;
  }

  async loadDocument(
    documentId: string,
    _projectId?: string,
  ): Promise<BlueBookDocument | null> {
    const db = readDb();
    const stored = db.documents[documentId];
    if (!stored) {
      return null;
    }

    const blocks = parseStoredBlocks(stored.blocks);
    if (!blocks) {
      return null;
    }

    return {
      id: stored.id,
      title: stored.title,
      blocks,
    };
  }

  async saveDocument(input: SaveDocumentInput): Promise<SyncStatus> {
    const db = readDb();
    const existing = db.documents[input.document.id];
    const project = db.projects[input.projectId];

    if (!project) {
      throw new Error("Project not found");
    }

    const parsed = parseStoredDocument(input.document);
    if (!parsed) {
      throw new Error("Invalid document payload");
    }

    const timestamp = nowIso();
    db.documents[parsed.id] = {
      id: parsed.id,
      project_id: input.projectId,
      title: parsed.title,
      created_at: existing?.created_at ?? timestamp,
      updated_at: timestamp,
      blocks: parsed.blocks,
    };
    db.projects[input.projectId] = {
      ...project,
      updated_at: timestamp,
    };
    writeDb(db);
    return "saved-local";
  }

  /** Used by offline-first layer to cache a cloud document locally. */
  async cacheDocument(
    projectId: string,
    document: BlueBookDocument,
    timestamps?: { created_at?: string; updated_at?: string },
  ): Promise<void> {
    const db = readDb();
    const project = db.projects[projectId];
    if (!project) {
      return;
    }

    const existing = db.documents[document.id];
    const timestamp = nowIso();
    db.documents[document.id] = {
      id: document.id,
      project_id: projectId,
      title: document.title,
      created_at: timestamps?.created_at ?? existing?.created_at ?? timestamp,
      updated_at: timestamps?.updated_at ?? timestamp,
      blocks: document.blocks,
    };
    writeDb(db);
  }

  async cacheProject(project: Project): Promise<void> {
    const db = readDb();
    db.projects[project.id] = project;
    writeDb(db);
  }
}
