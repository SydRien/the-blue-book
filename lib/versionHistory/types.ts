import type { BlueBookDocument } from "@/types/document";

export type DocumentVersion = {
  id: string;
  documentId: string;
  label: string;
  snapshot: BlueBookDocument;
  createdAt: string;
};

export type VersionStoreSnapshot = {
  version: 1;
  versions: DocumentVersion[];
};

/**
 * Abstract version store — localStorage now, Supabase later.
 */
export interface VersionStore {
  listByDocument(documentId: string): DocumentVersion[];
  get(id: string): DocumentVersion | null;
  create(record: DocumentVersion): void;
  delete(id: string): void;
}
