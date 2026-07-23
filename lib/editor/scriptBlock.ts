import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ScriptBlockView } from "@/components/Editor/ScriptBlockView";
import {
  DEFAULT_BLOCK_METADATA,
  DEFAULT_BLOCK_STYLE,
  type BlockMetadata,
  type BlockStyle,
  type BlockTypeId,
  type DocumentLanguage,
} from "@/types/document";

export type ScriptBlockAttrs = {
  id: string;
  type: BlockTypeId;
  language: DocumentLanguage;
  style: BlockStyle;
  metadata: BlockMetadata;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    scriptBlock: {
      setScriptBlockType: (type: BlockTypeId) => ReturnType;
      updateScriptBlockAttrs: (
        attrs: Partial<ScriptBlockAttrs>,
      ) => ReturnType;
      deleteScriptBlock: () => ReturnType;
      renameScriptBlockContent: (content: string) => ReturnType;
    };
  }
}

function createAttrs(type: BlockTypeId): ScriptBlockAttrs {
  return {
    id: crypto.randomUUID(),
    type,
    language: "en",
    style: { ...DEFAULT_BLOCK_STYLE },
    metadata: { ...DEFAULT_BLOCK_METADATA },
  };
}

function findScriptBlockDepth($from: {
  depth: number;
  node: (depth: number) => { type: { name: string } };
}): number | null {
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === "scriptBlock") {
      return depth;
    }
  }
  return null;
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
        default: "action" satisfies BlockTypeId,
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

  addNodeView() {
    return ReactNodeViewRenderer(ScriptBlockView);
  },

  addCommands() {
    return {
      setScriptBlockType:
        (type) =>
        ({ commands, state }) => {
          const depth = findScriptBlockDepth(state.selection.$from);
          if (depth !== null) {
            return commands.updateAttributes("scriptBlock", { type });
          }

          return commands.insertContent({
            type: this.name,
            attrs: createAttrs(type),
          });
        },

      updateScriptBlockAttrs:
        (attrs) =>
        ({ commands, state }) => {
          const depth = findScriptBlockDepth(state.selection.$from);
          if (depth === null) {
            return false;
          }
          return commands.updateAttributes("scriptBlock", attrs);
        },

      deleteScriptBlock:
        () =>
        ({ state, dispatch, tr }) => {
          const { $from } = state.selection;
          const depth = findScriptBlockDepth($from);
          if (depth === null) {
            return false;
          }

          const from = $from.before(depth);
          const to = $from.after(depth);

          // Allow empty documents — do not force a replacement action block.
          if (dispatch) {
            dispatch(tr.delete(from, to).scrollIntoView());
          }
          return true;
        },

      renameScriptBlockContent:
        (content) =>
        ({ state, dispatch, tr }) => {
          const { $from } = state.selection;
          const depth = findScriptBlockDepth($from);
          if (depth === null) {
            return false;
          }

          const from = $from.start(depth);
          const to = $from.end(depth);
          if (dispatch) {
            const textNode =
              content.length > 0
                ? state.schema.text(content)
                : null;
            if (textNode) {
              dispatch(tr.replaceWith(from, to, textNode).scrollIntoView());
            } else {
              dispatch(tr.delete(from, to).scrollIntoView());
            }
          }
          return true;
        },
    };
  },
});
