import type { SupabaseClient } from "@supabase/supabase-js";
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
import { parseStoredBlocks } from "@/lib/storage/validateDocument";

type ProjectRow = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
};

type DocumentRow = {
  id: string;
  project_id: string;
  title: string;
  content_json: unknown;
  created_at: string;
  updated_at: string;
};

async function requireUserId(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    throw new Error("Not authenticated");
  }
  return data.user.id;
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapDocumentSummary(row: DocumentRow): DocumentSummary {
  return {
    id: row.id,
    project_id: row.project_id,
    title: row.title,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export class SupabaseBlueBookRepository implements BlueBookRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listProjects(): Promise<Project[]> {
    const { data, error } = await this.client
      .from("projects")
      .select("id, title, description, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data as ProjectRow[] | null)?.map(mapProject) ?? [];
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const userId = await requireUserId(this.client);
    const { data, error } = await this.client
      .from("projects")
      .insert({
        user_id: userId,
        title: input.title.trim() || "Untitled Project",
        description: input.description?.trim() ?? "",
      })
      .select("id, title, description, created_at, updated_at")
      .single();

    if (error || !data) {
      throw error ?? new Error("Failed to create project");
    }

    return mapProject(data as ProjectRow);
  }

  async updateProject(input: UpdateProjectInput): Promise<Project> {
    const timestamp = new Date().toISOString();
    const { data, error } = await this.client
      .from("projects")
      .update({
        title: input.title.trim() || "Untitled Project",
        updated_at: timestamp,
      })
      .eq("id", input.projectId)
      .select("id, title, description, created_at, updated_at")
      .single();

    if (error || !data) {
      throw error ?? new Error("Failed to update project");
    }

    return mapProject(data as ProjectRow);
  }

  async deleteProject(projectId: string): Promise<void> {
    const { error } = await this.client
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      throw error;
    }
  }

  async getProject(projectId: string): Promise<ProjectWithDocuments | null> {
    const { data, error } = await this.client
      .from("projects")
      .select("id, title, description, created_at, updated_at")
      .eq("id", projectId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    const documents = await this.listDocuments(projectId);
    return { ...mapProject(data as ProjectRow), documents };
  }

  async listDocuments(projectId: string): Promise<DocumentSummary[]> {
    const { data, error } = await this.client
      .from("documents")
      .select("id, project_id, title, content_json, created_at, updated_at")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data as DocumentRow[] | null)?.map(mapDocumentSummary) ?? [];
  }

  async createDocument(input: CreateDocumentInput): Promise<BlueBookDocument> {
    const userId = await requireUserId(this.client);
    const seed = input.document ?? createSeedDocument();
    const document: BlueBookDocument = {
      id: crypto.randomUUID(),
      title: input.title.trim() || seed.title || "Script",
      blocks: seed.blocks,
    };

    const { data, error } = await this.client
      .from("documents")
      .insert({
        id: document.id,
        project_id: input.projectId,
        user_id: userId,
        title: document.title,
        content_json: document.blocks,
      })
      .select("id, title, content_json")
      .single();

    if (error || !data) {
      throw error ?? new Error("Failed to create document");
    }

    await this.client
      .from("projects")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", input.projectId);

    const blocks = parseStoredBlocks(data.content_json) ?? document.blocks;
    return {
      id: data.id,
      title: data.title,
      blocks,
    };
  }

  async loadDocument(
    documentId: string,
    _projectId?: string,
  ): Promise<BlueBookDocument | null> {
    const { data, error } = await this.client
      .from("documents")
      .select("id, title, content_json")
      .eq("id", documentId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    const blocks = parseStoredBlocks(data.content_json);
    if (!blocks) {
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      blocks,
    };
  }

  async saveDocument(input: SaveDocumentInput): Promise<SyncStatus> {
    const userId = await requireUserId(this.client);
    const timestamp = new Date().toISOString();

    const { error } = await this.client.from("documents").upsert(
      {
        id: input.document.id,
        project_id: input.projectId,
        user_id: userId,
        title: input.document.title,
        content_json: input.document.blocks,
        updated_at: timestamp,
      },
      { onConflict: "id" },
    );

    if (error) {
      throw error;
    }

    await this.client
      .from("projects")
      .update({ updated_at: timestamp })
      .eq("id", input.projectId);

    return "synced";
  }
}
