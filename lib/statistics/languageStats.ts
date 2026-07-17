import type { DocumentBlock } from "@/types/document";
import type { TextStatistics } from "@/lib/statistics/types";

const CJK_CHAR_PATTERN =
  /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;
const ENGLISH_WORD_PATTERN = /[A-Za-z]+(?:'[A-Za-z]+)?/g;

export function countEnglishWords(text: string): number {
  return text.match(ENGLISH_WORD_PATTERN)?.length ?? 0;
}

export function countChineseCharacters(text: string): number {
  let count = 0;
  for (const char of text) {
    if (CJK_CHAR_PATTERN.test(char)) {
      count += 1;
    }
  }
  return count;
}

/** All characters including spaces and punctuation. */
export function countTotalCharacters(text: string): number {
  return [...text].length;
}

/**
 * Mixed-script "word" weight for dialogue share:
 * English words + Chinese characters (each Han count as one unit).
 */
export function countDialogueUnits(text: string): number {
  return countEnglishWords(text) + countChineseCharacters(text);
}

export function computeTextStatistics(blocks: DocumentBlock[]): TextStatistics {
  let englishWordCount = 0;
  let chineseCharacterCount = 0;
  let totalCharacters = 0;

  for (const block of blocks) {
    englishWordCount += countEnglishWords(block.content);
    chineseCharacterCount += countChineseCharacters(block.content);
    totalCharacters += countTotalCharacters(block.content);
  }

  return {
    englishWordCount,
    chineseCharacterCount,
    totalCharacters,
  };
}
