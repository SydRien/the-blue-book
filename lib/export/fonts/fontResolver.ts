import {
  CJK_FONT_FAMILY,
  SCREENPLAY_FONT_FAMILY,
} from "@/lib/export/fonts/fontFamilies";
import type { DocumentLanguage } from "@/types/document";

/**
 * Han, kana, CJK punctuation, and fullwidth forms.
 * Latin letters and ASCII punctuation stay on Courier Prime.
 */
const CJK_CHAR_PATTERN =
  /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;

export type FontRun = {
  text: string;
  fontFamily: string;
};

export function isCjkChar(char: string): boolean {
  return CJK_CHAR_PATTERN.test(char);
}

export function containsCjk(text: string): boolean {
  return CJK_CHAR_PATTERN.test(text);
}

/**
 * Resolves pdfmake font family for a homogeneous string.
 * language=zh selects CJK when the string has no Latin letters.
 */
export function resolveFont(
  text: string,
  language: DocumentLanguage = "en",
): string {
  if (containsCjk(text)) {
    return CJK_FONT_FAMILY;
  }
  if (language === "zh" && !/[A-Za-z]/.test(text)) {
    return CJK_FONT_FAMILY;
  }
  return SCREENPLAY_FONT_FAMILY;
}

/**
 * Splits mixed English/CJK into contiguous font runs for pdfmake.
 *
 * Example: "We cannot retreat. 你好！！" →
 *   CourierPrime: "We cannot retreat. "
 *   NotoSansSC:   "你好！！"
 *
 * ASCII whitespace joins the preceding run (or the following run if leading).
 */
export function resolveFontRuns(
  text: string,
  language: DocumentLanguage = "en",
): FontRun[] {
  if (!text) {
    return [{ text: "", fontFamily: resolveFont(text, language) }];
  }

  const runs: FontRun[] = [];
  let buffer = "";
  let bufferIsCjk: boolean | null = null;

  function flush() {
    if (!buffer) {
      return;
    }
    runs.push({
      text: buffer,
      fontFamily: bufferIsCjk ? CJK_FONT_FAMILY : SCREENPLAY_FONT_FAMILY,
    });
    buffer = "";
    bufferIsCjk = null;
  }

  for (const char of text) {
    if (/\s/.test(char)) {
      buffer += char;
      continue;
    }

    const charIsCjk = isCjkChar(char);

    if (bufferIsCjk === null) {
      bufferIsCjk = charIsCjk;
      buffer += char;
      continue;
    }

    if (charIsCjk === bufferIsCjk) {
      buffer += char;
      continue;
    }

    flush();
    bufferIsCjk = charIsCjk;
    buffer = char;
  }

  flush();

  if (runs.length === 0) {
    return [{ text, fontFamily: resolveFont(text, language) }];
  }

  return runs;
}

/** Visual wrap units: Latin ≈ 1, CJK ≈ 2 (fullwidth). */
export function measureTextUnits(text: string): number {
  let units = 0;
  for (const char of text) {
    units += isCjkChar(char) ? 2 : 1;
  }
  return units;
}
