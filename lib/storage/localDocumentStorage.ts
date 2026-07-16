import type { BlueBookDocument } from "@/types/document";
import type { DocumentStorage } from "@/lib/storage/types";
import { parseStoredDocument } from "@/lib/storage/validateDocument";

export const LOCAL_DOCUMENT_STORAGE_KEY = "the-blue-book:active-document";

export class LocalDocumentStorage implements DocumentStorage {
  constructor(private readonly key = LOCAL_DOCUMENT_STORAGE_KEY) {}

  async load(): Promise<BlueBookDocument | null> {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(this.key);
      if (!raw) {
        return null;
      }

      return parseStoredDocument(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  async save(document: BlueBookDocument): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(this.key, JSON.stringify(document));
  }

  async clear(): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(this.key);
  }
}
