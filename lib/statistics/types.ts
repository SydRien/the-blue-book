export type DocumentBlockCounts = {
  totalBlocks: number;
  sceneCount: number;
  actionCount: number;
  dialogueCount: number;
  /** Distinct character cue names (normalized). */
  characterCount: number;
};

export type TextStatistics = {
  englishWordCount: number;
  chineseCharacterCount: number;
  totalCharacters: number;
};

export type CharacterDialogueStat = {
  name: string;
  dialogueBlocks: number;
  wordCount: number;
  percentage: number;
};

export type PageEstimate = {
  estimatedPages: number;
  estimatedMinutes: number;
  estimatedLines: number;
};

export type DocumentStatsReport = {
  document: DocumentBlockCounts;
  text: TextStatistics;
  characters: CharacterDialogueStat[];
  pages: PageEstimate;
};
