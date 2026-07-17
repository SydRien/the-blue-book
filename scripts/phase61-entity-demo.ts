/**
 * Phase 6.1 smoke demo — entity CRUD for custom block types + instances.
 * Run: npx tsx scripts/phase61-entity-demo.ts
 *
 * Uses an in-memory store so it does not touch browser localStorage.
 */
import { EntityManager } from "../lib/entities/entityManager.ts";
import type {
  EntityRecord,
  EntityStore,
  EntityKind,
} from "../lib/entities/types.ts";
import {
  getBlockDefinition,
  isRenamableBlockInstance,
  listBlockDefinitions,
} from "../lib/blocks/blockRegistry.ts";
import type { CustomBlockTypeData } from "../lib/blocks/types.ts";
import { DEFAULT_BLOCK_METADATA, createDocumentBlock } from "../types/document.ts";
import type { DocumentBlock } from "../types/document.ts";

function createMemoryStore(): EntityStore {
  let entities: EntityRecord[] = [];
  return {
    list(kind?: EntityKind) {
      return entities.filter(
        (entity) => (!kind || entity.kind === kind) && !entity.deletedAt,
      );
    },
    get(id: string) {
      return entities.find((entity) => entity.id === id && !entity.deletedAt) ?? null;
    },
    upsert(record: EntityRecord) {
      const index = entities.findIndex((entity) => entity.id === record.id);
      if (index >= 0) {
        entities[index] = record;
      } else {
        entities.push(record);
      }
    },
    remove(id: string) {
      entities = entities.filter((entity) => entity.id !== id);
    },
    replaceAll(records: EntityRecord[]) {
      entities = [...records];
    },
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  console.log("[phase61] Entity foundation + block registry demo\n");

  const store = createMemoryStore();
  const manager = new EntityManager(store);

  // 1. Create custom block type via shared EntityManager.create
  const created = manager.create<CustomBlockTypeData>({
    id: `custom_demo`,
    kind: "block_type",
    name: "Camera Note",
    data: {
      exportRole: null,
      editorStyle: { accent: "var(--led-cyan)" },
      defaultMetadata: { ...DEFAULT_BLOCK_METADATA },
    },
  });
  console.log("1. Create custom type:", created.name, `(${created.id})`);
  assert(created.name === "Camera Note", "create name mismatch");

  let definitions = listBlockDefinitions(manager.list("block_type"));
  assert(
    definitions.some((item) => item.id === "custom_demo"),
    "custom type missing from registry",
  );
  assert(
    definitions.some((item) => item.id === "choice"),
    "built-in choice missing",
  );

  // 2. Rename via shared EntityManager.rename
  const renamed = manager.rename("custom_demo", "Cam Note");
  console.log("2. Rename custom type:", renamed.name);
  assert(renamed.name === "Cam Note", "rename failed");

  // 3. Create narrative block instances (document-level adapter)
  const blocks: DocumentBlock[] = [
    createDocumentBlock("scene_heading", "INT. STAGE - NIGHT"),
    createDocumentBlock("choice", "Open the door"),
    createDocumentBlock("custom_demo", "Push in on the letter"),
    createDocumentBlock("character", "JIN WEN GONG"),
  ];
  console.log(
    "3. Create narrative blocks:",
    blocks.map((block) => `${block.type}`).join(", "),
  );
  assert(blocks.some((block) => block.type === "choice"), "choice instance missing");
  assert(
    isRenamableBlockInstance("character"),
    "character should be renamable",
  );

  // Instance rename (applicable): character cue content
  const character = blocks.find((block) => block.type === "character")!;
  character.content = "LI MEI";
  console.log("4. Rename character instance cue:", character.content);

  // 4. Delete custom type (after reassigning instances)
  const usage = blocks.filter((block) => block.type === "custom_demo").length;
  for (const block of blocks) {
    if (block.type === "custom_demo") {
      block.type = "action";
    }
  }
  manager.delete("custom_demo");
  definitions = listBlockDefinitions(manager.list("block_type"));
  console.log(
    `5. Delete custom type (reassigned ${usage} instance(s) → action)`,
  );
  assert(
    !definitions.some((item) => item.id === "custom_demo"),
    "custom type still in registry",
  );
  assert(
    getBlockDefinition("choice")?.builtIn === true,
    "choice should remain built-in",
  );

  // 5. Delete a block instance
  const before = blocks.length;
  const choiceIndex = blocks.findIndex((block) => block.type === "choice");
  assert(choiceIndex >= 0, "choice block not found");
  blocks.splice(choiceIndex, 1);
  console.log(
    `6. Delete choice instance: ${before} → ${blocks.length} blocks`,
  );

  console.log("\n[phase61] All demonstrations passed");
  console.log(
    "Built-ins:",
    listBlockDefinitions()
      .filter((item) => item.builtIn)
      .map((item) => item.id)
      .join(", "),
  );
}

main();
