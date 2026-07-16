export type ScriptBlockType =
  | "scene_heading"
  | "action"
  | "character"
  | "dialogue";

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
  type: ScriptBlockType;
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

export function createDocumentBlock(
  type: ScriptBlockType,
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
    id: "doc-seed-script",
    title: "Script",
    blocks: [
      createDocumentBlock("scene_heading", "INT. CAMP - NIGHT"),
      createDocumentBlock(
        "action",
        "The wind moves across the battlefield.",
      ),
      createDocumentBlock("character", "JIN WEN GONG"),
      createDocumentBlock("dialogue", "We cannot retreat."),
    ],
  };
}
