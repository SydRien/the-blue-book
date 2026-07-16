import type { BlueBookDocument } from "@/types/document";

/**
 * Storage abstraction for Blue Book documents.
 * Local persistence implements this now; cloud can replace it later
 * without changing editor or schema code.
 */
export interface DocumentStorage {
  load(): Promise<BlueBookDocument | null>;
  save(document: BlueBookDocument): Promise<void>;
  clear(): Promise<void>;
}
