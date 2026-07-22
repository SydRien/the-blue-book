import {
  buildDocumentContextSection,
  buildFocusBlockSection,
} from "@/lib/companion/context/documentContext";
import { buildNotesContextSection } from "@/lib/companion/context/notesContext";
import { buildProjectContextSection } from "@/lib/companion/context/projectContext";
import {
  CREATIVE_CONTEXT_MAX_CHARS,
  type JonCreativeContext,
  type JonCreativeContextInput,
} from "@/lib/companion/context/types";

/**
 * Build truncated creative context for Jon's system prompt + UI label.
 */
export function buildJonContext(
  input: JonCreativeContextInput,
): JonCreativeContext {
  const sections: string[] = [];

  if (input.project?.title) {
    sections.push(buildProjectContextSection(input.project));
  }

  if (input.document) {
    sections.push(
      buildDocumentContextSection(input.document, input.activeBlock),
    );
  }

  const focus = buildFocusBlockSection(input.activeBlock);
  if (focus) {
    sections.push(focus);
  }

  const notesSection = buildNotesContextSection(input.notes ?? []);
  if (notesSection) {
    sections.push(notesSection);
  }

  let text = sections.join("\n\n").trim();
  if (text.length > CREATIVE_CONTEXT_MAX_CHARS) {
    text = `${text.slice(0, CREATIVE_CONTEXT_MAX_CHARS - 1)}…`;
  }

  return {
    text,
    label: {
      projectTitle: input.project?.title?.trim() || null,
      documentTitle: input.document?.title?.trim() || null,
    },
  };
}
