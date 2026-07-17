import type { DocumentBlock, ScriptBlockType } from "@/types/document";
import type { ExportNode, ExportRole } from "@/lib/export/types";

const ROLE_BY_TYPE: Record<ScriptBlockType, ExportRole> = {
  scene_heading: "scene_heading",
  action: "action",
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

  // Screenplay cues are traditionally uppercase; keep authored body text as-is.
  if (role === "scene_heading" || role === "character") {
    return text.trim().toUpperCase();
  }

  return text;
}

/**
 * Maps DocumentBlocks → ExportNode[] for screenplay mode.
 *
 * Supported mappings:
 * - scene_heading → { role: "scene_heading", text }
 * - action        → { role: "action", text }
 * - character     → { role: "character", text }
 * - dialogue      → { role: "dialogue", text }
 */
export function formatScreenplay(blocks: DocumentBlock[]): ExportNode[] {
  const nodes: ExportNode[] = [];

  for (const block of blocks) {
    const resolvedRole = resolveRole(block.type);

    if (block.metadata?.export === false) {
      continue;
    }

    const role = resolvedRole;
    if (!role) {
      continue;
    }

    const text = toExportText(role, block.content);

    nodes.push({
      id: block.id,
      role,
      text,
      language: block.language,
      font: block.style?.font,
      fontSize: block.style?.size,
    });
  }

  return nodes;
}
