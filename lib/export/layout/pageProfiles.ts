import {
  CJK_FONT_FAMILY,
  SCREENPLAY_FONT_FAMILY,
} from "@/lib/export/fonts/fontFamilies";
import type { PageProfile, WritingMode } from "@/lib/export/types";

const PT_PER_IN = 72;

/**
 * US Letter screenplay profile — Final Draft / Fade In–style geometry.
 * Values frozen for Phase 5.2 calibration — do not regress.
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
  lineHeightPt: 12 * 1.2,
  charsPerInch: 10,
  cjkCharsPerInch: 6,
  actionWidthIn: 6,
  dialogueLeftIn: 2.5,
  dialogueWidthIn: 4.0,
  dialogueAlign: "left",
  spaceBeforeScenePt: 0,
  spaceAfterScenePt: 12 * 1.5,
  spaceAfterActionPt: 12 * 1.5,
  spaceAfterCharacterPt: 0,
  spaceAfterDialoguePt: 12 * 1.5,
  pageNumberTopPt: 0.5 * PT_PER_IN,
  pageNumberWidthPt: 1 * PT_PER_IN,
};

/**
 * Stage play — character/dialogue centered; stage directions inset + italic.
 */
export const STAGE_PLAY_LETTER_PROFILE: PageProfile = {
  id: "stage-play-letter",
  mode: "stage_play",
  pageSize: "letter",
  pageWidthPt: 8.5 * PT_PER_IN,
  pageHeightPt: 11 * PT_PER_IN,
  marginLeftPt: 1.25 * PT_PER_IN,
  marginRightPt: 1.25 * PT_PER_IN,
  marginTopPt: 1 * PT_PER_IN,
  marginBottomPt: 1 * PT_PER_IN,
  fontFamily: SCREENPLAY_FONT_FAMILY,
  cjkFontFamily: CJK_FONT_FAMILY,
  fontSizePt: 12,
  lineHeightPt: 12 * 1.25,
  charsPerInch: 10,
  cjkCharsPerInch: 6,
  actionWidthIn: 6,
  bodyLeftIn: 1.75,
  bodyWidthIn: 5,
  dialogueLeftIn: 2.75,
  dialogueWidthIn: 3,
  dialogueAlign: "center",
  spaceBeforeScenePt: 0,
  spaceAfterScenePt: 12 * 1.5,
  spaceAfterActionPt: 12 * 1.25,
  spaceAfterCharacterPt: 0,
  spaceAfterDialoguePt: 12 * 1.5,
  pageNumberTopPt: 0.5 * PT_PER_IN,
  pageNumberWidthPt: 1 * PT_PER_IN,
};

/**
 * Interactive script — narration full-width; dialogue column like screenplay.
 * Reserved for future choice/trigger/interaction layout hooks.
 */
export const INTERACTIVE_LETTER_PROFILE: PageProfile = {
  id: "interactive-letter",
  mode: "interactive",
  pageSize: "letter",
  pageWidthPt: 8.5 * PT_PER_IN,
  pageHeightPt: 11 * PT_PER_IN,
  marginLeftPt: 1.25 * PT_PER_IN,
  marginRightPt: 1.25 * PT_PER_IN,
  marginTopPt: 1 * PT_PER_IN,
  marginBottomPt: 1 * PT_PER_IN,
  fontFamily: SCREENPLAY_FONT_FAMILY,
  cjkFontFamily: CJK_FONT_FAMILY,
  fontSizePt: 12,
  lineHeightPt: 12 * 1.2,
  charsPerInch: 10,
  cjkCharsPerInch: 6,
  actionWidthIn: 6,
  dialogueLeftIn: 2.5,
  dialogueWidthIn: 3.5,
  dialogueAlign: "left",
  spaceBeforeScenePt: 0,
  spaceAfterScenePt: 12 * 1.5,
  spaceAfterActionPt: 12 * 1.5,
  spaceAfterCharacterPt: 0,
  spaceAfterDialoguePt: 12 * 1.5,
  pageNumberTopPt: 0.5 * PT_PER_IN,
  pageNumberWidthPt: 1 * PT_PER_IN,
};

export function pageProfileForMode(mode: WritingMode): PageProfile {
  switch (mode) {
    case "stage_play":
      return STAGE_PLAY_LETTER_PROFILE;
    case "interactive":
      return INTERACTIVE_LETTER_PROFILE;
    case "screenplay":
    default:
      return SCREENPLAY_LETTER_PROFILE;
  }
}
