import type { BlockDefinition, CustomBlockTypeData } from "@/lib/blocks/types";
import { getBlockDefinition, listBlockDefinitions } from "@/lib/blocks/blockRegistry";
import { EntityManager } from "@/lib/entities/entityManager";
import { createLocalEntityStore } from "@/lib/entities/localEntityStore";
import type { EntityRecord } from "@/lib/entities/types";
import { DEFAULT_BLOCK_METADATA, type BlockTypeId } from "@/types/document";

const CUSTOM_ACCENTS = [
  "var(--led-cyan)",
  "var(--led-blue)",
  "var(--led-orange)",
  "var(--led-green)",
  "var(--muted)",
] as const;

let managerSingleton: EntityManager | null = null;

export function getBlockTypeEntityManager(): EntityManager {
  if (!managerSingleton) {
    managerSingleton = new EntityManager(createLocalEntityStore());
  }
  return managerSingleton;
}

export function listCustomBlockTypeEntities(): EntityRecord<CustomBlockTypeData>[] {
  return getBlockTypeEntityManager().list("block_type") as EntityRecord<CustomBlockTypeData>[];
}

export function listAllBlockDefinitions(): BlockDefinition[] {
  return listBlockDefinitions(listCustomBlockTypeEntities());
}

export function createCustomBlockType(name: string): BlockDefinition {
  const manager = getBlockTypeEntityManager();
  const existing = listAllBlockDefinitions();
  const accent =
    CUSTOM_ACCENTS[existing.length % CUSTOM_ACCENTS.length] ??
    "var(--led-cyan)";

  const id = `custom_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const data: CustomBlockTypeData = {
    exportRole: null,
    editorStyle: { accent },
    defaultMetadata: { ...DEFAULT_BLOCK_METADATA },
  };

  const entity = manager.create<CustomBlockTypeData>({
    id,
    kind: "block_type",
    name,
    data,
  });

  return getBlockDefinition(entity.id, [entity])!;
}

export function renameCustomBlockType(
  id: BlockTypeId,
  name: string,
): BlockDefinition {
  const definition = getBlockDefinition(id, listCustomBlockTypeEntities());
  if (!definition) {
    throw new Error(`Block type not found: ${id}`);
  }
  if (!definition.deletable) {
    throw new Error("Built-in block types cannot be renamed");
  }

  const entity = getBlockTypeEntityManager().rename(id, name);
  return getBlockDefinition(entity.id, [entity as EntityRecord<CustomBlockTypeData>])!;
}

export function deleteCustomBlockType(id: BlockTypeId): void {
  const definition = getBlockDefinition(id, listCustomBlockTypeEntities());
  if (!definition) {
    throw new Error(`Block type not found: ${id}`);
  }
  if (!definition.deletable) {
    throw new Error("Built-in block types cannot be deleted");
  }
  getBlockTypeEntityManager().delete(id);
}

/** Count how many document blocks use a type id. */
export function countBlocksOfType(
  blocks: { type: BlockTypeId }[],
  typeId: BlockTypeId,
): number {
  return blocks.filter((block) => block.type === typeId).length;
}
