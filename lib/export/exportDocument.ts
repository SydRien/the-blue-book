import { layoutToDocxBlob, downloadBlob as downloadDocxBlob } from "@/lib/export/adapters/docxAdapter";
import { layoutToPdfBlob, downloadBlob as downloadPdfBlob } from "@/lib/export/adapters/pdfAdapter";
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
  if (
    mode !== "screenplay" &&
    mode !== "stage_play" &&
    mode !== "interactive"
  ) {
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

function safeFilename(title: string, extension: string): string {
  const base =
    title.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_") || "screenplay";
  return `${base}.${extension}`;
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

export async function exportDocumentToPdf(
  request: ExportRequest,
): Promise<{ pipeline: ExportPipelineResult; filename: string }> {
  const blocker = describeExportBlocker(request.settings);
  if (blocker) {
    throw new Error(blocker);
  }
  if (request.settings.format !== "pdf") {
    throw new Error("exportDocumentToPdf requires format: pdf");
  }

  const mode = assertPipelineMode(request.settings.mode);
  const titlePage = resolveTitlePage(
    request.document,
    request.settings,
    request.titlePage,
  );
  const pipeline = buildExportPipeline(request.document, mode, { titlePage });
  const blob = await layoutToPdfBlob(pipeline.layout);
  const filename = safeFilename(request.document.title, "pdf");

  downloadPdfBlob(blob, filename);

  return { pipeline, filename };
}

export async function exportDocumentToDocx(
  request: ExportRequest,
): Promise<{ pipeline: ExportPipelineResult; filename: string }> {
  const blocker = describeExportBlocker(request.settings);
  if (blocker) {
    throw new Error(blocker);
  }
  if (request.settings.format !== "docx") {
    throw new Error("exportDocumentToDocx requires format: docx");
  }

  const mode = assertPipelineMode(request.settings.mode);
  const titlePage = resolveTitlePage(
    request.document,
    request.settings,
    request.titlePage,
  );
  const pipeline = buildExportPipeline(request.document, mode, { titlePage });
  const blob = await layoutToDocxBlob(pipeline.layout);
  const filename = safeFilename(request.document.title, "docx");

  downloadDocxBlob(blob, filename);

  return { pipeline, filename };
}

export async function exportDocument(
  request: ExportRequest,
): Promise<{ pipeline: ExportPipelineResult; filename: string }> {
  if (request.settings.format === "docx") {
    return exportDocumentToDocx(request);
  }
  return exportDocumentToPdf({
    ...request,
    settings: { ...request.settings, format: "pdf" },
  });
}
