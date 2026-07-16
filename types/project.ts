import type { BlueBookDocument } from "@/types/document";

export type Project = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type DocumentSummary = {
  id: string;
  project_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ProjectWithDocuments = Project & {
  documents: DocumentSummary[];
};

export type CreateProjectInput = {
  title: string;
  description?: string;
};

export type UpdateProjectInput = {
  projectId: string;
  title: string;
};

export type CreateDocumentInput = {
  projectId: string;
  title: string;
  document?: BlueBookDocument;
};

export type SaveDocumentInput = {
  projectId: string;
  document: BlueBookDocument;
};
