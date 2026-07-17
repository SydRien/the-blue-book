"use client";

import { useEffect, useMemo, useState } from "react";
import {
  exportDocumentToPdf,
  inspectExportPipeline,
} from "@/lib/export/exportDocument";
import {
  DEFAULT_EXPORT_SETTINGS,
  defaultTitlePageInfo,
  describeExportBlocker,
  isExportSettingsReady,
} from "@/lib/export/exportSettings";
import type {
  ExportFormat,
  ExportPageSize,
  ExportPipelineResult,
  ExportSettings,
  ExportWritingMode,
  TitlePageInfo,
} from "@/lib/export/types";
import type { BlueBookDocument } from "@/types/document";

type DebugTab = "document" | "nodes" | "layout";

type ExportPanelProps = {
  document: BlueBookDocument;
  open: boolean;
  onClose: () => void;
};

const MODE_OPTIONS: {
  id: ExportWritingMode;
  label: string;
  enabled: boolean;
}[] = [
  { id: "screenplay", label: "Screenplay", enabled: true },
  { id: "stage_play", label: "Stage Play", enabled: false },
  { id: "interactive", label: "Interactive Script", enabled: false },
];

const FORMAT_OPTIONS: {
  id: ExportFormat;
  label: string;
  enabled: boolean;
}[] = [
  { id: "pdf", label: "PDF", enabled: true },
  { id: "docx", label: "DOCX", enabled: false },
];

const PAGE_SIZE_OPTIONS: {
  id: ExportPageSize;
  label: string;
  enabled: boolean;
}[] = [
  { id: "letter", label: "US Letter", enabled: true },
  { id: "a4", label: "A4", enabled: true },
];

function OptionGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string; enabled: boolean }[];
  onChange: (next: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 font-mono text-[9px] tracking-[0.16em] text-muted uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isActive = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={!option.enabled}
              title={
                option.enabled ? undefined : `${option.label} — coming soon`
              }
              onClick={() => onChange(option.id)}
              className="module-button rounded-sm border border-panel-border px-3 py-2 font-mono text-[10px] tracking-[0.12em] text-foreground uppercase disabled:cursor-not-allowed disabled:opacity-40"
              data-active={isActive}
            >
              {option.label}
              {!option.enabled ? (
                <span className="ml-1.5 text-muted normal-case tracking-normal">
                  soon
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[9px] tracking-[0.16em] text-muted uppercase">
        {label}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-sm border border-panel-border bg-panel-inset px-3 py-2 font-mono text-[11px] text-foreground outline-none placeholder:text-muted/60 focus:border-accent"
      />
    </label>
  );
}

export function ExportPanel({ document, open, onClose }: ExportPanelProps) {
  const [settings, setSettings] = useState<ExportSettings>(
    DEFAULT_EXPORT_SETTINGS,
  );
  const [titlePage, setTitlePage] = useState<TitlePageInfo>(() =>
    defaultTitlePageInfo(document),
  );
  const [tab, setTab] = useState<DebugTab>("document");
  const [pipeline, setPipeline] = useState<ExportPipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [lastFilename, setLastFilename] = useState<string | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setTitlePage((current) => ({
      title: document.title.trim() || current.title || "Untitled",
      author: current.author,
      date: current.date || defaultTitlePageInfo(document).date,
    }));
  }, [open, document.id, document.title]);

  const exportReady = isExportSettingsReady(settings);
  const exportBlocker = describeExportBlocker(settings);

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

  function patchSettings(patch: Partial<ExportSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
    setError(null);
  }

  function patchTitlePage(patch: Partial<TitlePageInfo>) {
    setTitlePage((current) => ({ ...current, ...patch }));
    setError(null);
  }

  function handleInspect() {
    setError(null);
    try {
      const result = inspectExportPipeline({
        document,
        settings,
        titlePage: settings.includeTitlePage ? titlePage : undefined,
      });
      setPipeline(result);
      setDebugOpen(true);
      setTab("layout");
    } catch (inspectError) {
      setError(
        inspectError instanceof Error
          ? inspectError.message
          : "Failed to build export pipeline",
      );
    }
  }

  async function handleExport() {
    if (!exportReady) {
      setError(exportBlocker ?? "Export options not available yet.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const { pipeline: result, filename } = await exportDocumentToPdf({
        document,
        settings,
        titlePage: settings.includeTitlePage ? titlePage : undefined,
      });
      setPipeline(result);
      setLastFilename(filename);
      setTab("layout");
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Export failed",
      );
    } finally {
      setPending(false);
    }
  }

  const summary = [
    MODE_OPTIONS.find((item) => item.id === settings.mode)?.label,
    FORMAT_OPTIONS.find((item) => item.id === settings.format)?.label,
    PAGE_SIZE_OPTIONS.find((item) => item.id === settings.pageSize)?.label,
    settings.includeTitlePage ? "Title page on" : "Title page off",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[min(860px,92vh)] w-full max-w-3xl flex-col rounded-sm border border-panel-border bg-panel shadow-[0_16px_48px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between border-b border-panel-border px-4 py-3">
          <div>
            <p className="font-mono text-sm tracking-[0.16em] text-foreground uppercase">
              Export
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
              {document.title || "Untitled"} · {summary}
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

        <div className="space-y-4 overflow-y-auto border-b border-panel-border px-4 py-4">
          <OptionGroup
            label="Writing Mode"
            value={settings.mode}
            options={MODE_OPTIONS}
            onChange={(mode) => patchSettings({ mode })}
          />

          <OptionGroup
            label="File Format"
            value={settings.format}
            options={FORMAT_OPTIONS}
            onChange={(format) => patchSettings({ format })}
          />

          <OptionGroup
            label="Page Size"
            value={settings.pageSize}
            options={PAGE_SIZE_OPTIONS}
            onChange={(pageSize) => patchSettings({ pageSize })}
          />

          <div>
            <p className="mb-2 font-mono text-[9px] tracking-[0.16em] text-muted uppercase">
              Options
            </p>
            <button
              type="button"
              className="module-button flex w-full items-center justify-between rounded-sm border border-panel-border px-3 py-2.5"
              data-active={settings.includeTitlePage}
              onClick={() =>
                patchSettings({ includeTitlePage: !settings.includeTitlePage })
              }
            >
              <span className="font-mono text-[11px] tracking-[0.12em] uppercase">
                Include Title Page
              </span>
              <span
                className={`led-dot h-2 w-2 rounded-full ${
                  settings.includeTitlePage
                    ? "bg-led-green text-led-green"
                    : "bg-[#3a3a42] text-[#3a3a42]"
                }`}
                aria-hidden
              />
            </button>

            {settings.includeTitlePage ? (
              <div className="mt-3 space-y-3 rounded-sm border border-panel-border bg-panel-inset p-3">
                <p className="font-mono text-[9px] tracking-[0.14em] text-foreground uppercase">
                  Title Page
                </p>
                <Field
                  label="Script Title"
                  value={titlePage.title}
                  placeholder="Untitled"
                  onChange={(title) => patchTitlePage({ title })}
                />
                <Field
                  label="Written By"
                  value={titlePage.author}
                  placeholder="Author name"
                  onChange={(author) => patchTitlePage({ author })}
                />
                <Field
                  label="Date"
                  value={titlePage.date ?? ""}
                  placeholder="Optional"
                  onChange={(date) =>
                    patchTitlePage({ date: date.trim() ? date : undefined })
                  }
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-panel-border px-4 py-3">
          <button
            type="button"
            disabled={pending || !exportReady}
            onClick={() => void handleExport()}
            className="module-button rounded-sm border border-panel-border px-4 py-2.5 font-mono text-[11px] tracking-[0.14em] text-foreground uppercase disabled:cursor-not-allowed disabled:opacity-40"
            data-active="true"
          >
            {pending ? "Generating…" : "Download PDF"}
          </button>
          {lastFilename ? (
            <span className="font-mono text-[10px] text-led-green">
              Saved · {lastFilename}
            </span>
          ) : null}
          {!exportReady && exportBlocker ? (
            <span className="font-mono text-[10px] text-led-orange">
              {exportBlocker}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setDebugOpen((value) => !value)}
            className="module-button ml-auto rounded-sm border border-panel-border px-3 py-2 font-mono text-[10px] tracking-[0.12em] text-muted uppercase"
            data-active={debugOpen}
          >
            {debugOpen ? "Hide Debug" : "Debug"}
          </button>
        </div>

        {error ? (
          <p className="border-b border-panel-border px-4 py-2 font-mono text-[10px] text-[#c45c5c]">
            {error}
          </p>
        ) : null}

        {debugOpen ? (
          <>
            <div className="flex flex-wrap gap-2 border-b border-panel-border px-4 py-2">
              <button
                type="button"
                onClick={handleInspect}
                className="module-button rounded-sm border border-panel-border px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-foreground uppercase"
              >
                Inspect Pipeline
              </button>
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
            <pre className="min-h-0 flex-1 overflow-auto bg-panel-inset p-4 font-mono text-[11px] leading-relaxed text-foreground">
              {debugJson}
            </pre>
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-2 px-4 py-6">
            <p className="font-mono text-[11px] tracking-[0.14em] text-led-cyan uppercase">
              Ready to export
            </p>
            <p className="max-w-md font-mono text-[11px] leading-relaxed text-muted">
              With a title page enabled, PDF page 1 is the cover; the script
              still begins numbered from 1.
            </p>
          </div>
        )}

        <div className="border-t border-panel-border px-4 py-2">
          <p className="font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
            Settings are session-only · not saved to the cloud
          </p>
        </div>
      </div>
    </div>
  );
}
