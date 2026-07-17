import { formatScreenplay } from "@/lib/export/formatters/screenplayFormatter";
import { buildLayout } from "@/lib/export/layout/buildLayout";
import { buildTitlePageLayout } from "@/lib/export/layout/buildTitlePage";
import { SCREENPLAY_LETTER_PROFILE } from "@/lib/export/layout/pageProfiles";
import type {
  ExportPipelineResult,
  TitlePageInfo,
  WritingMode,
} from "@/lib/export/types";
import type { BlueBookDocument } from "@/types/document";

export type BuildExportPipelineOptions = {
  titlePage?: TitlePageInfo;
};

/**
 * Builds the inspectable export pipeline:
 * BlueBookDocument → ExportNode[] → LayoutDocument
 * (+ optional TitlePageLayout section, never from DocumentBlocks)
 */
export function buildExportPipeline(
  document: BlueBookDocument,
  mode: WritingMode = "screenplay",
  options: BuildExportPipelineOptions = {},
): ExportPipelineResult {
  if (mode !== "screenplay") {
    throw new Error(`Writing mode not implemented: ${mode}`);
  }

  const nodes = formatScreenplay(document.blocks);
  const layout = buildLayout(document.title, nodes, SCREENPLAY_LETTER_PROFILE);

  if (options.titlePage) {
    layout.titlePage = buildTitlePageLayout(
      options.titlePage,
      SCREENPLAY_LETTER_PROFILE,
    );
  }

  return {
    document,
    nodes,
    layout,
    titlePage: options.titlePage,
  };
}
