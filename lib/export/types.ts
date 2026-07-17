import type { BlueBookDocument, DocumentLanguage } from "@/types/document";

/** Pipeline writing modes. */
export type WritingMode = "screenplay" | "stage_play" | "interactive";

/** Writer-facing export mode choices (UI). */
export type ExportWritingMode = WritingMode;

/** Writer-facing format choices (UI). */
export type ExportFormat = "pdf" | "docx";

/**
 * Export experience settings — request/UI state only.
 * Not persisted to the database.
 */
export type ExportSettings = {
  mode: ExportWritingMode;
  format: ExportFormat;
  pageSize: ExportPageSize;
  includeTitlePage: boolean;
};

/** Writer-facing title page metadata (export request only). */
export type TitlePageInfo = {
  title: string;
  author: string;
  date?: string;
};

/**
 * Export layout roles.
 * Screenplay: scene_heading, action, character, dialogue
 * Stage play: scene, stage_direction, character, dialogue
 * Interactive: scene, narration, character, dialogue
 * Reserved (not emitted yet): choice, trigger, interaction, system_note
 */
export type ExportRole =
  | "scene_heading"
  | "action"
  | "character"
  | "dialogue"
  | "scene"
  | "stage_direction"
  | "narration"
  | "choice"
  | "trigger"
  | "interaction"
  | "system_note";

export type ExportNode = {
  id: string;
  role: ExportRole;
  text: string;
  language: DocumentLanguage;
  font?: string;
  fontSize?: number;
};

/** Layout profile page sizes (letter implemented; A4 reserved). */
export type PageSizeId = "letter" | "a4";

/** Alias for export settings page size. */
export type ExportPageSize = PageSizeId;

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
  /** Dialogue column left edge from page left (inches), ~2.5" */
  dialogueLeftIn: number;
  dialogueWidthIn: number;
  /** Dialogue paragraph alignment inside the dialogue band. */
  dialogueAlign: "left" | "center";
  /**
   * Optional left edge for body/direction/narration (inches).
   * Defaults to marginLeft when omitted (screenplay action).
   */
  bodyLeftIn?: number;
  /** Optional body column width (inches). Defaults to actionWidthIn. */
  bodyWidthIn?: number;
  spaceBeforeScenePt: number;
  spaceAfterScenePt: number;
  /** Blank line after action / between action paragraphs */
  spaceAfterActionPt: number;
  /** Gap between character cue and first dialogue line (0 = tight) */
  spaceAfterCharacterPt: number;
  spaceAfterDialoguePt: number;
  /** Page number baseline from top edge (header zone, independent of body). */
  pageNumberTopPt: number;
  /** Page number block width (right-aligned in the top-right). */
  pageNumberWidthPt: number;
};

export type LayoutTextRun = {
  text: string;
  fontFamily: string;
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
  /**
   * Default / primary face for the line (first run).
   * Prefer `runs` for mixed English + CJK.
   */
  fontFamily: string;
  /** Per-script spans for mixed-language lines. */
  runs: LayoutTextRun[];
  /** Stage directions / distinct body lines (adapters honor when set). */
  italic?: boolean;
};

export type LayoutPage = {
  pageNumber: number;
  lines: LayoutLine[];
};

/** Separate from script pages — never sourced from DocumentBlocks. */
export type TitlePageLine = {
  text: string;
  xPt: number;
  yPt: number;
  widthPt: number;
  align: "center";
  fontSizePt: number;
  fontFamily: string;
  runs: LayoutTextRun[];
};

export type TitlePageLayout = {
  info: TitlePageInfo;
  pageWidthPt: number;
  pageHeightPt: number;
  lines: TitlePageLine[];
};

export type LayoutDocument = {
  title: string;
  mode: WritingMode;
  profileId: string;
  pageSize: PageSizeId;
  pageWidthPt: number;
  pageHeightPt: number;
  marginLeftPt: number;
  marginRightPt: number;
  marginTopPt: number;
  marginBottomPt: number;
  pageNumberTopPt: number;
  pageNumberWidthPt: number;
  /** Optional cover page; script `pages` still start at pageNumber 1. */
  titlePage?: TitlePageLayout;
  pages: LayoutPage[];
};

export type ExportPipelineResult = {
  document: BlueBookDocument;
  nodes: ExportNode[];
  layout: LayoutDocument;
  titlePage?: TitlePageInfo;
};

export type ExportRequest = {
  document: BlueBookDocument;
  settings: ExportSettings;
  /** When includeTitlePage is true. */
  titlePage?: TitlePageInfo;
};
