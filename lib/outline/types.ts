/**
 * Outline is derived from DocumentBlock[] — never a separate writing source.
 * Hierarchy types are reserved for later (act / sequence); MVP emits scene only.
 */

export type OutlineNodeType = "act" | "scene" | "sequence";

export type OutlineNode = {
  id: string;
  type: OutlineNodeType;
  title: string;
  /** Stable link to DocumentBlock.id (scene_heading for MVP). */
  sourceBlockId: string;
  /** 1-based index among siblings of the same type (e.g. scene 01, 02). */
  index: number;
  children?: OutlineNode[];
};

export type OutlineDocument = {
  nodes: OutlineNode[];
};

/** Per-scene preview stats (reuse statistics helpers on a block slice). */
export type SceneOutlineStats = {
  blockCount: number;
  dialogueCount: number;
  /** English words + Chinese characters (mixed-script weight). */
  wordCount: number;
};
