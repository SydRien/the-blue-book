import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

/**
 * Ensures every scriptBlock keeps a unique id after Enter/split/duplicate.
 */
export const UniqueBlockId = Extension.create({
  name: "uniqueBlockId",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("uniqueBlockId"),
        appendTransaction(transactions, _oldState, newState) {
          if (!transactions.some((transaction) => transaction.docChanged)) {
            return null;
          }

          const { tr } = newState;
          let modified = false;
          const seen = new Set<string>();

          newState.doc.descendants((node, pos) => {
            if (node.type.name !== "scriptBlock") {
              return;
            }

            const currentId =
              typeof node.attrs.id === "string" ? node.attrs.id : "";

            if (!currentId || seen.has(currentId)) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                id: crypto.randomUUID(),
              });
              modified = true;
              return;
            }

            seen.add(currentId);
          });

          return modified ? tr : null;
        },
      }),
    ];
  },
});
