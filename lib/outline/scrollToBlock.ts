import type { Editor } from "@tiptap/core";

/**
 * Scroll TipTap editor to a scriptBlock by DocumentBlock.id.
 * Returns true if the block was found.
 */
export function scrollEditorToBlock(
  editor: Editor | null,
  sourceBlockId: string,
): boolean {
  if (!editor || !sourceBlockId) {
    return false;
  }

  let foundPos: number | null = null;

  editor.state.doc.descendants((node, pos) => {
    if (
      node.type.name === "scriptBlock" &&
      node.attrs.id === sourceBlockId
    ) {
      foundPos = pos;
      return false;
    }
  });

  if (foundPos === null) {
    return false;
  }

  editor.chain().focus().setTextSelection(foundPos + 1).run();

  const escaped =
    typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(sourceBlockId)
      : sourceBlockId.replace(/"/g, '\\"');

  const element = editor.view.dom.querySelector(`[data-id="${escaped}"]`);
  if (element instanceof HTMLElement) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("script-block-outline-flash");
    window.setTimeout(() => {
      element.classList.remove("script-block-outline-flash");
    }, 900);
  }

  return true;
}
