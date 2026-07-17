import { computeDocumentBlockCounts } from "@/lib/statistics/documentStats";
import {
  countChineseCharacters,
  countEnglishWords,
} from "@/lib/statistics/languageStats";
import type { OutlineNode, SceneOutlineStats } from "@/lib/outline/types";
import type { DocumentBlock } from "@/types/document";

/** Zero-padded scene label: 01, 02, … */
export function formatSceneNumber(index: number): string {
  return String(index).padStart(2, "0");
}

export function formatOutlineLabel(node: OutlineNode): string {
  if (node.type === "scene") {
    return `${formatSceneNumber(node.index)} ${node.title}`;
  }
  return node.title;
}

/**
 * Inclusive start at scene_heading; exclusive end at next scene_heading
 * (or document end).
 */
export function getSceneBlockRange(
  blocks: DocumentBlock[],
  sourceBlockId: string,
): { start: number; end: number } | null {
  const start = blocks.findIndex(
    (block) => block.id === sourceBlockId && block.type === "scene_heading",
  );
  if (start < 0) {
    return null;
  }

  let end = blocks.length;
  for (let i = start + 1; i < blocks.length; i += 1) {
    if (blocks[i]?.type === "scene_heading") {
      end = i;
      break;
    }
  }

  return { start, end };
}

export function getSceneBlocks(
  blocks: DocumentBlock[],
  sourceBlockId: string,
): DocumentBlock[] {
  const range = getSceneBlockRange(blocks, sourceBlockId);
  if (!range) {
    return [];
  }
  return blocks.slice(range.start, range.end);
}

/** Scene stats preview — reuses document/language statistics primitives. */
export function computeSceneOutlineStats(
  blocks: DocumentBlock[],
  sourceBlockId: string,
): SceneOutlineStats {
  const sceneBlocks = getSceneBlocks(blocks, sourceBlockId);
  const counts = computeDocumentBlockCounts(sceneBlocks);

  let wordCount = 0;
  for (const block of sceneBlocks) {
    wordCount +=
      countEnglishWords(block.content) + countChineseCharacters(block.content);
  }

  return {
    blockCount: counts.totalBlocks,
    dialogueCount: counts.dialogueCount,
    wordCount,
  };
}

export function findOutlineNodeBySourceBlockId(
  nodes: OutlineNode[],
  sourceBlockId: string,
): OutlineNode | null {
  for (const node of nodes) {
    if (node.sourceBlockId === sourceBlockId) {
      return node;
    }
    if (node.children?.length) {
      const nested = findOutlineNodeBySourceBlockId(
        node.children,
        sourceBlockId,
      );
      if (nested) {
        return nested;
      }
    }
  }
  return null;
}
