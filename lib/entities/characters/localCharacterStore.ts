import { createLocalEntityStore } from "@/lib/entities/localEntityStore";
import type { EntityStore } from "@/lib/entities/types";

export const CHARACTER_STORE_KEY = "the-blue-book:characters-v1";

/** Dedicated local store for character entities (separate from entities-v1). */
export function createLocalCharacterStore(): EntityStore {
  return createLocalEntityStore(CHARACTER_STORE_KEY);
}
