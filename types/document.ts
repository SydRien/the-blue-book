/**
 * Document + block instance schema.
 * Block *type* catalog lives in lib/blocks (registry + entities).
 */

/** Classic screenplay types — still used by export formatters. */
export type ScriptBlockType =
  | "scene_heading"
  | "action"
  | "character"
  | "dialogue";

/** Built-in narrative types including interactive preparation. */
export type BuiltInBlockTypeId =
  | ScriptBlockType
  | "choice"
  | "interaction"
  | "trigger"
  | "system_note";

/** Any block type id: built-in or custom (`custom_<uuid>`). */
export type BlockTypeId = string;

export type DocumentLanguage = "en" | "zh";

export type BlockStyle = {
  font: string;
  size: number;
};

export type BlockMetadata = {
  export: boolean;
};

export type DocumentBlock = {
  id: string;
  type: BlockTypeId;
  content: string;
  language: DocumentLanguage;
  style: BlockStyle;
  metadata: BlockMetadata;
};

export type BlueBookDocument = {
  id: string;
  title: string;
  blocks: DocumentBlock[];
};

/**
 * @deprecated Prefer block registry (`listBlockDefinitions`).
 * Kept for compatibility with code that still imports the static list.
 */
export const SCRIPT_BLOCK_TYPES: {
  id: ScriptBlockType;
  label: string;
  accent: string;
}[] = [
  { id: "scene_heading", label: "Scene Heading", accent: "var(--led-blue)" },
  { id: "action", label: "Action", accent: "var(--led-cyan)" },
  { id: "character", label: "Character", accent: "var(--led-orange)" },
  { id: "dialogue", label: "Dialogue", accent: "var(--led-green)" },
];

export const DEFAULT_BLOCK_STYLE: BlockStyle = {
  font: "Courier New",
  size: 12,
};

export const DEFAULT_BLOCK_METADATA: BlockMetadata = {
  export: true,
};

export function isBlockTypeId(value: unknown): value is BlockTypeId {
  return typeof value === "string" && value.trim().length > 0;
}

export function createDocumentBlock(
  type: BlockTypeId,
  content = "",
): DocumentBlock {
  return {
    id: crypto.randomUUID(),
    type,
    content,
    language: "en",
    style: { ...DEFAULT_BLOCK_STYLE },
    metadata: { ...DEFAULT_BLOCK_METADATA },
  };
}

export function createSeedDocument(): BlueBookDocument {
  return {
    id: crypto.randomUUID(),
    title: "Script",
    blocks: [],
  };
}
