import { DEFAULT_BLOCK_DEFINITIONS } from "@/lib/blocks/defaultBlocks";
import type { BlockDefinition, CustomBlockTypeData } from "@/lib/blocks/types";
import type { EntityRecord } from "@/lib/entities/types";
import type { BlockTypeId } from "@/types/document";

function customEntityToDefinition(
  entity: EntityRecord<CustomBlockTypeData>,
): BlockDefinition {
  const data = entity.data;
  return {
    id: entity.id,
    name: entity.name,
    exportRole: data.exportRole ?? null,
    editorStyle: data.editorStyle ?? { accent: "var(--led-cyan)" },
    defaultMetadata: data.defaultMetadata ?? { export: true },
    builtIn: false,
    deletable: true,
  };
}

/**
 * Merges built-in definitions with custom block_type entities.
 */
export function listBlockDefinitions(
  customEntities: EntityRecord[] = [],
): BlockDefinition[] {
  const customs = customEntities
    .filter((entity) => entity.kind === "block_type")
    .map((entity) =>
      customEntityToDefinition(entity as EntityRecord<CustomBlockTypeData>),
    );

  return [...DEFAULT_BLOCK_DEFINITIONS, ...customs];
}

export function getBlockDefinition(
  id: BlockTypeId,
  customEntities: EntityRecord[] = [],
): BlockDefinition | null {
  return (
    listBlockDefinitions(customEntities).find(
      (definition) => definition.id === id,
    ) ?? null
  );
}

export function resolveBlockLabel(
  id: BlockTypeId,
  customEntities: EntityRecord[] = [],
): string {
  return getBlockDefinition(id, customEntities)?.name ?? id;
}

export function isRenamableBlockInstance(typeId: BlockTypeId): boolean {
  // Character cues use content as the display name.
  return typeId === "character";
}
