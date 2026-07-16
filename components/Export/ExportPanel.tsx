"use client";

import { useMemo, useState } from "react";
import {
  exportDocumentToPdf,
  inspectExportPipeline,
} from "@/lib/export/exportDocument";
import type { ExportPipelineResult } from "@/lib/export/types";
import type { BlueBookDocument } from "@/types/document";

type DebugTab = "document" | "nodes" | "layout";

type ExportPanelProps = {
  document: BlueBookDocument;
  open: boolean;
  onClose: () => void;
};

export function ExportPanel({ document, open, onClose }: ExportPanelProps) {
  const [tab, setTab] = useState<DebugTab>("document");
  const [pipeline, setPipeline] = useState<ExportPipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [lastFilename, setLastFilename] = useState<string | null>(null);

  const debugJson = useMemo(() => {
    if (!pipeline) {
      return "Run “Inspect pipeline” to preview JSON stages.";
    }

    switch (tab) {
      case "document":
        return JSON.stringify(pipeline.document, null, 2);
      case "nodes":
        return JSON.stringify(pipeline.nodes, null, 2);
      case "layout":
        return JSON.stringify(pipeline.layout, null, 2);
    }
  }, [pipeline, tab]);

  if (!open) {
    return null;
  }

  function handleInspect() {
    setError(null);
    try {
      const result = inspectExportPipeline({
        document,
        mode: "screenplay",
      });
      setPipeline(result);
      setTab("nodes");
    } catch (inspectError) {
      setError(
        inspectError instanceof Error
          ? inspectError.message
          : "Failed to build export pipeline",
      );
    }
  }

  async function handleExportPdf() {
    setPending(true);
    setError(null);
    try {
      const { pipeline: result, filename } = await exportDocumentToPdf({
        document,
        mode: "screenplay",
        format: "pdf",
      });
      setPipeline(result);
      setLastFilename(filename);
      setTab("layout");
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "PDF export failed",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[min(860px,92vh)] w-full max-w-3xl flex-col rounded-sm border border-panel-border bg-panel shadow-[0_16px_48px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between border-b border-panel-border px-4 py-3">
          <div>
            <p className="font-mono text-sm tracking-[0.16em] text-foreground uppercase">
              Export Document
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
              Screenplay · PDF · Client-side
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5" aria-hidden>
              <span className="panel-screw" />
              <span className="panel-screw" />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="module-button rounded-sm border border-panel-border px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-muted uppercase"
            >
              Close
            </button>
          </div>
        </div>

        <div className="border-b border-panel-border px-4 py-3">
          <p className="mb-2 font-mono text-[9px] tracking-[0.16em] text-muted uppercase">
            Pipeline
          </p>
          <p className="font-mono text-[11px] text-led-cyan">
            BlueBookDocument → ExportNode[] → LayoutDocument → PDF
          </p>
          <p className="mt-2 font-mono text-[10px] text-muted">
            Source: structured JSON only. TipTap HTML is never used.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-panel-border px-4 py-3">
          <button
            type="button"
            onClick={handleInspect}
            className="module-button rounded-sm border border-panel-border px-3 py-2 font-mono text-[10px] tracking-[0.14em] text-foreground uppercase"
          >
            Inspect Pipeline
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => void handleExportPdf()}
            className="module-button rounded-sm border border-panel-border px-3 py-2 font-mono text-[10px] tracking-[0.14em] text-foreground uppercase"
            data-active="true"
          >
            {pending ? "Generating…" : "Download PDF"}
          </button>
          {lastFilename ? (
            <span className="self-center font-mono text-[10px] text-led-green">
              Saved · {lastFilename}
            </span>
          ) : null}
        </div>

        <div className="flex gap-1 border-b border-panel-border px-4 py-2">
          {(
            [
              ["document", "Document JSON"],
              ["nodes", "ExportNode[]"],
              ["layout", "LayoutDocument"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className="module-button rounded-sm border border-panel-border px-2 py-1.5 font-mono text-[10px] tracking-[0.12em] text-foreground uppercase"
              data-active={tab === id}
            >
              {label}
            </button>
          ))}
        </div>

        {error ? (
          <p className="border-b border-panel-border px-4 py-2 font-mono text-[10px] text-[#c45c5c]">
            {error}
          </p>
        ) : null}

        <pre className="min-h-0 flex-1 overflow-auto bg-panel-inset p-4 font-mono text-[11px] leading-relaxed text-foreground">
          {debugJson}
        </pre>

        <div className="border-t border-panel-border px-4 py-2">
          <p className="font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
            US Letter · Courier Prime + Noto Sans SC · DOCX later
          </p>
        </div>
      </div>
    </div>
  );
}
