import { formatScreenplay } from "@/lib/export/formatters/screenplayFormatter";
import { buildLayout } from "@/lib/export/layout/buildLayout";
import { SCREENPLAY_LETTER_PROFILE } from "@/lib/export/layout/pageProfiles";
import type {
  ExportPipelineResult,
  WritingMode,
} from "@/lib/export/types";
import type { BlueBookDocument } from "@/types/document";

/**
 * Builds the inspectable export pipeline:
 * BlueBookDocument → ExportNode[] → LayoutDocument
 */
export function buildExportPipeline(
  document: BlueBookDocument,
  mode: WritingMode = "screenplay",
): ExportPipelineResult {
  if (mode !== "screenplay") {
    throw new Error(`Writing mode not implemented: ${mode}`);
  }

  // Formatter owns block→node mapping (including export visibility).
  const nodes = formatScreenplay(document.blocks);
  const layout = buildLayout(document.title, nodes, SCREENPLAY_LETTER_PROFILE);

  return {
    document,
    nodes,
    layout,
  };
}
