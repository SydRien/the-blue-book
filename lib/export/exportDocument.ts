import { layoutToPdfBlob, downloadBlob } from "@/lib/export/adapters/pdfAdapter";
import {
  defaultTitlePageInfo,
  describeExportBlocker,
} from "@/lib/export/exportSettings";
import { buildExportPipeline } from "@/lib/export/pipeline";
import type {
  ExportPipelineResult,
  ExportRequest,
  ExportSettings,
  TitlePageInfo,
  WritingMode,
} from "@/lib/export/types";
import type { BlueBookDocument } from "@/types/document";

function assertPipelineMode(mode: ExportSettings["mode"]): WritingMode {
  if (mode !== "screenplay") {
    throw new Error(`Writing mode not implemented: ${mode}`);
  }
  return mode;
}

function resolveTitlePage(
  document: BlueBookDocument,
  settings: ExportSettings,
  titlePage?: TitlePageInfo,
): TitlePageInfo | undefined {
  if (!settings.includeTitlePage) {
    return undefined;
  }
  return titlePage ?? defaultTitlePageInfo(document);
}

export function inspectExportPipeline(request: {
  document: BlueBookDocument;
  settings: ExportSettings;
  titlePage?: TitlePageInfo;
}): ExportPipelineResult {
  const mode = assertPipelineMode(request.settings.mode);
  const titlePage = resolveTitlePage(
    request.document,
    request.settings,
    request.titlePage,
  );
  return buildExportPipeline(request.document, mode, { titlePage });
}

/**
 * Client-side PDF download using ExportSettings + optional title page.
 */
export async function exportDocumentToPdf(
  request: ExportRequest,
): Promise<{ pipeline: ExportPipelineResult; filename: string }> {
  const blocker = describeExportBlocker(request.settings);
  if (blocker) {
    throw new Error(blocker);
  }

  const mode = assertPipelineMode(request.settings.mode);
  const titlePage = resolveTitlePage(
    request.document,
    request.settings,
    request.titlePage,
  );
  const pipeline = buildExportPipeline(request.document, mode, { titlePage });
  const blob = await layoutToPdfBlob(pipeline.layout);
  const safeTitle =
    request.document.title.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_") ||
    "screenplay";
  const filename = `${safeTitle}.pdf`;

  downloadBlob(blob, filename);

  return { pipeline, filename };
}
