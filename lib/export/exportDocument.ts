import { layoutToPdfBlob, downloadBlob } from "@/lib/export/adapters/pdfAdapter";
import { buildExportPipeline } from "@/lib/export/pipeline";
import type { ExportPipelineResult, ExportRequest } from "@/lib/export/types";

export function inspectExportPipeline(
  request: Pick<ExportRequest, "document" | "mode">,
): ExportPipelineResult {
  return buildExportPipeline(request.document, request.mode);
}

export async function exportDocumentToPdf(
  request: ExportRequest,
): Promise<{ pipeline: ExportPipelineResult; filename: string }> {
  if (request.format !== "pdf") {
    throw new Error(`Format not implemented: ${request.format}`);
  }

  const pipeline = buildExportPipeline(request.document, request.mode);
  const blob = await layoutToPdfBlob(pipeline.layout);
  const safeTitle =
    request.document.title.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_") ||
    "screenplay";
  const filename = `${safeTitle}.pdf`;

  downloadBlob(blob, filename);

  return { pipeline, filename };
}
