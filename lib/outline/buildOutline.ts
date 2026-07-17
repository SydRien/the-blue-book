import type { OutlineDocument, OutlineNode } from "@/lib/outline/types";
import type { DocumentBlock } from "@/types/document";

/**
 * Builds a flat scene outline from DocumentBlock[].
 * Only scene_heading blocks become outline nodes in MVP.
 */
export function buildOutline(blocks: DocumentBlock[]): OutlineDocument {
  const nodes: OutlineNode[] = [];
  let sceneIndex = 0;

  for (const block of blocks) {
    if (block.type !== "scene_heading") {
      continue;
    }

    sceneIndex += 1;
    const title = block.content.trim() || "Untitled Scene";

    nodes.push({
      id: `outline-scene-${block.id}`,
      type: "scene",
      title,
      sourceBlockId: block.id,
      index: sceneIndex,
      children: [],
    });
  }

  return { nodes };
}
