import { EntityManager } from "@/lib/entities/entityManager";
import { createLocalCharacterStore } from "@/lib/entities/characters/localCharacterStore";
import {
  DEFAULT_CHARACTER_DATA,
  type CharacterData,
  type CharacterRecord,
  type CreateCharacterInput,
  type UpdateCharacterInput,
} from "@/lib/entities/characters/types";
import type { EntityRecord } from "@/lib/entities/types";

function toCharacterRecord(
  entity: EntityRecord<CharacterData>,
): CharacterRecord {
  const data = { ...DEFAULT_CHARACTER_DATA, ...entity.data };
  return {
    id: entity.id,
    name: entity.name,
    aliases: Array.isArray(data.aliases) ? [...data.aliases] : [],
    role: typeof data.role === "string" ? data.role : "",
    description: typeof data.description === "string" ? data.description : "",
    notes: typeof data.notes === "string" ? data.notes : "",
    color:
      typeof data.color === "string" && data.color
        ? data.color
        : DEFAULT_CHARACTER_DATA.color,
    linkedBlocks: Array.isArray(data.linkedBlocks)
      ? [...data.linkedBlocks]
      : [],
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

/**
 * Character domain facade over shared EntityManager CRUD.
 */
export class CharacterManager {
  constructor(private readonly manager: EntityManager) {}

  list(): CharacterRecord[] {
    return this.manager
      .list("character")
      .map((entity) =>
        toCharacterRecord(entity as EntityRecord<CharacterData>),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  get(id: string): CharacterRecord | null {
    const entity = this.manager.get(id);
    if (!entity || entity.kind !== "character") {
      return null;
    }
    return toCharacterRecord(entity as EntityRecord<CharacterData>);
  }

  create(input: CreateCharacterInput): CharacterRecord {
    const entity = this.manager.create<CharacterData>({
      kind: "character",
      name: input.name,
      data: {
        aliases: input.aliases ?? [],
        role: input.role ?? "",
        description: input.description ?? "",
        notes: input.notes ?? "",
        color: input.color ?? DEFAULT_CHARACTER_DATA.color,
        linkedBlocks: [],
      },
    });
    return toCharacterRecord(entity);
  }

  rename(id: string, name: string): CharacterRecord {
    const entity = this.manager.rename(id, name);
    return toCharacterRecord(entity as EntityRecord<CharacterData>);
  }

  update(id: string, patch: UpdateCharacterInput): CharacterRecord {
    const existing = this.get(id);
    if (!existing) {
      throw new Error(`Character not found: ${id}`);
    }

    const dataPatch: Partial<CharacterData> = {};
    if (patch.aliases !== undefined) {
      dataPatch.aliases = patch.aliases;
    }
    if (patch.role !== undefined) {
      dataPatch.role = patch.role;
    }
    if (patch.description !== undefined) {
      dataPatch.description = patch.description;
    }
    if (patch.notes !== undefined) {
      dataPatch.notes = patch.notes;
    }
    if (patch.color !== undefined) {
      dataPatch.color = patch.color;
    }
    if (patch.linkedBlocks !== undefined) {
      dataPatch.linkedBlocks = patch.linkedBlocks;
    }

    const entity = this.manager.update<CharacterData>(id, {
      name: patch.name,
      data: dataPatch,
    });
    return toCharacterRecord(entity as EntityRecord<CharacterData>);
  }

  delete(id: string): void {
    const existing = this.get(id);
    if (!existing) {
      throw new Error(`Character not found: ${id}`);
    }
    this.manager.delete(id);
  }

  linkBlock(characterId: string, blockId: string): CharacterRecord {
    const existing = this.get(characterId);
    if (!existing) {
      throw new Error(`Character not found: ${characterId}`);
    }
    if (existing.linkedBlocks.includes(blockId)) {
      return existing;
    }
    return this.update(characterId, {
      linkedBlocks: [...existing.linkedBlocks, blockId],
    });
  }

  unlinkBlock(characterId: string, blockId: string): CharacterRecord {
    const existing = this.get(characterId);
    if (!existing) {
      throw new Error(`Character not found: ${characterId}`);
    }
    return this.update(characterId, {
      linkedBlocks: existing.linkedBlocks.filter((id) => id !== blockId),
    });
  }

  findByLinkedBlock(blockId: string): CharacterRecord | null {
    return (
      this.list().find((character) =>
        character.linkedBlocks.includes(blockId),
      ) ?? null
    );
  }
}

let singleton: CharacterManager | null = null;

export function getCharacterManager(): CharacterManager {
  if (!singleton) {
    singleton = new CharacterManager(
      new EntityManager(createLocalCharacterStore()),
    );
  }
  return singleton;
}

/** Test helper — inject a manager (e.g. in-memory store). */
export function createCharacterManager(
  manager: EntityManager = new EntityManager(createLocalCharacterStore()),
): CharacterManager {
  return new CharacterManager(manager);
}
