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
  const modeOk =
    settings.mode === "screenplay" ||
    settings.mode === "stage_play" ||
    settings.mode === "interactive";

  return (
    modeOk &&
    (settings.format === "pdf" || settings.format === "docx") &&
    settings.pageSize === "letter"
  );
}

export function describeExportBlocker(settings: ExportSettings): string | null {
  if (
    settings.mode !== "screenplay" &&
    settings.mode !== "stage_play" &&
    settings.mode !== "interactive"
  ) {
    return "That writing mode is not available yet.";
  }
  if (settings.format !== "pdf" && settings.format !== "docx") {
    return "That file format is not available yet.";
  }
  if (settings.pageSize !== "letter") {
    return "A4 page size is not available yet.";
  }
  return null;
}
