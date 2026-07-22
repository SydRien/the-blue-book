import { createLocalEntityStore } from "@/lib/entities/localEntityStore";
import type { EntityStore } from "@/lib/entities/types";

export const CREATIVE_NOTES_STORE_KEY = "the-blue-book:creative-notes-v1";

/** Dedicated local store for creative notes (ready for future Supabase adapter). */
export function createLocalNoteStore(): EntityStore {
  return createLocalEntityStore(CREATIVE_NOTES_STORE_KEY);
}
