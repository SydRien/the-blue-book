import type {
  EntityKind,
  EntityRecord,
  EntityStore,
  EntityStoreSnapshot,
} from "@/lib/entities/types";

export const ENTITY_STORE_KEY = "the-blue-book:entities-v1";

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function readSnapshot(storageKey: string): EntityStoreSnapshot {
  if (!canUseStorage()) {
    return { version: 1, entities: [] };
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return { version: 1, entities: [] };
    }
    const parsed = JSON.parse(raw) as Partial<EntityStoreSnapshot>;
    if (!Array.isArray(parsed.entities)) {
      return { version: 1, entities: [] };
    }
    return { version: 1, entities: parsed.entities as EntityRecord[] };
  } catch {
    return { version: 1, entities: [] };
  }
}

function writeSnapshot(storageKey: string, snapshot: EntityStoreSnapshot) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
}

/**
 * localStorage-backed entity store (app-scoped).
 * Pass a custom key for separate catalogs (e.g. characters-v1).
 */
export function createLocalEntityStore(
  storageKey: string = ENTITY_STORE_KEY,
): EntityStore {
  return {
    list(kind?: EntityKind) {
      const { entities } = readSnapshot(storageKey);
      if (!kind) {
        return entities.filter((entity) => !entity.deletedAt);
      }
      return entities.filter(
        (entity) => entity.kind === kind && !entity.deletedAt,
      );
    },

    get(id: string) {
      return (
        readSnapshot(storageKey).entities.find(
          (entity) => entity.id === id && !entity.deletedAt,
        ) ?? null
      );
    },

    upsert(record: EntityRecord) {
      const snapshot = readSnapshot(storageKey);
      const index = snapshot.entities.findIndex(
        (entity) => entity.id === record.id,
      );
      if (index >= 0) {
        snapshot.entities[index] = record;
      } else {
        snapshot.entities.push(record);
      }
      writeSnapshot(storageKey, snapshot);
    },

    remove(id: string) {
      const snapshot = readSnapshot(storageKey);
      snapshot.entities = snapshot.entities.filter(
        (entity) => entity.id !== id,
      );
      writeSnapshot(storageKey, snapshot);
    },

    replaceAll(records: EntityRecord[]) {
      writeSnapshot(storageKey, { version: 1, entities: records });
    },
  };
}
