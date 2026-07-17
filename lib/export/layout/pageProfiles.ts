import {
  CJK_FONT_FAMILY,
  SCREENPLAY_FONT_FAMILY,
} from "@/lib/export/fonts/fontFamilies";
import type { PageProfile } from "@/lib/export/types";

const PT_PER_IN = 72;

/**
 * US Letter screenplay profile — Final Draft / Fade In–style geometry.
 *
 * From page left edge:
 * - Action / scene: 1.5" … 7.5" (6" wide)
 * - Dialogue:       2.5" … 6.5" (4" wide)
 * - Character:      optically centered over dialogue band (by measured width)
 *
 * Header: page number at 0.5" top; body content starts at 1.0" top.
 */
export const SCREENPLAY_LETTER_PROFILE: PageProfile = {
  id: "screenplay-letter",
  mode: "screenplay",
  pageSize: "letter",
  pageWidthPt: 8.5 * PT_PER_IN,
  pageHeightPt: 11 * PT_PER_IN,
  marginLeftPt: 1.5 * PT_PER_IN,
  marginRightPt: 1 * PT_PER_IN,
  marginTopPt: 1 * PT_PER_IN,
  marginBottomPt: 1 * PT_PER_IN,
  fontFamily: SCREENPLAY_FONT_FAMILY,
  cjkFontFamily: CJK_FONT_FAMILY,
  fontSizePt: 12,
  // Body leading: 1.2 × 12pt (20% more open than single-spaced screenplay).
  lineHeightPt: 12 * 1.2,
  charsPerInch: 10,
  cjkCharsPerInch: 6,
  actionWidthIn: 6,
  dialogueLeftIn: 2.5,
  dialogueWidthIn: 4.0,
  // Separation comes from spaceAfter* only (no stacked spaceBefore).
  // Inter-block gap = 12 × 1.5; character → dialogue stays tight (0).
  spaceBeforeScenePt: 0,
  spaceAfterScenePt: 12 * 1.5,
  spaceAfterActionPt: 12 * 1.5,
  spaceAfterCharacterPt: 0,
  spaceAfterDialoguePt: 12 * 1.5,
  pageNumberTopPt: 0.5 * PT_PER_IN,
  pageNumberWidthPt: 1 * PT_PER_IN,
};
