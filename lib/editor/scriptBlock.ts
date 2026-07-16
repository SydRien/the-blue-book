import { mergeAttributes, Node } from "@tiptap/core";
import {
  DEFAULT_BLOCK_METADATA,
  DEFAULT_BLOCK_STYLE,
  type BlockMetadata,
  type BlockStyle,
  type DocumentLanguage,
  type ScriptBlockType,
} from "@/types/document";

export type ScriptBlockAttrs = {
  id: string;
  type: ScriptBlockType;
  language: DocumentLanguage;
  style: BlockStyle;
  metadata: BlockMetadata;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    scriptBlock: {
      setScriptBlockType: (type: ScriptBlockType) => ReturnType;
      updateScriptBlockAttrs: (
        attrs: Partial<ScriptBlockAttrs>,
      ) => ReturnType;
    };
  }
}

function createAttrs(type: ScriptBlockType): ScriptBlockAttrs {
  return {
    id: crypto.randomUUID(),
    type,
    language: "en",
    style: { ...DEFAULT_BLOCK_STYLE },
    metadata: { ...DEFAULT_BLOCK_METADATA },
  };
}

export const ScriptBlock = Node.create({
  name: "scriptBlock",
  group: "block",
  content: "inline*",
  defining: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => ({
          "data-id": attributes.id,
        }),
      },
      type: {
        default: "action" satisfies ScriptBlockType,
        parseHTML: (element) =>
          element.getAttribute("data-type") ?? "action",
        renderHTML: (attributes) => ({
          "data-type": attributes.type,
        }),
      },
      language: {
        default: "en" satisfies DocumentLanguage,
        parseHTML: (element) =>
          element.getAttribute("data-language") ?? "en",
        renderHTML: (attributes) => ({
          "data-language": attributes.language,
        }),
      },
      style: {
        default: { ...DEFAULT_BLOCK_STYLE },
      },
      metadata: {
        default: { ...DEFAULT_BLOCK_METADATA },
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-script-block]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const style = (node.attrs.style ?? DEFAULT_BLOCK_STYLE) as BlockStyle;

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-script-block": "",
        class: "script-block",
        style: `font-family: ${style.font}; font-size: ${style.size}px;`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setScriptBlockType:
        (type) =>
        ({ commands, state }) => {
          const { $from } = state.selection;

          for (let depth = $from.depth; depth > 0; depth -= 1) {
            if ($from.node(depth).type.name === "scriptBlock") {
              return commands.updateAttributes("scriptBlock", { type });
            }
          }

          return commands.insertContent({
            type: this.name,
            attrs: createAttrs(type),
          });
        },

      updateScriptBlockAttrs:
        (attrs) =>
        ({ commands, state }) => {
          const { $from } = state.selection;

          for (let depth = $from.depth; depth > 0; depth -= 1) {
            if ($from.node(depth).type.name === "scriptBlock") {
              return commands.updateAttributes("scriptBlock", attrs);
            }
          }

          return false;
        },
    };
  },

});
