import type { BlueBookDocument, DocumentBlock } from "@/types/document";

/**
 * Drops blocks marked not for export.
 * Does not alter DocumentBlock schema or TipTap state.
 */
export function filterExportBlocks(document: BlueBookDocument): DocumentBlock[] {
  return document.blocks.filter((block) => block.metadata.export !== false);
}
