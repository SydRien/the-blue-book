import { LocalDocumentStorage } from "@/lib/storage/localDocumentStorage";
import type { DocumentStorage } from "@/lib/storage/types";

/**
 * Active document storage backend.
 * Swap this factory later for a cloud implementation.
 */
export function createDocumentStorage(): DocumentStorage {
  return new LocalDocumentStorage();
}

export type { DocumentStorage } from "@/lib/storage/types";
