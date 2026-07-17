import type { BlueBookDocument } from "@/types/document";
import type { ExportSettings, TitlePageInfo } from "@/lib/export/types";

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  mode: "screenplay",
  format: "pdf",
  pageSize: "letter",
  includeTitlePage: false,
};

export function defaultTitlePageInfo(
  document: BlueBookDocument,
): TitlePageInfo {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return {
    title: document.title.trim() || "Untitled",
    author: "",
    date: `${now.getFullYear()}-${month}-${day}`,
  };
}

/** @deprecated Use defaultTitlePageInfo */
export const buildTitlePageInfo = defaultTitlePageInfo;

/** True when the selected combo can produce a download today. */
export function isExportSettingsReady(settings: ExportSettings): boolean {
  return (
    settings.mode === "screenplay" &&
    settings.format === "pdf" &&
    settings.pageSize === "letter"
  );
}

export function describeExportBlocker(settings: ExportSettings): string | null {
  if (settings.mode !== "screenplay") {
    return "That writing mode is not available yet.";
  }
  if (settings.format !== "pdf") {
    return "DOCX export is not available yet.";
  }
  if (settings.pageSize !== "letter") {
    return "A4 page size is not available yet.";
  }
  return null;
}
