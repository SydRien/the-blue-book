import {
  DEFAULT_BLOCK_METADATA,
  DEFAULT_BLOCK_STYLE,
  type BlueBookDocument,
  type DocumentBlock,
  type DocumentLanguage,
  type ScriptBlockType,
} from "@/types/document";

function isScriptBlockType(value: unknown): value is ScriptBlockType {
  return (
    value === "scene_heading" ||
    value === "action" ||
    value === "character" ||
    value === "dialogue"
  );
}

function isLanguage(value: unknown): value is DocumentLanguage {
  return value === "en" || value === "zh";
}

function normalizeBlock(value: unknown): DocumentBlock | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const block = value as Partial<DocumentBlock>;

  if (typeof block.id !== "string" || block.id.length === 0) {
    return null;
  }

  if (!isScriptBlockType(block.type)) {
    return null;
  }

  if (typeof block.content !== "string") {
    return null;
  }

  const style =
    block.style && typeof block.style === "object"
      ? {
          font:
            typeof block.style.font === "string"
              ? block.style.font
              : DEFAULT_BLOCK_STYLE.font,
          size:
            typeof block.style.size === "number"
              ? block.style.size
              : DEFAULT_BLOCK_STYLE.size,
        }
      : { ...DEFAULT_BLOCK_STYLE };

  const metadata =
    block.metadata && typeof block.metadata === "object"
      ? {
          export:
            typeof block.metadata.export === "boolean"
              ? block.metadata.export
              : DEFAULT_BLOCK_METADATA.export,
        }
      : { ...DEFAULT_BLOCK_METADATA };

  return {
    id: block.id,
    type: block.type,
    content: block.content,
    language: isLanguage(block.language) ? block.language : "en",
    style,
    metadata,
  };
}

export function parseStoredDocument(value: unknown): BlueBookDocument | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<BlueBookDocument>;

  if (typeof candidate.id !== "string" || candidate.id.length === 0) {
    return null;
  }

  if (typeof candidate.title !== "string") {
    return null;
  }

  if (!Array.isArray(candidate.blocks)) {
    return null;
  }

  const blocks = candidate.blocks
    .map(normalizeBlock)
    .filter((block): block is DocumentBlock => block !== null);

  if (blocks.length === 0) {
    return null;
  }

  return {
    id: candidate.id,
    title: candidate.title,
    blocks,
  };
}
