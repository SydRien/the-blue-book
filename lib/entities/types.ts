/**
 * Reusable entity layer — every user-created object uses the same CRUD surface.
 * deletedAt is reserved for a future trash/archive system (unused in MVP).
 */

export type EntityKind = "block_type" | "block_instance" | "character";

export type EntityRecord<TData = unknown> = {
  id: string;
  kind: EntityKind;
  name: string;
  createdAt: string;
  updatedAt: string;
  /** Reserved for future soft-delete / trash. */
  deletedAt?: string | null;
  data: TData;
};

export type CreateEntityInput<TData = unknown> = {
  kind: EntityKind;
  name: string;
  data: TData;
  /** Optional stable id (e.g. built-in block type ids). */
  id?: string;
};

export type UpdateEntityInput<TData = unknown> = {
  name?: string;
  data?: Partial<TData> | TData;
};

export type EntityStoreSnapshot = {
  version: 1;
  entities: EntityRecord[];
};

export interface EntityStore {
  list(kind?: EntityKind): EntityRecord[];
  get(id: string): EntityRecord | null;
  upsert(record: EntityRecord): void;
  remove(id: string): void;
  replaceAll(records: EntityRecord[]): void;
}
