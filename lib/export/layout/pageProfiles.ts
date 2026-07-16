import {
  CJK_FONT_FAMILY,
  SCREENPLAY_FONT_FAMILY,
} from "@/lib/export/fonts/loadScreenplayFonts";
import type { PageProfile } from "@/lib/export/types";

const PT_PER_IN = 72;

/**
 * US Letter screenplay profile — calibrated toward Final Draft / Fade In geometry.
 *
 * From page left edge:
 * - Action / scene: 1.5" … 7.5" (6" wide)
 * - Dialogue:       2.5" … 6.0" (3.5" wide)
 * - Character:      3.7" tab, centered over dialogue column
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
  lineHeightPt: 12,
  charsPerInch: 10,
  cjkCharsPerInch: 6,
  actionWidthIn: 6,
  characterLeftIn: 3.7,
  dialogueLeftIn: 2.5,
  dialogueWidthIn: 3.5,
  // One blank screenplay line before/after major elements
  spaceBeforeScenePt: 12,
  spaceAfterScenePt: 12,
  spaceBeforeCharacterPt: 12,
  spaceAfterDialoguePt: 12,
};
