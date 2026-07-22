/**
 * Creative Scratchpad notes — orthogonal to DocumentBlocks / export.
 */

export type NoteType = "idea" | "reference" | "research" | "random";

export type NoteData = {
  content: string;
  type: NoteType;
  projectId?: string;
};

export type Note = {
  id: string;
  projectId?: string;
  title: string;
  content: string;
  type: NoteType;
  createdAt: string;
  updatedAt: string;
};

export type CreateNoteInput = {
  title: string;
  content?: string;
  type?: NoteType;
  projectId?: string;
};

export type UpdateNoteInput = {
  title?: string;
  content?: string;
  type?: NoteType;
  projectId?: string | null;
};

export const NOTE_TYPES: NoteType[] = [
  "idea",
  "reference",
  "research",
  "random",
];

export const DEFAULT_NOTE_DATA: NoteData = {
  content: "",
  type: "idea",
};
