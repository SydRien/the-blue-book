import { formatInteractive } from "@/lib/export/formatters/interactiveFormatter";
import { formatScreenplay } from "@/lib/export/formatters/screenplayFormatter";
import { formatStagePlay } from "@/lib/export/formatters/stagePlayFormatter";
import { buildLayout } from "@/lib/export/layout/buildLayout";
import { buildTitlePageLayout } from "@/lib/export/layout/buildTitlePage";
import { pageProfileForMode } from "@/lib/export/layout/pageProfiles";
import type {
  ExportNode,
  ExportPipelineResult,
  TitlePageInfo,
  WritingMode,
} from "@/lib/export/types";
import type { BlueBookDocument, DocumentBlock } from "@/types/document";

export type BuildExportPipelineOptions = {
  titlePage?: TitlePageInfo;
};

function formatForMode(
  mode: WritingMode,
  blocks: DocumentBlock[],
): ExportNode[] {
  switch (mode) {
    case "stage_play":
      return formatStagePlay(blocks);
    case "interactive":
      return formatInteractive(blocks);
    case "screenplay":
    default:
      return formatScreenplay(blocks);
  }
}

/**
 * Builds the inspectable export pipeline:
 * BlueBookDocument → Formatter(mode) → ExportNode[] → LayoutDocument
 */
export function buildExportPipeline(
  document: BlueBookDocument,
  mode: WritingMode = "screenplay",
  options: BuildExportPipelineOptions = {},
): ExportPipelineResult {
  const profile = pageProfileForMode(mode);
  const nodes = formatForMode(mode, document.blocks);
  const layout = buildLayout(document.title, nodes, profile);

  if (options.titlePage) {
    layout.titlePage = buildTitlePageLayout(options.titlePage, profile);
  }

  return {
    document,
    nodes,
    layout,
    titlePage: options.titlePage,
  };
}
