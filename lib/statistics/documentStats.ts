import type { DocumentBlock } from "@/types/document";
import type { DocumentBlockCounts } from "@/lib/statistics/types";

function normalizeCharacterName(content: string): string {
  return content.trim().replace(/\s+/g, " ").toUpperCase();
}

export function computeDocumentBlockCounts(
  blocks: DocumentBlock[],
): DocumentBlockCounts {
  let sceneCount = 0;
  let actionCount = 0;
  let dialogueCount = 0;
  const characters = new Set<string>();

  for (const block of blocks) {
    switch (block.type) {
      case "scene_heading":
        sceneCount += 1;
        break;
      case "action":
        actionCount += 1;
        break;
      case "dialogue":
        dialogueCount += 1;
        break;
      case "character": {
        const name = normalizeCharacterName(block.content);
        if (name) {
          characters.add(name);
        }
        break;
      }
    }
  }

  return {
    totalBlocks: blocks.length,
    sceneCount,
    actionCount,
    dialogueCount,
    characterCount: characters.size,
  };
}

export { normalizeCharacterName };
