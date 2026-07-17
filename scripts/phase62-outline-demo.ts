/**
 * Phase 6.2 — outline derivation + navigation helper smoke demo.
 * Run: npx tsx scripts/phase62-outline-demo.ts
 */
import { buildOutline } from "../lib/outline/buildOutline.ts";
import {
  computeSceneOutlineStats,
  formatOutlineLabel,
  getSceneBlocks,
} from "../lib/outline/outlineUtils.ts";
import { createDocumentBlock, type BlueBookDocument } from "../types/document.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  console.log("[phase62] Narrative outline demo\n");

  const document: BlueBookDocument = {
    id: "outline-demo",
    title: "Outline Demo",
    blocks: [
      createDocumentBlock("scene_heading", "INT. CAMP - NIGHT"),
      createDocumentBlock("action", "Embers drift."),
      createDocumentBlock("character", "JIN WEN GONG"),
      createDocumentBlock("dialogue", "Hold the line."),
      createDocumentBlock("scene_heading", "EXT. BATTLEFIELD - DAY"),
      createDocumentBlock("action", "Dust rises."),
      createDocumentBlock("dialogue", "Advance."),
      createDocumentBlock("scene_heading", "INT. TENT - LATER"),
      createDocumentBlock("action", "Maps on the table."),
    ],
  };

  // Stable ids for navigation checks
  document.blocks[0]!.id = "scene-a";
  document.blocks[4]!.id = "scene-b";
  document.blocks[7]!.id = "scene-c";

  const outline = buildOutline(document.blocks);
  console.log("Scenes:");
  for (const node of outline.nodes) {
    const stats = computeSceneOutlineStats(
      document.blocks,
      node.sourceBlockId,
    );
    console.log(
      `  ${formatOutlineLabel(node)}  [blocks=${stats.blockCount} dialogue=${stats.dialogueCount} words=${stats.wordCount}]`,
    );
  }

  assert(outline.nodes.length === 3, "expected 3 scenes");
  assert(outline.nodes[0]?.sourceBlockId === "scene-a", "scene 1 id");
  assert(outline.nodes[1]?.sourceBlockId === "scene-b", "scene 2 id");
  assert(outline.nodes[2]?.sourceBlockId === "scene-c", "scene 3 id");
  assert(
    outline.nodes[0]?.title === "INT. CAMP - NIGHT",
    "scene 1 title",
  );

  const scene2Blocks = getSceneBlocks(document.blocks, "scene-b");
  assert(scene2Blocks.length === 3, "scene 2 should have 3 blocks");
  assert(scene2Blocks[0]?.type === "scene_heading", "scene 2 starts with heading");

  // Navigation mapping: outline click → sourceBlockId → editor [data-id]
  const jumpTarget = outline.nodes[1]!;
  console.log(
    `\nNavigation: click "${formatOutlineLabel(jumpTarget)}" → scroll to block ${jumpTarget.sourceBlockId}`,
  );
  assert(
    document.blocks.some((block) => block.id === jumpTarget.sourceBlockId),
    "jump target must exist in DocumentBlock[]",
  );

  console.log("\n[phase62] All demonstrations passed");
}

main();
