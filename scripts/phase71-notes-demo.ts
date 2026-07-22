/**
 * Phase 7.1 — creative notes CRUD + project attach (in-memory store).
 * Run: npx tsx scripts/phase71-notes-demo.ts
 */
import { EntityManager } from "../lib/entities/entityManager";
import { createNoteManager } from "../lib/notes/noteManager";
import type { EntityRecord, EntityStore } from "../lib/entities/types";

function createMemoryStore(): EntityStore {
  const map = new Map<string, EntityRecord>();
  return {
    list(kind) {
      const all = [...map.values()].filter((r) => !r.deletedAt);
      return kind ? all.filter((r) => r.kind === kind) : all;
    },
    get(id) {
      const record = map.get(id);
      if (!record || record.deletedAt) {
        return null;
      }
      return record;
    },
    upsert(record) {
      map.set(record.id, record);
    },
    remove(id) {
      map.delete(id);
    },
    replaceAll(records) {
      map.clear();
      for (const record of records) {
        map.set(record.id, record);
      }
    },
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const manager = createNoteManager(new EntityManager(createMemoryStore()));

const created = manager.create({
  title: "Maybe the villain is actually right",
  content: "Flip the moral frame in act 2.",
  type: "idea",
});
assert(created.title.includes("villain"), "create title");
assert(created.type === "idea", "create type");

const renamed = manager.rename(created.id, "Villain thesis");
assert(renamed.title === "Villain thesis", "rename");

const updated = manager.update(created.id, {
  content: "Act 2 reveal.",
  type: "research",
});
assert(updated.content === "Act 2 reveal.", "update content");
assert(updated.type === "research", "update type");

const projectId = "project-demo-1";
const saved = manager.saveToProject(created.id, projectId);
assert(saved.projectId === projectId, "save to project");
assert(manager.listByProject(projectId).length === 1, "list by project");

manager.delete(created.id);
assert(manager.get(created.id) === null, "delete");
assert(manager.list().length === 0, "list empty after delete");

console.log("phase71-notes-demo: ok");
