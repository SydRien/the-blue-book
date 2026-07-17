import type {
  CreateEntityInput,
  EntityKind,
  EntityRecord,
  EntityStore,
  UpdateEntityInput,
} from "@/lib/entities/types";

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Shared create / rename / update / delete for all entity kinds.
 * UI owns confirmation before calling delete().
 */
export class EntityManager {
  constructor(private readonly store: EntityStore) {}

  list(kind?: EntityKind): EntityRecord[] {
    return this.store.list(kind);
  }

  get(id: string): EntityRecord | null {
    return this.store.get(id);
  }

  create<TData>(input: CreateEntityInput<TData>): EntityRecord<TData> {
    const timestamp = nowIso();
    const record: EntityRecord<TData> = {
      id: input.id ?? crypto.randomUUID(),
      kind: input.kind,
      name: input.name.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
      data: input.data,
    };

    if (!record.name) {
      throw new Error("Name is required");
    }

    this.store.upsert(record as EntityRecord);
    return record;
  }

  rename(id: string, name: string): EntityRecord {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`Entity not found: ${id}`);
    }

    const nextName = name.trim();
    if (!nextName) {
      throw new Error("Name is required");
    }

    const updated: EntityRecord = {
      ...existing,
      name: nextName,
      updatedAt: nowIso(),
    };
    this.store.upsert(updated);
    return updated;
  }

  update<TData>(id: string, patch: UpdateEntityInput<TData>): EntityRecord {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`Entity not found: ${id}`);
    }

    const nextName =
      typeof patch.name === "string" ? patch.name.trim() : existing.name;
    if (!nextName) {
      throw new Error("Name is required");
    }

    const nextData =
      patch.data === undefined
        ? existing.data
        : typeof patch.data === "object" &&
            patch.data !== null &&
            !Array.isArray(patch.data) &&
            typeof existing.data === "object" &&
            existing.data !== null &&
            !Array.isArray(existing.data)
          ? { ...(existing.data as object), ...(patch.data as object) }
          : patch.data;

    const updated: EntityRecord = {
      ...existing,
      name: nextName,
      data: nextData,
      updatedAt: nowIso(),
    };
    this.store.upsert(updated);
    return updated;
  }

  /**
   * Permanent delete for MVP. Future: set deletedAt and keep in store.
   */
  delete(id: string): void {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`Entity not found: ${id}`);
    }
    this.store.remove(id);
  }
}
