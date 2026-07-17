import type { JSONContent } from "@tiptap/core";
import {
  DEFAULT_BLOCK_METADATA,
  DEFAULT_BLOCK_STYLE,
  isBlockTypeId,
  type BlueBookDocument,
  type DocumentBlock,
  type DocumentLanguage,
} from "@/types/document";

function extractText(node: JSONContent): string {
  if (typeof node.text === "string") {
    return node.text;
  }

  return (node.content ?? []).map(extractText).join("");
}

export function documentToTiptap(document: BlueBookDocument): JSONContent {
  return {
    type: "doc",
    content: document.blocks.map((block) => ({
      type: "scriptBlock",
      attrs: {
        id: block.id,
        type: block.type,
        language: block.language,
        style: block.style,
        metadata: block.metadata,
      },
      content: block.content
        ? [
            {
              type: "text",
              text: block.content,
            },
          ]
        : [],
    })),
  };
}

export function tiptapToBlocks(doc: JSONContent): DocumentBlock[] {
  return (doc.content ?? [])
    .filter((node) => node.type === "scriptBlock")
    .map((node) => {
      const attrs = node.attrs ?? {};
      const style =
        attrs.style && typeof attrs.style === "object"
          ? {
              font:
                typeof attrs.style.font === "string"
                  ? attrs.style.font
                  : DEFAULT_BLOCK_STYLE.font,
              size:
                typeof attrs.style.size === "number"
                  ? attrs.style.size
                  : DEFAULT_BLOCK_STYLE.size,
            }
          : { ...DEFAULT_BLOCK_STYLE };

      const metadata =
        attrs.metadata && typeof attrs.metadata === "object"
          ? {
              export:
                typeof attrs.metadata.export === "boolean"
                  ? attrs.metadata.export
                  : DEFAULT_BLOCK_METADATA.export,
            }
          : { ...DEFAULT_BLOCK_METADATA };

      return {
        id:
          typeof attrs.id === "string" && attrs.id.length > 0
            ? attrs.id
            : crypto.randomUUID(),
        type: isBlockTypeId(attrs.type) ? attrs.type.trim() : "action",
        content: extractText(node),
        language: (attrs.language === "zh" ? "zh" : "en") as DocumentLanguage,
        style,
        metadata,
      };
    });
}

export function tiptapToDocument(
  doc: JSONContent,
  base: Pick<BlueBookDocument, "id" | "title">,
): BlueBookDocument {
  return {
    id: base.id,
    title: base.title,
    blocks: tiptapToBlocks(doc),
  };
}
