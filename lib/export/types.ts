import type { BlueBookDocument, DocumentLanguage } from "@/types/document";

export type WritingMode = "screenplay";

export type ExportFormat = "pdf";

export type ExportRole =
  | "scene_heading"
  | "action"
  | "character"
  | "dialogue";

export type ExportNode = {
  id: string;
  role: ExportRole;
  text: string;
  language: DocumentLanguage;
  font?: string;
  fontSize?: number;
};

export type PageSizeId = "letter"; // A4 reserved for later

export type PageProfile = {
  id: string;
  mode: WritingMode;
  pageSize: PageSizeId;
  pageWidthPt: number;
  pageHeightPt: number;
  marginLeftPt: number;
  marginRightPt: number;
  marginTopPt: number;
  marginBottomPt: number;
  /** Latin / English screenplay face */
  fontFamily: string;
  /** CJK face for Chinese (and mixed) blocks */
  cjkFontFamily: string;
  fontSizePt: number;
  lineHeightPt: number;
  /** Courier-style pitch for English wrapping */
  charsPerInch: number;
  /** Approximate fullwidth CJK characters per inch at 12pt */
  cjkCharsPerInch: number;
  actionWidthIn: number;
  /** Character cue left edge from page left (inches), ~3.7" industry tab */
  characterLeftIn: number;
  /** Dialogue column left edge from page left (inches), ~2.5" */
  dialogueLeftIn: number;
  dialogueWidthIn: number;
  spaceBeforeScenePt: number;
  spaceAfterScenePt: number;
  spaceBeforeCharacterPt: number;
  spaceAfterDialoguePt: number;
};

export type LayoutLine = {
  role: ExportRole;
  text: string;
  /** Absolute X from left edge of page (pt). */
  xPt: number;
  widthPt: number;
  align: "left" | "center";
  fontSizePt: number;
  heightPt: number;
  spaceBeforePt: number;
  /** pdfmake font family for this line */
  fontFamily: string;
};

export type LayoutPage = {
  pageNumber: number;
  lines: LayoutLine[];
};

export type LayoutDocument = {
  title: string;
  mode: WritingMode;
  profileId: string;
  pageSize: PageSizeId;
  pageWidthPt: number;
  pageHeightPt: number;
  marginTopPt: number;
  marginBottomPt: number;
  pages: LayoutPage[];
};

export type ExportPipelineResult = {
  document: BlueBookDocument;
  nodes: ExportNode[];
  layout: LayoutDocument;
};

export type ExportRequest = {
  document: BlueBookDocument;
  mode: WritingMode;
  format: ExportFormat;
};
