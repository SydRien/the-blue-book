import { buildOutline } from "@/lib/outline/buildOutline";
import { formatSceneNumber } from "@/lib/outline/outlineUtils";
import type { CharacterRecord } from "@/lib/entities/characters/types";
import type { BlueBookDocument, DocumentBlock } from "@/types/document";

export type LinkedBlockRef = {
  blockId: string;
  type: string;
  snippet: string;
  sceneLabel: string | null;
  inCurrentDocument: boolean;
};

function sceneLabelForBlock(
  blocks: DocumentBlock[],
  blockId: string,
): string | null {
  const index = blocks.findIndex((block) => block.id === blockId);
  if (index < 0) {
    return null;
  }

  for (let i = index; i >= 0; i -= 1) {
    if (blocks[i]?.type === "scene_heading") {
      const outline = buildOutline(blocks);
      const node = outline.nodes.find(
        (item) => item.sourceBlockId === blocks[i]!.id,
      );
      if (node) {
        return `Scene ${formatSceneNumber(node.index)}`;
      }
      return blocks[i]!.content.trim() || "Scene";
    }
  }

  return null;
}

export function resolveLinkedBlocks(
  character: CharacterRecord,
  document: BlueBookDocument | null,
): LinkedBlockRef[] {
  const blocks = document?.blocks ?? [];
  const byId = new Map(blocks.map((block) => [block.id, block]));

  return character.linkedBlocks.map((blockId) => {
    const block = byId.get(blockId);
    if (!block) {
      return {
        blockId,
        type: "unknown",
        snippet: "(not in current document)",
        sceneLabel: null,
        inCurrentDocument: false,
      };
    }

    return {
      blockId,
      type: block.type,
      snippet: block.content.trim().slice(0, 48) || "(empty)",
      sceneLabel: sceneLabelForBlock(blocks, blockId),
      inCurrentDocument: true,
    };
  });
}

export function findCharacterForBlock(
  characters: CharacterRecord[],
  blockId: string,
): CharacterRecord | null {
  return (
    characters.find((character) => character.linkedBlocks.includes(blockId)) ??
    null
  );
}
