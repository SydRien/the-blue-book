import { EntityManager } from "@/lib/entities/entityManager";
import type { EntityRecord } from "@/lib/entities/types";
import { createLocalNoteStore } from "@/lib/notes/localNoteStore";
import {
  DEFAULT_NOTE_DATA,
  type CreateNoteInput,
  type Note,
  type NoteData,
  type NoteType,
  type UpdateNoteInput,
} from "@/lib/notes/types";

function isNoteType(value: unknown): value is NoteType {
  return (
    value === "idea" ||
    value === "reference" ||
    value === "research" ||
    value === "random"
  );
}

function toNote(entity: EntityRecord<NoteData>): Note {
  const data = { ...DEFAULT_NOTE_DATA, ...entity.data };
  const note: Note = {
    id: entity.id,
    title: entity.name,
    content: typeof data.content === "string" ? data.content : "",
    type: isNoteType(data.type) ? data.type : DEFAULT_NOTE_DATA.type,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  if (typeof data.projectId === "string" && data.projectId) {
    note.projectId = data.projectId;
  }
  return note;
}

/**
 * Creative notes facade over shared EntityManager CRUD.
 */
export class NoteManager {
  constructor(private readonly manager: EntityManager) {}

  list(): Note[] {
    return this.manager
      .list("note")
      .map((entity) => toNote(entity as EntityRecord<NoteData>))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  listByProject(projectId: string): Note[] {
    return this.list().filter((note) => note.projectId === projectId);
  }

  get(id: string): Note | null {
    const entity = this.manager.get(id);
    if (!entity || entity.kind !== "note") {
      return null;
    }
    return toNote(entity as EntityRecord<NoteData>);
  }

  create(input: CreateNoteInput): Note {
    const data: NoteData = {
      content: input.content ?? "",
      type: input.type ?? DEFAULT_NOTE_DATA.type,
    };
    if (input.projectId) {
      data.projectId = input.projectId;
    }
    const entity = this.manager.create<NoteData>({
      kind: "note",
      name: input.title,
      data,
    });
    return toNote(entity);
  }

  rename(id: string, title: string): Note {
    const entity = this.manager.rename(id, title);
    return toNote(entity as EntityRecord<NoteData>);
  }

  update(id: string, patch: UpdateNoteInput): Note {
    const existing = this.get(id);
    if (!existing) {
      throw new Error(`Note not found: ${id}`);
    }

    const dataPatch: Partial<NoteData> & { projectId?: string } = {};
    if (patch.content !== undefined) {
      dataPatch.content = patch.content;
    }
    if (patch.type !== undefined) {
      dataPatch.type = patch.type;
    }
    if (patch.projectId !== undefined) {
      // Empty string clears association (EntityManager shallow-merges objects).
      dataPatch.projectId = patch.projectId ?? "";
    }

    const entity = this.manager.update<NoteData>(id, {
      name: patch.title,
      data: dataPatch,
    });
    return toNote(entity as EntityRecord<NoteData>);
  }

  saveToProject(noteId: string, projectId: string): Note {
    return this.update(noteId, { projectId });
  }

  delete(id: string): void {
    const existing = this.get(id);
    if (!existing) {
      throw new Error(`Note not found: ${id}`);
    }
    this.manager.delete(id);
  }
}

let singleton: NoteManager | null = null;

export function getNoteManager(): NoteManager {
  if (!singleton) {
    singleton = new NoteManager(new EntityManager(createLocalNoteStore()));
  }
  return singleton;
}

/** Test helper — inject a manager (e.g. in-memory store). */
export function createNoteManager(
  manager: EntityManager = new EntityManager(createLocalNoteStore()),
): NoteManager {
  return new NoteManager(manager);
}
