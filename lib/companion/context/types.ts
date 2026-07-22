import type { Note } from "@/lib/notes/types";
import type { BlueBookDocument } from "@/types/document";

/** Focus block snapshot — mirrors ActiveBlockState fields we need (no editor import). */
export type JonFocusBlock = {
  id: string;
  type: string;
  content: string;
};

export type JonProjectSlice = {
  title: string;
  description: string;
};

export type JonCreativeContextInput = {
  project?: JonProjectSlice | null;
  document?: BlueBookDocument | null;
  activeBlock?: JonFocusBlock | null;
  notes?: Note[];
};

export type JonCreativeContext = {
  /** Bounded string for the system prompt. */
  text: string;
  /** Short UI label lines. */
  label: {
    projectTitle: string | null;
    documentTitle: string | null;
  };
};

export const CREATIVE_CONTEXT_MAX_CHARS = 4500;
export const CREATIVE_CONTEXT_API_MAX_CHARS = 5000;
