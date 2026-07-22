import { truncateText } from "@/lib/companion/context/projectContext";
import type { Note } from "@/lib/notes/types";

const MAX_NOTES = 5;
const TITLE_MAX = 60;
const CONTENT_MAX = 150;

/**
 * Recent project notes (caller should pass already filtered/sorted; we still cap).
 */
export function buildNotesContextSection(notes: Note[]): string | null {
  const recent = notes.slice(0, MAX_NOTES);
  if (recent.length === 0) {
    return null;
  }

  const lines = ["Recent scratchpad notes:"];
  for (const note of recent) {
    const title = truncateText(note.title || "Untitled", TITLE_MAX);
    const content = truncateText(note.content || "", CONTENT_MAX);
    lines.push(`- (${note.type}) ${title}${content ? `: ${content}` : ""}`);
  }
  return lines.join("\n");
}
