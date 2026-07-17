/**
 * Phase 6.3–6.4 demo — character CRUD/link + version snapshot/restore.
 * Run: npx tsx scripts/phase63-characters-versions-demo.ts
 */
import { EntityManager } from "../lib/entities/entityManager.ts";
import { CharacterManager } from "../lib/entities/characters/characterManager.ts";
import type {
  EntityKind,
  EntityRecord,
  EntityStore,
} from "../lib/entities/types.ts";
import { VersionManager } from "../lib/versionHistory/versionManager.ts";
import type {
  DocumentVersion,
  VersionStore,
} from "../lib/versionHistory/types.ts";
import {
  createDocumentBlock,
  type BlueBookDocument,
} from "../types/document.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function createMemoryEntityStore(): EntityStore {
  let entities: EntityRecord[] = [];
  return {
    list(kind?: EntityKind) {
      return entities.filter(
        (entity) => (!kind || entity.kind === kind) && !entity.deletedAt,
      );
    },
    get(id) {
      return entities.find((e) => e.id === id && !e.deletedAt) ?? null;
    },
    upsert(record) {
      const index = entities.findIndex((e) => e.id === record.id);
      if (index >= 0) {
        entities[index] = record;
      } else {
        entities.push(record);
      }
    },
    remove(id) {
      entities = entities.filter((e) => e.id !== id);
    },
    replaceAll(records) {
      entities = [...records];
    },
  };
}

function createMemoryVersionStore(): VersionStore {
  let versions: DocumentVersion[] = [];
  return {
    listByDocument(documentId) {
      return versions
        .filter((v) => v.documentId === documentId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    get(id) {
      return versions.find((v) => v.id === id) ?? null;
    },
    create(record) {
      versions.push(record);
    },
    delete(id) {
      versions = versions.filter((v) => v.id !== id);
    },
  };
}

function main() {
  console.log("[phase63/64] Characters + Versions demo\n");

  const characters = new CharacterManager(
    new EntityManager(createMemoryEntityStore()),
  );
  const versions = new VersionManager(createMemoryVersionStore());

  // --- Characters ---
  let jin = characters.create({ name: "Jin Wen Gong", role: "King of Jin" });
  console.log("1. Create character:", jin.name);
  assert(jin.name === "Jin Wen Gong", "create name");

  jin = characters.rename(jin.id, "Jin Wen Gong II");
  console.log("2. Rename character:", jin.name);
  assert(jin.name === "Jin Wen Gong II", "rename");

  const blockId = "block-character-1";
  jin = characters.linkBlock(jin.id, blockId);
  console.log("3. Link block:", jin.linkedBlocks);
  assert(jin.linkedBlocks.includes(blockId), "link");

  characters.delete(jin.id);
  assert(characters.get(jin.id) === null, "delete");
  console.log("4. Delete character: ok");

  // Recreate for version demo independence
  characters.create({ name: "Fox Yan" });

  // --- Versions ---
  let document: BlueBookDocument = {
    id: "doc-versions",
    title: "Script",
    blocks: [
      createDocumentBlock("scene_heading", "INT. CAMP - NIGHT"),
      createDocumentBlock("character", "JIN WEN GONG"),
      createDocumentBlock("dialogue", "Hold the line."),
    ],
  };
  document.blocks[1]!.id = blockId;

  const snap = versions.createSnapshot(document, "Initial draft");
  console.log("5. Create snapshot:", snap.label);
  assert(versions.list(document.id).length === 1, "one version");

  document = {
    ...document,
    blocks: [
      ...document.blocks,
      createDocumentBlock("action", "New action after snapshot."),
    ],
  };
  console.log("6. Modify document blocks:", document.blocks.length);

  const restored = versions.restore(snap.id);
  console.log("7. Restore snapshot blocks:", restored.blocks.length);
  assert(restored.blocks.length === 3, "restored block count");
  assert(
    !restored.blocks.some((b) => b.content.includes("New action")),
    "restore dropped post-snapshot edit",
  );

  console.log("\n[phase63/64] All demonstrations passed");
}

main();
