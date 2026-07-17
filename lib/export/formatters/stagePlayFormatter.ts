import type { DocumentBlock, ScriptBlockType } from "@/types/document";
import type { ExportNode, ExportRole } from "@/lib/export/types";

const ROLE_BY_TYPE: Record<ScriptBlockType, ExportRole> = {
  scene_heading: "scene",
  action: "stage_direction",
  character: "character",
  dialogue: "dialogue",
};

function resolveRole(type: unknown): ExportRole | null {
  if (typeof type !== "string") {
    return null;
  }

  const normalized = type.trim().toLowerCase().replace(/-/g, "_");
  if (normalized in ROLE_BY_TYPE) {
    return ROLE_BY_TYPE[normalized as ScriptBlockType];
  }
  return null;
}

function toExportText(role: ExportRole, content: unknown): string {
  const text = typeof content === "string" ? content : String(content ?? "");

  if (role === "scene" || role === "character") {
    return text.trim().toUpperCase();
  }

  return text;
}

/**
 * Maps DocumentBlocks → ExportNode[] for stage play mode.
 *
 * - scene_heading → scene
 * - action        → stage_direction
 * - character     → character
 * - dialogue      → dialogue
 */
export function formatStagePlay(blocks: DocumentBlock[]): ExportNode[] {
  const nodes: ExportNode[] = [];

  for (const block of blocks) {
    if (block.metadata?.export === false) {
      continue;
    }

    const role = resolveRole(block.type);
    if (!role) {
      continue;
    }

    nodes.push({
      id: block.id,
      role,
      text: toExportText(role, block.content),
      language: block.language,
      font: block.style?.font,
      fontSize: block.style?.size,
    });
  }

  return nodes;
}
